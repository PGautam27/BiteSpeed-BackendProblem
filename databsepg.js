const { Client } = require("pg");

const client = new Client({
  hot: "localhost",
  user: "postgres",
  port: 5432,
  password: "root123",
  database: "postgres",
});

const postContact = async (req) => {
  const isemailNull = req.email === null || req.email === undefined;
  const isphoneNumber =
    req.phoneNumber === null || req.phoneNumber === undefined;

  if (isemailNull && isphoneNumber) {
    return { message: "NOT VALID CONTACT" };
  } else {
  }

  const x = await insertIntoContact("mello@gmail.com");
};

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

  if (email === undefined || email === null) {
    email = "null";
  }

  if (phoneNumber === undefined || phoneNumber === null) {
    phoneNumber = "null";
  }

  let data = [];
  const contacts = await client.query(
    `
      SELECT *
      FROM Contact
      WHERE (phonenumber = '${phoneNumber}' OR email = '${email}')
      AND (phonenumber IS NOT NULL OR email IS NOT NULL);
    `
  );

  console.log(contacts.rows);

  data = contacts.rows;
  let morePrimary = [];
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

    if (morePrimary.length > 1) {
      morePrimary.sort(
        (a, b) =>
          new Date(a.createdat).getTime() - new Date(b.createdat).getTime()
      );

      let smlRec = morePrimary[0];

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

      console.log("This is the secondary data", data);

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

    data.forEach((e) => {
      if (email === e.email && phoneNumber === e.phonenumber) {
        recAbst = false;
      }
    });

    console.log(recAbst);

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

  if (contacts.rows.length === 0) {
    phoneNumber = [phoneNumber];
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

  let retrnObj = {
    contact: {
      primaryContatctId: primaryContatctId,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: cntId,
    },
  };

  console.log(retrnObj);

  client.end();
};

postContact();
