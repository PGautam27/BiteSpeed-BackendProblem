const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  port: process.env.PG_PORT,
  password: process.env.PG_PASS,
  database: process.env.PG_DB,
});

module.exports = { client };
