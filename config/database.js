const mysql = require('mysql2');

const dbConnection = mysql.createConnection({
    host     : 'localhost', 
    user     : 'root', 
    password : '', 
    database : 'clipartpress' 
}).promise();

dbConnection.connect(function(err){
    if(err) throw err;
    console.log("Connected Database.")
})
module.exports = dbConnection;