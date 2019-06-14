const sql = require('mssql');
const config = require('./config');

async function storeCorporations(registryEntry) {
    await sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
    const request = new sql.Request();
    for (let corporation of registryEntry.corporations) {
        const query = `INSERT INTO Corporation(crpRegisterNo, crpUrl, crpName)
        VALUES(${registryEntry.registerNumber}, "${corporation.url}", "${corporation.name.replace(",", "")}");`;
        console.log(query);
        await request.query(query);
    }
}

module.exports.storeCorporations = storeCorporations;