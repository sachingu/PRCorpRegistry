const sql = require('mssql');
const config = require('./config');

async function storeRecordsForRegistry(registryEntry)
{
        await sql.close();
        await sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
        const request = new sql.Request();
              for (var corporation of registryEntry.corporations) {
                  const insertCorporationQuery=`INSERT INTO CORPORATION(crpRegisterNo,crpUrl,crpName,crpClass,crpType,crpStatus
                     ,crpJurisdiction,crpRAName,crpRAStreet1,crpRAStreet2,crpRAStreet3 ,crpMAStreet1 ,crpMAStreet2 ,crpMAStreet3)
                   VALUES 
                  (${registryEntry.registerNumber},'${corporation.url}','${corporation.name}','${corporation.generalDetails.crpClass}'
                     ,'${corporation.generalDetails.crpType}','${corporation.generalDetails.crpStatus}'
                     ,'${corporation.generalDetails.crpJurisdiction}'
                     ,${checkForValue(corporation.generalDetails.corpRAName)}
                     ,${checkForValue(corporation.generalDetails.crpRAStreet1)}
                     ,${checkForValue(corporation.generalDetails.crpRAStreet2)}
                     ,${checkForValue(corporation.generalDetails.crpRAStreet3)}
                     ,${checkForValue(corporation.generalDetails.crpMAStreet1)}
                     ,${checkForValue(corporation.generalDetails.crpMAStreet2)}
                     ,${checkForValue(corporation.generalDetails.crpMAStreet3)}) select @@IDENTITY as id`;
                   let result= await request.query(insertCorporationQuery);  
                   let corporationID=result.recordset[0].id;
                   console.log(corporationID);
                   //TODO: check if id is available (corner case)
                   for(var annualDetail in corporation.annualDetails)
                   {
                        let insertAnnualQuery=`INSERT INTO ANNUAL(crpID ,annYear,annName,annStreet,annPhone)
                        VALUES(${corporationID},${annualDetail.year},'${annualDetail.annName}','${annualDetail.annStreet}',${annualDetail.annPhone},
                        )`;
                        let annualResult=await request.query(insertAnnualQuery);
                        console.log(annualResult);
                   }
                }
}

async function storeFormations(registryEntry)
{
    await sql.close();
    await  sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
    const request = new sql.Request();
    for(let formation in registryEntry.formation)
    {

    }
}

function checkForValue(value)
{
    return value?`'${value}'`:null;
}
// async function fetchCorporations()
// {
//         await sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
//         const request = new sql.Request();
//         const query='SELECT * FROM Corporation';
//         let result=await request.query(query);
//         console.log(result);    
// }
// fetchCorporations();
module.exports.storeRecordsForRegistry = storeRecordsForRegistry;
