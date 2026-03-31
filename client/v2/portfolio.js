"use strict";

// Global State
let allDeals = []; // Data from current page
let filteredDeals = []; // Data after filters applied
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let selectedId = null;

// Filter State
const activeFilters = {
    discount: false,
    commented: false,
    hot: false,
    favorites: false,
    search: ""
};

// Selectors
const dealsGrid = document.querySelector("#deals-grid");
const searchInput = document.querySelector("#search-input");
const itemsCount = document.querySelector("#items-count");
const totalScrapedSpan = document.querySelector("#total-scraped");
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const currentPageSpan = document.querySelector("#current-page");
const totalPagesSpan = document.querySelector("#total-pages");

// Sidebar Selectors
const spanSelectedId = document.querySelector("#selected-set-id");
const spanNbSales = document.querySelector("#nbSales");
const spanP5 = document.querySelector("#p5Price");
const spanP25 = document.querySelector("#p25Price");
const spanP50 = document.querySelector("#p50Price");
const spanLTV = document.querySelector("#ltvPrice");
const marketStats = document.querySelector("#market-stats");
const marketLoading = document.querySelector("#market-loading");

/**
 * Fetch Data
 */
const fetchDeals = async (page = 1, size = 12) => {
    try {
        let url = `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`;
        
        // Map local filters to API filters
        if (activeFilters.discount) url += `&filterBy=best-discount`;
        else if (activeFilters.commented) url += `&filterBy=most-commented`;
        else if (activeFilters.hot) url += `&filterBy=hot-deals`;
        
        if (activeFilters.search) url += `&search=${encodeURIComponent(activeFilters.search)}`;

        const response = await fetch(url);
        const body = await response.json();
        
        // Update Total Scraped once if not already set
        if (totalScrapedSpan.innerText === "0" && body.success) {
            const initialFetch = await fetch(`https://lego-api-blue.vercel.app/deals?size=1`);
            const initialBody = await initialFetch.json();
            totalScrapedSpan.innerText = initialBody.data.meta.count;
        }

        return body.success ? body.data : { result: [], meta: { count: 0, pageCount: 0, currentPage: 1, pageSize: size } };
    } catch (e) {
        console.error("Fetch Error:", e);
        return { result: [], meta: { count: 0, pageCount: 0, currentPage: 1, pageSize: size } };
    }
};

const fetchSales = async (id) => {
    if (!id) return [];
    try {
        marketStats.style.opacity = "0.2";
        marketLoading.style.display = "block";
        const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
        const body = await response.json();
        marketStats.style.opacity = "1";
        marketLoading.style.display = "none";
        return body.success ? body.data.result : [];
    } catch (e) {
        console.error("Sales Error:", e);
        return [];
    }
};

/**
 * Filter & Logic
 */
const applyFilters = () => {
    let result = activeFilters.favorites ? [...favorites] : [...allDeals];

    // Search (ID or Title)
    if (activeFilters.search) {
        const query = activeFilters.search.toLowerCase();
        result = result.filter(d => 
            d.title.toLowerCase().includes(query) || 
            (d.id && d.id.toString().includes(query))
        );
    }

    // Sort Logic
    const sortType = document.querySelector("#sort-select").value;

    if (sortType) {
        // Use manual sort if selected (not empty)
        if (sortType === "price-asc") result.sort((a,b) => a.price - b.price);
        else if (sortType === "price-desc") result.sort((a,b) => b.price - a.price);
        else if (sortType === "date-asc") result.sort((a,b) => new Date(b.published * 1000) - new Date(a.published * 1000));
        else if (sortType === "date-desc") result.sort((a,b) => new Date(a.published * 1000) - new Date(b.published * 1000));
    } else {
        // Fallback to filter-specific natural sort if no manual sort is selected
        if (activeFilters.discount) {
            result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        } else if (activeFilters.commented) {
            result.sort((a, b) => (b.comments || 0) - (a.comments || 0));
        } else if (activeFilters.hot) {
            result.sort((a, b) => (b.temperature || 0) - (a.temperature || 0));
        }
    }

    filteredDeals = result;
    renderDeals();
};

/**
 * Rendering
 */
const renderDeals = () => {
    const totalCount = activeFilters.favorites ? favorites.length : (currentPagination.count || 0);
    itemsCount.innerText = totalCount;

    // Update pagination range
    const pagRange = document.querySelector("#pag-range");
    if (activeFilters.favorites) {
        pagRange.innerText = `Showing all ${favorites.length} favorites`;
    } else if (totalCount > 0) {
        const start = (currentPagination.currentPage - 1) * currentPagination.pageSize + 1;
        const end = Math.min(currentPagination.currentPage * currentPagination.pageSize, currentPagination.count);
        pagRange.innerText = `Showing ${start}-${end} of ${currentPagination.count} deals`;
    } else {
        pagRange.innerText = "No deals found";
    }

    // Fix the "Page 1 of 5" bug when no results
    currentPageSpan.innerText = totalCount > 0 ? currentPagination.currentPage : 0;
    totalPagesSpan.innerText = totalCount > 0 ? (currentPagination.pageCount || 1) : 0;
    
    if (filteredDeals.length === 0) {
        dealsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 0;">
                <i class="fas fa-ghost" style="font-size: 4rem; color: #cbd5e1; margin-bottom: 2rem; display: block;"></i>
                <h2 style="color: var(--text-muted);">No deals found matching your search.</h2>
            </div>`;
        return;
    }

    dealsGrid.innerHTML = filteredDeals.map(deal => {
        const isFav = favorites.some(fav => fav.uuid === deal.uuid);
        const isSelected = selectedId === deal.id ? "selected" : "";
        return `
            <div class="deal-card ${isSelected}" data-id="${deal.id}" onclick="updateMarketInfo('${deal.id}')">
                <div class="image-box">
                    ${deal.discount ? `<div class="discount-tag">-${deal.discount}%</div>` : ""}
                    <img src="${deal.photo || 'https://placehold.co/300x300?text=Lego'}" alt="${deal.title}">
                    <button class="fav-btn ${isFav ? 'is-fav' : ''}" onclick="toggleFavorite(event, '${deal.uuid}')">
                        <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="card-ref">REF ${deal.id}</div>
                    <h3 class="card-title">${deal.title}</h3>
                    <div class="card-footer">
                        <div class="card-price">
                            <span class="price-label">DEALABS PRICE</span>
                            <span class="price-value">${deal.price} \u20AC</span>
                        </div>
                        <div class="card-stats">
                            <span class="stat-item ${deal.temperature > 100 ? 'hot' : ''}">
                                <i class="fas fa-fire"></i> ${Math.round(deal.temperature || 0)}&deg;
                            </span>
                            <span class="stat-item">
                                <i class="fas fa-comment"></i> ${deal.comments || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join("");
};

const percentile = (arr, q) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined ? sorted[base] + rest * (sorted[base + 1] - sorted[base]) : sorted[base];
};

const renderSalesIndicators = sales => {
    spanNbSales.innerText = sales.length;
    if (sales.length > 0) {
        const prices = sales.map(s => {
            if (typeof s.price === 'object' && s.price.amount) return parseFloat(s.price.amount);
            return parseFloat(s.price) || 0;
        }).filter(p => p > 0);

        spanP5.innerText = percentile(prices, 0.05).toFixed(2) + " \u20AC";
        spanP25.innerText = percentile(prices, 0.25).toFixed(2) + " \u20AC";
        spanP50.innerText = percentile(prices, 0.50).toFixed(2) + " \u20AC";
        
        const dates = sales.map(s => s.published ? new Date(s.published * 1000) : null).filter(d => d !== null);
        const diff = Math.ceil(Math.abs(new Date(Math.max(...dates)) - new Date(Math.min(...dates))) / (1000 * 60 * 60 * 24));
        spanLTV.innerText = diff + " days";
    } else {
        spanP5.innerText = "-"; spanP25.innerText = "-"; spanP50.innerText = "-"; spanLTV.innerText = "-";
    }
};

/**
 * Interactions
 */
window.updateMarketInfo = async (id) => {
    selectedId = id;
    spanSelectedId.innerText = `#${id}`;
    const sales = await fetchSales(id);
    renderSalesIndicators(sales);
    document.querySelectorAll(".deal-card").forEach(c => c.classList.toggle("selected", c.dataset.id === id));
};

window.toggleFavorite = (e, uuid) => {
    e.stopPropagation();
    const index = favorites.findIndex(f => f.uuid === uuid);
    if (index > -1) favorites.splice(index, 1);
    else {
        const deal = allDeals.find(d => d.uuid === uuid);
        if (deal) favorites.push(deal);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    applyFilters();
};

const loadPage = async (page) => {
    const size = document.querySelector("#show-select").value;
    const data = await fetchDeals(page, size);
    allDeals = data.result;
    currentPagination = data.meta;
    
    const totalCount = activeFilters.favorites ? favorites.length : (currentPagination.count || 0);
    currentPageSpan.innerText = totalCount > 0 ? currentPagination.currentPage : 0;
    totalPagesSpan.innerText = totalCount > 0 ? (currentPagination.pageCount || 1) : 0;
    prevBtn.disabled = currentPagination.currentPage === 1 || totalCount === 0;
    nextBtn.disabled = currentPagination.currentPage === currentPagination.pageCount || currentPagination.pageCount === 0;

    applyFilters();
    if (allDeals.length > 0 && !selectedId) updateMarketInfo(allDeals[0].id);
};

// Listeners
searchInput.addEventListener("input", (e) => {
    activeFilters.search = e.target.value;
    loadPage(1); // Re-fetch on search
});

const setupToggle = (btnId, filterKey) => {
    document.querySelector(`#${btnId}`).addEventListener("click", (e) => {
        // Toggle the active filter and deactivate others (except favorites)
        const wasActive = activeFilters[filterKey];
        if (filterKey !== 'favorites') {
            activeFilters.discount = false;
            activeFilters.commented = false;
            activeFilters.hot = false;
            document.querySelectorAll(".filter-btn:not(#filter-favorites)").forEach(b => b.classList.remove("active"));
        }
        
        activeFilters[filterKey] = !wasActive;
        e.currentTarget.classList.toggle("active", activeFilters[filterKey]);
        
        loadPage(1); // Re-fetch from page 1 whenever a filter is changed
    });
};

setupToggle("filter-discount", "discount");
setupToggle("filter-commented", "commented");
setupToggle("filter-hot", "hot");
setupToggle("filter-favorites", "favorites");

document.querySelector("#sort-select").addEventListener("change", applyFilters);
document.querySelector("#show-select").addEventListener("change", () => loadPage(1));

prevBtn.addEventListener("click", () => loadPage(currentPagination.currentPage - 1));
nextBtn.addEventListener("click", () => loadPage(currentPagination.currentPage + 1));

// Init
document.addEventListener("DOMContentLoaded", () => loadPage(1));
