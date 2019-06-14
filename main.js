const puppeteer = require("puppeteer");
const fs = require("fs");
const linkScraper = require("./links");
const corporationScraper = require("./detail");
const storageService = require("./storage");

const searchUrl = 'https://prcorpfiling.f1hst.com/CorporationSearch.aspx?rl=true';
async function main() {
  const args = process.argv.slice(2);
  const rangeStart = !isNaN(args[0]) ? parseInt(args[0]) : 1;
  const rangeEnd = !isNaN(args[1]) ? parseInt(args[1]) : rangeStart;
  let registerNumber;
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.8'
  });


  let registryData = [];
  for (registerNumber = rangeStart; registerNumber <= rangeEnd; registerNumber++) {
    try {
      await page.goto(searchUrl);
      let registryEntry = { registerNumber: registerNumber };
      const corporationLinks = await linkScraper.getCorporationLinksByRegistryNuber(registerNumber, page);
      if (corporationLinks && corporationLinks.length) {
        registryEntry.corporations = corporationLinks;
        registryData.push(registryEntry);
  
        for (let corporation of registryEntry.corporations) {
          const corporationDetail = await corporationScraper.getCorporationData(corporation.url, page);
          Object.assign(corporation, corporationDetail);
        }
      }
  
      fs.writeFileSync(`${registerNumber}.json`, JSON.stringify(registryEntry));
      await storageService.storeCorporations(registryEntry);
    } catch (ex) {
      console.log(ex);
      console.log(`failure for ${registerNumber}`);
    }
  }

  // for (let registryEntry of registryData) {
  //   for (let corporation of registryEntry.corporations) {
  //     const corporationDetail = await corporationScraper.getCorporationData(corporation.url, page);
  //     Object.assign(corporation, corporationDetail);
  //   }
  // }

  browser.close();
  fs.writeFileSync("test.json", JSON.stringify(registryData));
}

main();