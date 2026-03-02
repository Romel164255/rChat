const { Pool } = require("pg");

const pool = new Pool({
  user: "chatuser",
  host: "localhost",
  database: "chatapp",
  password: "987654321",
  port: 5432,
});

module.exports = pool;