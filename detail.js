const puppeteer = require('puppeteer');
const fs = require('fs');
var uuid = require('uuid/v4');
const path = require('path');
var pdfText = require('pdf-text')
let browser = null;
var _ = require('lodash');

async function getCorporationData(url, page = null) {
    if (!page) {
        browser = await puppeteer.launch({
            headless: true
        });
        page = await browser.newPage();
        await page.setExtraHTTPHeaders({
            'accept-language': 'en-US,en;q=0.8'
        });
    }

    const generalDetails = await getGeneralDetails(url, page);
    // const formationDetails = await getFormationDetailsFromFiles(page);
    const annualDetails = await getAnnualDetailsFromFiles(page);

    if (browser) {
        await browser.close();
    }

    const result = {
        generalDetails: generalDetails,
        // ...formationDetails,
        annualDetails
    };

    return result;
}

async function getGeneralDetails(url, page) {
    const generalDetailSelectors = {
        crpRegisterNo: 'span[id$=spGeneralInfo_CorpRegisterNumberValue]',
        crpName: 'span[id$=spGeneralInfo_CorpNameValue]',
        crpClass: 'span[id$=spGeneralInfo_CorpClassValue]',
        crpType: 'span[id$=spGeneralInfo_CorpTypeValue]',
        crpStatus: 'span[id$=spGeneralInfo_StatusValue]',
        crpJurisdiction: 'span[id$=spGeneralInfo_JurisdictionValue]',
        corpRAName: 'span[id$=spResidentAgent_ResidentAgentNameValue]',
        crpRAStreet: 'span[id$=spResidentAgent_ResidentAgentDesignatedStreetAddressValue]',
        crpMAStreet: 'span[id$=spResidentAgent_ResidentAgentDesignatedMailingAddressValue]',
    }

    await page.goto(url);
    await page.waitForSelector('#rootTabs');
    let result = {};
    for (let [key, value] of Object.entries(generalDetailSelectors)) {
        try {
            result[key] = await page.$eval(value, el => el.innerText);
            // transform Street into Street1, Street2 and Street3
            if (key.endsWith('Street')) {
                const addressParts = result[key].split('\n');
                for (addressPartIndex = 0; addressPartIndex < 3; addressPartIndex++) {
                    result[`${key}${addressPartIndex+1}`] = addressParts[addressPartIndex];
                }

                // remove original Street property
                delete result[key];
            }
        } catch (ex) {
            // console.log(`${key} not found for ${url}`);
            result[key] = undefined;
        }
    }

    return result;
}

async function getFormationDetailsFromFiles(page) {
    function extractDetailsFromText(lines) {
        function extractAdministratorsFromText(lines) {
            const persons = [];
            let nameIndex = null;
            let currentPerson = {};
            for (index = lines.length; index > 0; index--) {
                let currentLine = lines[index];
                if (currentLine == 'Title') {
                    currentPerson.title = lines[index + 1];
                } else if (currentLine == 'Email') {
                    currentPerson.email = lines[index + 1];
                } else if (currentLine == 'Name') {
                    currentPerson.name = lines[index + 1];
                    nameIndex = index;
                } else if (currentLine == 'Mailing Address') {
                    for (let addressIndex = index + 1; addressIndex <= nameIndex; addressIndex++) {
                        currentLine = lines[addressIndex];
                        const addressEndRegex = /PR[, ]+[\d-]{5,}$/;
                        if (addressEndRegex.test(currentPerson.streetAddress) && addressEndRegex.test(currentPerson.mailingAddress)) {
                            persons.push(currentPerson);
                            currentPerson = {};
                            nameIndex = null;
                            break;
                        } else {
                            if (!addressEndRegex.test(currentPerson.streetAddress)) {
                                currentPerson.streetAddress = currentPerson.streetAddress ? `${currentPerson.streetAddress} ${currentLine}`: currentLine;
                            } else {
                                currentPerson.mailingAddress = currentPerson.mailingAddress ? `${currentPerson.mailingAddress} ${currentLine}`: currentLine;
                            }
                        }
                    }
                }
            }
    
            return persons;
        }

        const maFirstIndex = lines.indexOf('Mailing Address');
        const maSecondIndex = lines.indexOf('Mailing Address', maFirstIndex);
        const raNameIndex = lines.indexOf('Name');
        const raEmailIndex = lines.indexOf('Email');
        const forNatureIndex = _.findIndex(lines, line => /whose nature of business or purpose is as follows/.test(line));
        const eachAuthLineIndex = _.findIndex(lines, line => /each Authorized Person is as follows/.test(line));
        const persons = extractAdministratorsFromText(lines.slice(forNatureIndex, lines.length));

        const formation = {
            forStreet: lines[maFirstIndex + 1],
            forMail: lines[maFirstIndex + 2],
            forRAStreet: lines[maSecondIndex + 1],
            forRAMail: lines[maSecondIndex + 2],
            forRAName: lines[raNameIndex + 1],
            forRAEMail: lines[raEmailIndex + 1],
            forNature: lines.slice(forNatureIndex + 1, eachAuthLineIndex).join(' ')
        }

        return {
            formation,
            authPersons: persons.filter(person => !person.title).map((person, idx, filtered) => ({
                autSeq: filtered.length-idx,
                autName: person.name,
                autEmail: person.email,
                autStreet: person.streetAddress,
                autMail: person.mailingAddress
            })),
            administrators: persons.filter(person => person.title).map((person, idx, filtered) => ({
                admSeq: filtered.length-idx,
                admTitle: person.title,
                admName: person.name,
                admEmail: person.email,
                admStreet: person.streetAddress,
                admMail: person.mailingAddress
            }))
        }
    }

    await Promise.all([
        page.click('a[data-url="/CorpInfo/CorporationFilings.aspx"]'),
        page.waitForNavigation()
    ]);

    const anchors = await page.$$('table.datagrid a');
    let pdfUrl = null;
    for (let anchorIndex = 0; anchorIndex < anchors.length; anchorIndex++) {
        const element = anchors[anchorIndex];
        const text = await page.evaluate(element => element.textContent, element);
        if (/Certificate of Formation.*\[EN\]/.test(text)) {
            pdfUrl = await page.evaluate(element => element.href, element);
        }
    }

    if (pdfUrl) {
        const identifier = uuid();
        const absPath = path.join(__dirname, identifier);
        fs.mkdirSync(absPath);
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: absPath
        });

        let watcher = null;
        let promise = new Promise((resolve, reject) => {
            let matched = false;
            watcher = fs.watch(identifier, (eventType, filename) => {
                if (filename) {
                    if (!/crdownload$/.test(filename) && !matched) {
                        matched = true;
                        const filePath = path.join(identifier, filename);

                        pdfText(filePath, function (err, chunks) {
                            const details = extractDetailsFromText(chunks);
                            fs.writeFileSync(`${identifier}.txt`, chunks.join('\n'));
                            resolve(details);
                        });
                    }
                } else {
                    console.log('filename not provided');
                }
            });
        });

        try {
            await page.goto(pdfUrl);
        } catch (ex) {
            // swallor the connection aborted exception
            // console.log(ex);
        }

        const result = await promise;
        watcher.close();
        return result;
    }
}

async function getAnnualDetailsFromFiles(page) {
    function extractDetailsFromText(lines) {
        function extractAdministratorsFromText(lines) {
            const persons = [];
            let currentPerson = {};
            for (index = lines.length; index > 0; index--) {
                let currentLine = lines[index];
                if (currentLine == 'Term Expiration:') {
                    currentPerson.termExpiration = lines[index + 1];
                } else if (currentLine == 'Title(s):') {
                    currentPerson.title = lines[index - 1];
                } else if (currentLine == 'Mailing Address:') {
                    currentPerson.name = lines[index + 1];
                    currentPerson.mailingAddress = lines[index + 2];
                    persons.push(currentPerson);
                    currentPerson = {};
                }
            }

            return persons;
        }

        const maFirstIndex = lines.indexOf('Mailing Address');
        const maSecondIndex = lines.indexOf('Mailing Address', maFirstIndex);
        const raNameIndex = lines.indexOf('Name');
        const raEmailIndex = lines.indexOf('Email');
        const officersIndex = lines.indexOf('Officers');
        const persons = extractAdministratorsFromText(lines.slice(officersIndex, lines.length));

        // const formation = {
        //     forStreet: lines[maFirstIndex + 1],
        //     forMail: lines[maFirstIndex + 2],
        //     forRAStreet: lines[maSecondIndex + 1],
        //     forRAMail: lines[maSecondIndex + 2],
        //     forRAName: lines[raNameIndex + 1],
        //     forRAEMail: lines[raEmailIndex + 1],
        //     forNature: lines.slice(forNatureIndex + 1, eachAuthLineIndex).join(' ')
        // }

        return {
            // formation,
            officers: persons.filter(person => person.termExpiration).map((person, idx, filtered) => ({
                offSeq: filtered.length-idx,
                offName: person.name,
                offEmail: person.title,
                offMail: person.mailingAddress
            }))
        }
    }

    await Promise.all([
        page.goto('https://prcorpfiling.f1hst.com/CorpInfo/CorpInfoAnnualFilings.aspx?SELECTED_ITEM=ALL'),
        page.waitForNavigation()
    ]);

    const anchors = await page.$$('table.datagrid a');
    const reports = [];
    for (let anchorIndex = 0; anchorIndex < anchors.length; anchorIndex++) {
        const element = anchors[anchorIndex];
        const text = await page.evaluate(element => element.textContent, element);
        if (/Annual Report \[EN\]/.test(text)) {
            const pdfUrl = await page.evaluate(element => element.href, element);
            const year = await page.evaluate(element => element.parentElement.previousSibling.innerText, element);
            if (pdfUrl) {
                reports.push({
                    year,
                    pdfUrl
                });
            }
        }
    }

    const results = [];
    for (let {year, pdfUrl} of reports) {
        const identifier = uuid();
        const absPath = path.join(__dirname, identifier);
        fs.mkdirSync(absPath);
        await page._client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: absPath
        });

        let watcher = null;
        let promise = new Promise((resolve, reject) => {
            let matched = false;
            watcher = fs.watch(identifier, (eventType, filename) => {
                if (filename) {
                    if (!/crdownload$/.test(filename) && !matched) {
                        matched = true;
                        const filePath = path.join(identifier, filename);

                        pdfText(filePath, function (err, chunks) {
                            const details = extractDetailsFromText(chunks);
                            fs.writeFileSync('text.txt', chunks.join('\n'));
                            resolve(details);
                        });
                    }
                } else {
                    console.log('filename not provided');
                }
            });
        });

        try {
            await page.goto(pdfUrl);
        } catch (ex) {
            // swallor the connection aborted exception
            // console.log(ex);
        }

        const result = await promise;
        watcher.close();
        results.push({
            year,
            ...result
        });
    }

    return results;
}

module.exports.getCorporationData = getCorporationData;

// getCorporationData('https://prcorpfiling.f1hst.com/CorpInfo/CorporationInfo.aspx?c=325210-1511');
getCorporationData('https://prcorpfiling.f1hst.com/CorpInfo/CorporationInfo.aspx?c=328545-1511');
