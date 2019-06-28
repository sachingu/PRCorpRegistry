const sql = require('mssql');
const config = require('./config');

async function storeRecordsForRegistry(registryEntry) {
    try {
        await sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
        const request = new sql.Request();
        const existingCorporations = await getExistingCorporations(request, registryEntry.registerNumber);
        const newCorporations = registryEntry.corporations.filter(corp => !existingCorporations.some(existing => existing.crpUrl == corp.url));
        for (var corporation of newCorporations) {
            const corporationID = await storeGeneralDetails(request, registryEntry.registerNumber, corporation);
            await storeFormation(request, corporationID, corporation.formation);
            await storeAuthPersons(request, corporationID, corporation.authPersons);
            await storeAdministrators(request, corporationID, corporation.administrators);
            await storeBalanceSheet(request, corporationID, corporation.balanceSheetDetails);
            await storeAnnualDetailsAndOfficers(request, corporationID, corporation.annualDetails);
        }
    }

    catch (ex) {
        console.log(ex);
        throw err;
    }
    finally {
        await sql.close();
    }

}

function checkForValue(value) {
    return value ? `'${value}'` : null;
}

async function storeGeneralDetails(request, registerNumber, corporation) {
    const insertCorporationQuery = `INSERT INTO CORPORATION(crpRegisterNo, crpUrl, crpName, crpClass, crpType, crpStatus, crpJurisdiction, crpRAName, crpRAStreet1, crpRAStreet2, crpRAStreet3, crpMAStreet1, crpMAStreet2, crpMAStreet3, createdAt, updatedAt)
      VALUES (
          ${registerNumber},
          ${checkForValue(corporation.url)},
          ${checkForValue(corporation.name)},
          ${checkForValue(corporation.generalDetails.crpClass)},
          ${checkForValue(corporation.generalDetails.crpType)},
          ${checkForValue(corporation.generalDetails.crpStatus)},
          ${checkForValue(corporation.generalDetails.crpJurisdiction)},
          ${checkForValue(corporation.generalDetails.corpRAName)},
          ${checkForValue(corporation.generalDetails.crpRAStreet1)},
          ${checkForValue(corporation.generalDetails.crpRAStreet2)},
          ${checkForValue(corporation.generalDetails.crpRAStreet3)},
          ${checkForValue(corporation.generalDetails.crpMAStreet1)},
          ${checkForValue(corporation.generalDetails.crpMAStreet2)},
          ${checkForValue(corporation.generalDetails.crpMAStreet3)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP);
            select @@IDENTITY as id;`;
    const result = await request.query(insertCorporationQuery);
    const corporationID = result.recordset[0].id;
    return corporationID;
}

async function storeBalanceSheet(request, corporationID, balanceSheetDetails) {
    if (!balanceSheetDetails || !balanceSheetDetails.length) {
        return;
    }

    const combinedInserts = balanceSheetDetails.map(balanceSheetDetail =>
        `INSERT INTO BalanceSheet(crpID, balYear, balCurAssets, balPropEq, balOthAssets, balTotAssets, balCurLiabilities, balLTLiabilities, balEquity, balTLE, createdAt, updatedAt)
        VALUES  (${corporationID},
            ${balanceSheetDetail.year},
            ${balanceSheetDetail.balCurAssets},
            ${balanceSheetDetail.balPropEq},
            ${balanceSheetDetail.balOthAssets},
            ${balanceSheetDetail.balTotAssets},
            ${balanceSheetDetail.balCurLiabilities},
            ${balanceSheetDetail.balLTLiabilities},
            ${balanceSheetDetail.balEquity},
            ${balanceSheetDetail.balTLE},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP);`).join('\n');
    const result = await request.query(combinedInserts);
    return result.recordset;
}

async function storeFormation(request, corporationID, formation) {
    if (!formation) {
        return;
    }

    const query = `INSERT INTO Formation(crpID, forStreet, forMail, forRAName, forRAStreet, forRAMail, forRAEMail, forNature, createdAt, updatedAt)
        VALUES  (${corporationID},
            ${checkForValue(formation.forStreet)},
            ${checkForValue(formation.forMail)},
            ${checkForValue(formation.forRAName)},
            ${checkForValue(formation.forRAStreet)},
            ${checkForValue(formation.forRAMail)},
            ${checkForValue(formation.forRAEMail)},
            ${checkForValue(formation.forNature)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP);`;
    const result = await request.query(query);
    return result.recordset;
}

async function storeAuthPersons(request, corporationID, authPersons) {
    if (!authPersons || !authPersons.length) {
        return;
    }

    const combinedInserts = authPersons.map(autPerson =>
        `INSERT INTO AuthPersons(crpID, autSeq, autName, autStreet, autMail, autEMail, createdAt, updatedAt)
        VALUES  (${corporationID},
            ${autPerson.autSeq},
            ${checkForValue(autPerson.autName)},
            ${checkForValue(autPerson.autStreet)},
            ${checkForValue(autPerson.autMail)},
            ${checkForValue(autPerson.autEmail)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP);`).join('\n');
    const result = await request.query(combinedInserts);
    return result.recordset;
}

async function storeAdministrators(request, corporationID, administrators) {
    if (!administrators || !administrators.length) {
        return;
    }

    const combinedInserts = administrators.map(admin =>
        `INSERT INTO Administrators(crpID, admSeq, admName, admTitle, admStreet, admMail, admEMail, createdAt, updatedAt)
        VALUES  (${corporationID},
            ${admin.admSeq},
            ${checkForValue(admin.admName)},
            ${checkForValue(admin.admTitle)},
            ${checkForValue(admin.admStreet)},
            ${checkForValue(admin.admMail)},
            ${checkForValue(admin.admEmail)},
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP);`).join('\n');
    const result = await request.query(combinedInserts);
    return result.recordset;
}

async function storeAnnualDetailsAndOfficers(request, corporationID, annualDetails) {
    async function storeAnnual(request, corporationID, annualDetail) {
        const query = `INSERT INTO Annual(crpID, annYear, annName, annStreet, annPhone, annEmail, createdAt, updatedAt)
            VALUES  (${corporationID},
                ${annualDetail.year},
                ${checkForValue(annualDetail.annName)},
                ${checkForValue(annualDetail.annStreet)},
                ${checkForValue(annualDetail.annPhone)},
                null,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP);`;
        const result = await request.query(query);
        return result.recordset;
    }

    async function storeOfficers(request, corporationID, year, officers) {
        if (!officers || !officers.length) {
            return;
        }

        const combinedInserts = officers.map(officer =>
            `INSERT INTO Officers(crpID, offYear, offSeq, offName, offTitle, offMail, createdAt, updatedAt)
            VALUES  (${corporationID},
                ${year},
                ${officer.offSeq},
                ${checkForValue(officer.offName)},
                ${checkForValue(officer.offTitle)},
                ${checkForValue(officer.offMail)},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP);`).join('\n');
        const result = await request.query(combinedInserts);
        return result.recordset;
    }

    if (!annualDetails || !annualDetails.length) {
        return;
    }

    for (let annualDetail of annualDetails) {
        await storeAnnual(request, corporationID, annualDetail);
        await storeOfficers(request, corporationID, annualDetail.year, annualDetail.officers);
    }
}

async function getExistingCorporations(request, registerNumber) {
    const result = await request.query(`select crpUrl, crpName from Corporation where crpRegisterNo=${registerNumber}`);
    return result.recordset;
}

async function checkForRecord(registerNumber, corpName) {
    await sql.close();
    try {
        //close sql connections if any   
        await sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
        const request = new sql.Request();
        let query = `SELECT * FROM CORPORATION WHERE crpRegisterNo=${registerNumber} AND crpName='${corpName}'`;
        let recordInDB = await request.query(query);
    }
    catch (ex) {
        console.log(ex);
    }
    finally {
        await sql.close();
    }
}
async function fetchRecords(registerNumber) {
    try {
        let registryData={};
        console.log(registryNumber);
        await sql.connect(`mssql://${config.database.username}:${config.database.password}@${config.database.endpoint}/${config.database.name}`);
        const request = new sql.Request();
        let query = `select cr.* from CORPORATION cr WHERE cr.crpRegisterNo=${registryNumber}`
        let crpRecords = await request.query(query);
        registryData.registerNumber=registryNumber;
        if((crpRecords.rowsAffected[0])>0)
        {
            let crpRecordSets = (Array.from(crpRecords.recordset));
            let crpIDs = [];
            registryData.corporations=[];
            for (let i = 0; i < crpRecordSets.length; i++) {
                crpIDs.push(crpRecordSets[i].crpID);
                //TODO: condense these lines and pass the parameters to a method
                let corporation={};
                let generalDetails={};
                corporation.name=crpRecordSets[i].crpName;
                corporation.url=crpRecordSets[i].crpUrl;
                generalDetails.crpRegisterNo=crpRecordSets[i].crpRegisterNo;
                generalDetails.crpName=crpRecordSets[i].crpName;
                generalDetails.crpClass=crpRecordSets[i].crpClass;
                generalDetails.crpType=crpRecordSets[i].crpType;
                generalDetails.crpStatus=crpRecordSets[i].crpStatus;
                generalDetails.crpJurisdiction=crpRecordSets[i].crpJurisdiction;
                generalDetails.crpRAName=crpRecordSets[i].crpRAName;
                generalDetails.crpRAStreet1=crpRecordSets[i].crpRAStreet1;
                generalDetails.crpRAStreet2=crpRecordSets[i].crpRAStreet2;
                generalDetails.crpRAStreet3=crpRecordSets[i].crpRAStreet3;
                generalDetails.crpMAStreet1=crpRecordSets[i].crpMAStreet1;
                generalDetails.crpMAStreet2=crpRecordSets[i].crpMAStreet2;
                generalDetails.crpMAStreet3=crpRecordSets[i].crpMAStreet3; 
                corporation.generalDetails=generalDetails;  
                corporation.generalDetails=generalDetails;
            }  
            query = `select * from FORMATION fr WHERE fr.crpID in (${crpIDs})`;
            let formationRecords = await request.query(query);
            query = `SELECT * FROM AuthPersons ap WHERE ap.crpID in (${crpIDs})`;
            let authPersonsRecords = await request.query(query);
            query = `SELECT * FROM Administrators ad WHERE ad.crpID in (${crpIDs})`
            let administratorsRecords = await request.query(query);
            query = `SELECT * FROM BalanceSheet bs WHERE bs.crpID in (${crpIDs})`;
            let balanceSheetRecords = await request.query(query);
            query = `SELECT * FROM Annual an WHERE an.crpID in (${crpIDs})`;
            let annualRecords = await request.query(query);
            query = `SELECT * FROM Officers oi WHERE oi.crpID in (${crpIDs})`;
            let officersRecords = await request.query(query);
        }
        // if(crpIdRecords)
       
    }
    catch (ex) {
        console.log(ex);
    }
    finally {
        await sql.close();
    }
}

fetchRecords(322510);
module.exports.storeRecordsForRegistry = storeRecordsForRegistry;
module.exports.checkForRecord = checkForRecord;