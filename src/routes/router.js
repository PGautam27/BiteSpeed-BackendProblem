const { insertIntoContact } = require("../db/databasepg.js");
const express = require("express");
const router = express.Router();

router.post("/identify", async (req, res) => {
  const isemailNull = req.email === null || req.email === undefined;
  const isphoneNumber =
    req.phoneNumber === null || req.phoneNumber === undefined;

  if (isemailNull && isphoneNumber) {
    res.status(400).json({ message: "NOT VALID CONTACT" });
  } else {
    const contactObj = await insertIntoContact(req.email, req.phoneNumber);
    res.status(200).json(contactObj);
  }
});
