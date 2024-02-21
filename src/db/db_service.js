const { Client } = require("pg");

const client = new Client({
  hot: "localhost",
  user: "postgres",
  port: 5432,
  password: "root123",
  database: "postgres",
});

const createContactTable = async () => {
  client.connect();

  await client.query(`
    CREATE TABLE Contact(
    ids SERIAL PRIMARY KEY,
    phoneNumber VARCHAR(20),
    email VARCHAR(50),
    linkedId INT,
    linkPrecedence VARCHAR(50) NOT NULL,
    createdAT TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL,
    deletedAt TIMESTAMP,
    FOREIGN KEY (linkedId) REFERENCES Contact(ids)
  );`);
};

const insertIntoContact = async (email, phoneNumber) => {
  client.connect();

  // Check if email is null or undefined
  if (email === undefined || email === null) {
    email = "null";
  }

  // Check if phoneNumber is null or undefined
  if (phoneNumber === undefined || phoneNumber === null) {
    phoneNumber = "null";
  }

  let data = [];

  // Get all the data which have either the same phone number or email. But at least one must be present
  const contacts = await client.query(
    `
      SELECT *
      FROM Contact
      WHERE (phonenumber = '${phoneNumber}' OR email = '${email}')
      AND (phonenumber IS NOT NULL OR email IS NOT NULL);
    `
  );
  data = contacts.rows;

  let morePrimary = [];

  // if the data got is empty then insert the phonenumber and email as a new primary linkedprecedence entry
  if (contacts.rows.length === 0) {
    await client.query(`
        insert into contact(phoneNumber, email,linkprecedence,createdat,updatedat)
        values('${phoneNumber}', '${email}', 'primary','${new Date().toISOString()}','${new Date().toISOString()}')
    `);
  } else {
    morePrimary = data.filter(
      (contact) => contact.linkprecedence === "primary"
    );

    console.log("This is the more primary one", morePrimary);

    // if the the filtered primary array has no primary contact item then get the primary item that the earliest made secondary item linkedId refers to.
    if (morePrimary.length === 0) {
      console.log("This is when primary is 0");
      let firstSec = data.sort(
        (a, b) =>
          new Date(a.createdat).getTime() - new Date(b.createdat).getTime()
      );

      let primaryRec = await client.query(`
        select * from contact 
        where ids = ${firstSec[0].linkedid}
      `);

      console.log("This is the primary rec", primaryRec.rows);

      morePrimary.push(primaryRec.rows[0]);
    }

    // if there are more than one primary key make the rest of contact item refer to the primary item which was made the earliest
    if (morePrimary.length > 1) {
      morePrimary.sort(
        (a, b) =>
          new Date(a.createdat).getTime() - new Date(b.createdat).getTime()
      );

      let smlRec = morePrimary[0];

      // update the data with primary linkedprecedence contact to secondary linkedprecedence
      data.map((cntct) => {
        if (cntct.ids === smlRec.ids) {
          cntct.updatedat = new Date().toISOString();
          return cntct;
        } else {
          cntct.linkprecedence = "secondary";
          cntct.linkedid = smlRec.ids;
          cntct.updatedat = new Date().toISOString();
          return cntct;
        }
      });

      // Update the db
      for (let contact of data) {
        if ((contact.ids = smlRec.ids)) {
          await client.query(`
            UPDATE contact
            set updatedat=${contact.updatedat}
            where ids = ${contact.ids}
          `);
        } else {
          await client.query(`
          update contact
          set updatedat=${contact.updatedat}, linkedid = ${contact.linkedid}, linkprecedence = ${contact.linkprecedence}
          `);
        }
      }
    }

    let recAbst = true;

    // Check whether the incoming phone number and email both already exists as one contact record or not
    data.forEach((e) => {
      if (email === e.email && phoneNumber === e.phonenumber) {
        recAbst = false;
      }
    });

    console.log(recAbst);

    // if it doesn't exist then create a new secondary precedence contact entry.
    if (recAbst) {
      await client.query(`
        insert into contact(phonenumber,email,linkedid, linkprecedence,createdat, updatedat)
        values('${phoneNumber}','${email}','${
        morePrimary[0].ids
      }','secondary','${new Date().toISOString()}','${new Date().toISOString()}')
      `);
    }
  }

  let cntId = [];
  let phoneNumbers = [];
  let emails = [];
  let primaryContatctId = "";

  // Initialize the arrays and set the primarycontactId
  if (contacts.rows.length === 0) {
    phoneNumbers = [phoneNumber];
    emails = [email];

    let currItem = await client.query(`
      select ids from contact 
      where phonenumber = '${phoneNumber}' and email = '${email}'
    `);
    console.log(currItem.rows[0].ids);
    primaryContatctId = currItem.rows[0].ids;
  } else {
    phoneNumbers = [morePrimary[0].phonenumber];
    emails = [morePrimary[0].email];
    primaryContatctId = morePrimary[0].ids;
  }

  // Get all the items with either the phonenumber or email present with linkprecedence being secondary
  let items = await client.query(`
  SELECT *
        FROM Contact
        WHERE (phonenumber = '${phoneNumber}' OR email = '${email}')
        AND (phonenumber IS NOT NULL OR email IS NOT NULL)
        AND (linkprecedence = 'secondary')
  `);

  // If repeated email and phone number is not allowed, uncomment it out if you would want it.

  // items.rows.forEach((e) => {
  //   cntId.push(e.ids);
  //   if (!phoneNumbers.includes(e.phonenumber) && e.phonenumber !== "null") {
  //     phoneNumbers.push(e.phonenumber);
  //   }
  //   if (!emails.includes(e.email) && e.email !== "null") {
  //     emails.push(e.email);
  //   }
  // });

  // If repeated email and phone number is allowed and null is also allowed
  items.rows.forEach((e) => {
    cntId.push(e.ids);
    phoneNumbers.push(e.phonenumber);
    emails.push(e.email);
  });

  // Create the return object
  let retrnObj = {
    contact: {
      primaryContatctId: primaryContatctId,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: cntId,
    },
  };

  client.end();

  console.log(retrnObj);

  return retrnObj;
};

module.exports = {
  insertIntoContact,
};
