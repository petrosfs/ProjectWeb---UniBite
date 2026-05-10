const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:             process.env.DB_HOST || 'localhost',
  user:             process.env.DB_USER || 'root',
  password:         process.env.DB_PASS || '',
  database:         process.env.DB_NAME || 'unibite',
  waitForConnections: true,
  connectionLimit:  10,
  timezone:         '+00:00',
});

module.exports = pool;
