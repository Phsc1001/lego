# ?? LEGO Insights | Pro Dashboard

> **Advanced Market Analysis & Deal Tracker for Lego Investors**

This project is a complete, end-to-end web application designed to identify profitable LEGO set deals by scraping live data, analyzing market trends, and providing a high-end user interface for investors.

---

## ?? Completed Workshops Overview

### ? Workshop 1: JavaScript Data Manipulation
*   **Location**: `client/v1/`
*   **Objective**: Mastered core JavaScript functions to process complex data arrays.
*   **Key Features**:
    *   Dynamic calculation of **average discounts** across multiple platforms.
    *   Advanced sorting algorithms (by Price, Date, and Temperature).
    *   Community-based filtering for **Dealabs** and **Avenue de la brique**.
    *   Profitability analysis comparing retail prices vs. Vinted market values.

### ? Workshop 2: Interactive Pro Dashboard
*   **Location**: `client/v2/`
*   **Objective**: Built a professional, responsive E-commerce style dashboard.
*   **Key Features**:
    *   **Pro UI/UX**: Sticky navigation, search bar, and modern grid layout using CSS variables and Flexbox/Grid.
    *   **Smart Filters**: Toggleable "Big Deals" (20%+), "Popular" (5+ comments), and "Hot" (100°+) filters.
    *   **Market Intelligence**: Real-time Vinted data integration (p5, p25, and Median price indicators).
    *   **Favorites System**: Persistence layer using `localStorage` to save and track specific deals.
    *   **Live Search**: Instant filtering by Set Name or Reference ID.

### ? Workshop 3: Node.js Web Scraper
*   **Location**: `server/`
*   **Objective**: Developed a robust backend scraping engine using Node.js.
*   **Key Features**:
    *   **Dealabs Scraper**: Custom module using `Cheerio` and `Fetch` to extract live data from the Lego group.
    *   **Data Serialization**: Automatic export of scraped data into a structured `deals.json` file.
    *   **CLI Integration**: A command-line interface in `sandbox.js` to trigger new scrapes instantly.
    *   **UUID Generation**: Unique identifiers for every deal to ensure data integrity across the app.

---

## ??? How to Run

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

## ?? Technical Stack
*   **Frontend**: HTML5, CSS3 (Modern Grid/Flex), JavaScript (ES6+), FontAwesome.
*   **Backend**: Node.js, Cheerio (Web Scraping).
*   **Data**: JSON, LocalStorage API.

---

## ????? Author
**olphsc** (ESILV - Mobile Development)
