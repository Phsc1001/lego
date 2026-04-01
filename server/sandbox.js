/* eslint-disable no-console, no-process-exit */
import * as avenuedelabrique from "./websites/avenuedelabrique.js";
import * as vinted from "./websites/vinted.js";
import * as dealabs from "./websites/dealabs.js";
import { writeFileSync } from "fs";

async function scrapeADLB (website = "https://www.avenuedelabrique.com/promotions-et-bons-plans-lego") {
  try {
    console.log(`?? browsing ${website} website`);

    const deals = await avenuedelabrique.scrape(website);

    console.log(deals);
    console.log("done");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function scrapeVinted (lego) {
  try {
    console.log(`?? scraping lego ${lego} from vinted.fr`);

    const sales = await vinted.scrape(lego);

    console.log(sales);
    console.log("done");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

async function scrapeDealabs (baseUrl = "https://www.dealabs.com/groupe/lego") {
  try {
    const allDeals = [];
    const PAGES = 5;

    for (let page = 1; page <= PAGES; page++) {
      const url = `${baseUrl}?page=${page}`;
      console.log(`Scraping page ${page}/${PAGES}: ${url}`);
      const deals = await dealabs.scrape(url);
      if (!deals || deals.length === 0) { console.log(`No deals on page ${page}, stopping.`); break; }
      allDeals.push(...deals);
      if (page < PAGES) await new Promise(r => setTimeout(r, 800)); // polite delay
    }

    // Deduplicate by uuid
    const unique = [...new Map(allDeals.map(d => [d.uuid, d])).values()];
    console.log(`Total: ${unique.length} unique deals across ${PAGES} pages`);
    writeFileSync("deals.json", JSON.stringify(unique, null, 2));
    console.log("Results saved to deals.json");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}


const [,, param] = process.argv;

// Default behavior or check parameter to decide what to scrape
if (param && param.includes("vinted.fr")) {
  scrapeVinted(param);
} else if (param && param.includes("dealabs.com")) {
  scrapeDealabs(param);
} else {
  scrapeDealabs(); // Default to dealabs for today's workshop
}
