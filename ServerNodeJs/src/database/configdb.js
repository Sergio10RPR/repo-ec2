const {createPool} = require('promise-mysql');
const {keys} = require('./keys');

async function connect(){
    const pool = createPool(keys.database);
    console.log(keys.database.host);
    console.log(keys.database.user);
    console.log(keys.database.password);
    console.log(keys.database.database);
    console.log('database connected')
    return pool;
}

exports.connect = connect;