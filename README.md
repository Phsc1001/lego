# Lego

Web application to track and analyze LEGO deals from Dealabs and resale prices from Vinted.

---

## Workshops

### Workshop 1 - JavaScript Data Manipulation
Location: `client/v1/`

Basic JavaScript to manipulate and analyze deal data in the browser.
- Sort deals by price, date
- Filter by discount range
- Calculate averages and percentiles
- Compare retail price vs Vinted resale value

### Workshop 2 - Interactive Dashboard
Location: `client/v2/`

Built a dashboard to browse and filter deals.
- Filters: best discount, most commented, hot deals
- Sort by price or date
- Pagination with adjustable page size
- Vinted market data panel (p5, p25, median)
- Favorites saved in localStorage
- Search by title or set ID

### Workshop 3 - Scraper
Location: `server/`

Node.js scraper to collect deals from the web.
- Scrapes deals from dealabs.com using Cheerio
- Saves results to `deals.json`
- Also scrapes sales from vinted.fr
- Run with `node sandbox.js`

### Workshop 4 - Express API
Location: `server/api.js`

REST API to serve the scraped data.
- `GET /deals/search` - search deals with filters (price, date, limit, filterBy)
- `GET /deals/:id` - get one deal by UUID
- `GET /sales/search?legoSetId=xxx` - get Vinted sales for a set
- Run with `node api.js` on port 8092

---

## How to run

Frontend:
```
open client/v2/index.html in a browser
```

Scraper:
```bash
cd server
npm install
node sandbox.js
```

API:
```bash
cd server
npm install
node api.js
```

---

## Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express, Cheerio
- Data: JSON files
