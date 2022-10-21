/*const Pool = require("pg").Pool;
const pool = new Pool({
  host: "localhost",
  user: "hieu",
  password: "123",
  port: 5432,
  database: "qnx"
});
module.exports = pool;
*/
const { Pool} = require('pg')
const connectionString = 'postgresql://hieu:123@172.31.234.171:5432/qnx'
const pool = new Pool({
  connectionString,
})
module.exports = pool;