const Pool = require("pg").Pool;

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "hieu123",
  port: 5432,
  database: "qnx_db"
});

module.exports = pool;