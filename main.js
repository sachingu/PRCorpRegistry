const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const linkScraper = require("./links");
const corporationScraper = require("./detail");
const storageService = require("./storage");
var browser,page;

const searchUrl = 'https://prcorpfiling.f1hst.com/CorporationSearch.aspx?rl=true';
async function main() {
  const args = process.argv.slice(2);
  const rangeStart = !isNaN(args[0]) ? parseInt(args[0]) : 1;
  const rangeEnd = !isNaN(args[1]) ? parseInt(args[1]) : rangeStart;
  let registerNumber;
  await initializeBrowser();

  const outputDirectory = './output'
  if (!fs.existsSync(outputDirectory)){
    fs.mkdirSync(outputDirectory);
  }

  let registryData = [];
  let counter=0;
  for (registerNumber = rangeStart; registerNumber <= rangeEnd; registerNumber++) {
    try {
      await page.goto(searchUrl);
      let registryEntry = { registerNumber: registerNumber };
      const corporationLinks = await linkScraper.getCorporationLinksByRegistryNuber(registerNumber, page);
      //verify if any corporation links found for a particular registry
      if(typeof corporationLinks !== 'undefined' && corporationLinks.length > 0)
      {
        if (corporationLinks && corporationLinks.length) {
          registryEntry.corporations = corporationLinks;
          registryData.push(registryEntry);
    
          for (let corporation of registryEntry.corporations) {
            const corporationDetail = await corporationScraper.getCorporationData(corporation.url, page);
            if(++counter==10)
            {
              await browser.close();
              await initializeBrowser();
            }
            Object.assign(corporation, corporationDetail);
          }
        }
    
        const outputPath = path.join(outputDirectory, `${registerNumber}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(registryEntry));
        await storageService.storeRecordsForRegistry(registryEntry);
      }
      else
      {
        console.log("no record found for "+registerNumber);
      }
      
    } catch (ex) {
      console.log(ex);
      console.log(`failure for ${registerNumber}`);
    }
  }

  browser.close();
  outputPath = path.join(outputDirectory, `${new Date().getTime()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(registryData));
}
async function initializeBrowser()
{
  browser = await puppeteer.launch({
    headless: true
  });
  page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.8'
  });
  await page.setDefaultTimeout(60000);
}
main();