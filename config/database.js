require('dotenv').config()
const mysql = require('mysql2');

// const dbConnection = mysql.createConnection({
//     host     : 'localhost', 
//     user     : 'root', 
//     password : '', 
//     database : 'clipartpress' 
// }).promise();

const dbConnection = mysql.createConnection(process.env.DATABASE_URL)
dbConnection.connect(function(err){
    if(err) throw err;
    console.log("Connected Database.")
})
module.exports = dbConnection;   