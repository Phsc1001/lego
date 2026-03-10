# 🧱 LEGO Insights | Pro Dashboard

> **Advanced Market Analysis & Deal Tracker for Lego Investors**

This project is a complete, end-to-end web application designed to identify profitable LEGO set deals by scraping live data, analyzing market trends, and providing a high-end user interface for investors.

---

## 🏆 Completed Workshops Overview

### ✅ Workshop 1: JavaScript Data Manipulation
*   **Location**: `client/v1/`
*   **Objective**: Mastered core JavaScript functions to process complex data arrays.
*   **Key Features**:
    *   Dynamic calculation of **average discounts** across multiple platforms.
    *   Advanced sorting algorithms (by Price, Date, and Temperature).
    *   Community-based filtering for **Dealabs** and **Avenue de la brique**.
    *   Profitability analysis comparing retail prices vs. Vinted market values.

### ✅ Workshop 2: Interactive Pro Dashboard
*   **Location**: `client/v2/`
*   **Objective**: Built a professional, responsive E-commerce style dashboard.
*   **Key Features**:
    *   **Pro UI/UX**: Sticky navigation, search bar, and modern grid layout using CSS variables and Flexbox/Grid.
    *   **Smart Filters**: Toggleable "Big Deals" (20%+), "Popular" (5+ comments), and "Hot" (100°+) filters.
    *   **Market Intelligence**: Real-time Vinted data integration (p5, p25, and Median price indicators).
    *   **Favorites System**: Persistence layer using `localStorage` to save and track specific deals.
    *   **Live Search**: Instant filtering by Set Name or Reference ID.

### ✅ Workshop 3: Node.js Web Scraper
*   **Location**: `server/`
*   **Objective**: Developed a robust backend scraping engine using Node.js.
*   **Key Features**:
    *   **Dealabs Scraper**: Custom module using `Cheerio` and `Fetch` to extract live data from the Lego group.
    *   **Data Serialization**: Automatic export of scraped data into a structured `deals.json` file.
    *   **CLI Integration**: A command-line interface in `sandbox.js` to trigger new scrapes instantly.
    *   **UUID Generation**: Unique identifiers for every deal to ensure data integrity across the app.

---

## 🚀 How to Run

### 1. The Dashboard (Frontend)
Simply open the following file in any modern web browser:
`client/v2/index.html`

### 2. The Scraper (Backend)
To fetch fresh data from the web, navigate to the server folder and run:
```bash
cd server
npm install
node sandbox.js
```

---

## 🛠 Technical Stack
*   **Frontend**: HTML5, CSS3 (Modern Grid/Flex), JavaScript (ES6+), FontAwesome.
*   **Backend**: Node.js, Cheerio (Web Scraping).
*   **Data**: JSON, LocalStorage API.

---

With [inception](https://github.com/92bondstreet/inception?tab=readme-ov-file#%EF%B8%8F-the-3-themes) themes, we'll follow next workshops to solve our problem:

| Step | Workshops | Planned Date
| --- | --- | ---
| 0 | [Craft an effective prototype](./workshops/0-craft-your-conviction.md) | Jan 2025
| 1 | [Manipulate data with JavaScript in the browser](./workshops/1-manipulate-javascript.md) | Feb 2025
| 2 | [Interact data with JavaScript, HTML and CSS in the browser again](./workshops/2-interact-js-css.md) | Feb 2025
| 3 | [Scrape data with Node.js](./workshops/3-scrape-node.md)| Mar 2025
| 4 | [Build an api with Express to request data](./workshops/4-api-express.md) | Mar 2025
| 5 | [Deploy in production with Vercel](./workshops/5-deploy.md) | Mar 2025

## 📝 Licence

[Uncopyrighted](http://zenhabits.net/uncopyright/)

## 🧑‍💻 Author
**olphsc** (ESILV - Mobile Development)
