async function getCorporationLinksByRegistryNuber(i, page) {
    await page.evaluate(() => document.querySelector("input[title='Register Number']").value = "");
    await page.type("input[title='Register Number']", i.toString());
    await Promise.all([
        page.click("input[title='Search All Entities']"),
        page.waitForNavigation({ waitUntil: 'domcontentloaded' })
    ]);

    let corporationLinks = await generateLinks(page);
    return corporationLinks;
}

async function generateLinks(page) {
    let corporationLinks = [];
    let noRecordFound = ((await page.$eval("span[id$=prCorporationSearch_lblSearchResultCountValue]", x => x.innerText)) == 0);
    //verify if there is any corporation for the particular registry
    if (!noRecordFound) {
        let hasPagerRow = await page.$(".search-grid-pager");
        let linksData = await getLinksFromCurrentPage(page);
        corporationLinks.push(...linksData);
        //check for pages
        if (hasPagerRow) {
            let noOfPages = (await page.$$(".search-grid-pager tr td")).length;
            for (let i = 2; i <= noOfPages; i++) {
                let nextPageLink = await page.$('.search-grid-pager tr td:nth-child' + '(' + i + ')');
                await Promise.all([
                    nextPageLink.click(),
                    page.waitForNavigation({ waitUntil: 'domcontentloaded' })
                ]);

                linksData = await getLinksFromCurrentPage(page);
                corporationLinks.push(...linksData);
            }
        }
    }
    return corporationLinks;
}

async function getLinksFromCurrentPage(page) {
    const linksData = await page.$$eval("table.search-grid tr a", links =>
        links
            .filter(x => x.href.startsWith("http"))
            .map(a => ({ name: a.title, url: a.href }))
    );

    return linksData;
}

module.exports.getCorporationLinksByRegistryNuber = getCorporationLinksByRegistryNuber;
