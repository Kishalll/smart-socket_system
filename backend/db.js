const mysql = require('mysql2');

// Using a pool for better performance and reliability
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'appuser',
    password: 'password',
    database: 'smart_socket',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise(); // Using promise-based API
