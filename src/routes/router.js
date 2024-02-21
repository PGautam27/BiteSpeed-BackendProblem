const { insertIntoContact } = require("../utils/utils.js");
const express = require("express");
const router = express.Router();

router.post("/identify", async (req, res) => {
  let { email, phoneNumber } = req.body;

  const isemailNull = email === null || email === undefined;
  const isphoneNumber = phoneNumber === null || phoneNumber === undefined;

  if (isemailNull && isphoneNumber) {
    res.status(400).json({ message: "NOT_VALID_CONTACT" });
  } else {
    const contactObj = await insertIntoContact(email, phoneNumber);
    res.status(200).json(contactObj);
  }
});

module.exports = router;
