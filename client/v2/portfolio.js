"use strict";

// Selectors
const dealsGrid = document.querySelector("#deals-grid");
const legoIdSelect = document.querySelector("#lego-id-select");
const totalCountSpan = document.querySelector("#total-count");
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const currentPageSpan = document.querySelector("#current-page");
const totalPagesSpan = document.querySelector("#total-pages");
const spanSelectedId = document.querySelector("#selected-set-id");
const spanNbSales = document.querySelector("#nbSales");
const spanP5 = document.querySelector("#p5Price");
const spanP25 = document.querySelector("#p25Price");
const spanP50 = document.querySelector("#p50Price");
const spanLTV = document.querySelector("#ltvPrice");
const marketStats = document.querySelector("#market-stats");
const marketLoading = document.querySelector("#market-loading");

let allDeals = []; 
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let selectedId = null;

const activeFilters = {
    discount: false, commented: false, hot: false, favorites: false, search: ""
};

/**
 * Fetch deals from API
 */
const fetchDeals = async (page = 1, size = 12) => {
    try {
        let url = `https://server-fawn-omega-23.vercel.app/deals?page=${page}&size=${size}`;
        
        // Remote API filter mapping
        if (activeFilters.discount) url += `&filterBy=best-discount`;
        else if (activeFilters.commented) url += `&filterBy=most-commented`;
        else if (activeFilters.hot) url += `&filterBy=hot-deals`;
        
        if (activeFilters.search) url += `&search=${encodeURIComponent(activeFilters.search)}`;

        const response = await fetch(url);
        const body = await response.json();
        
        if (body.success) {
            totalCountSpan.innerText = body.data.meta.count;
            return body.data;
        }
        return { result: [], meta: { count: 0, pageCount: 1, currentPage: 1, pageSize: size } };
    } catch (e) {
        console.error("Fetch Error:", e);
        return { result: [], meta: { count: 0, pageCount: 1, currentPage: 1, pageSize: size } };
    }
};

/**
 * FETCH SALES FROM REMOTE API
 */
const fetchSales = async (id) => {
    if (!id || id === "N/A") return [];
    try {
        marketStats.style.opacity = "0.2";
        marketLoading.style.display = "block";
        const response = await fetch(`https://server-fawn-omega-23.vercel.app/sales/search?legoSetId=${id}`);
        const body = await response.json();
        marketStats.style.opacity = "1";
        marketLoading.style.display = "none";
        return (body.success && body.data) ? body.data.result : [];
    } catch (e) {
        console.error("Sales Error:", e);
        marketLoading.style.display = "none";
        return [];
    }
};

const renderDeals = () => {
    const dealsToRender = activeFilters.favorites ? favorites : allDeals;
    const totalCount = activeFilters.favorites ? favorites.length : (currentPagination.count || 0);
    
    currentPageSpan.innerText = totalCount > 0 ? currentPagination.currentPage : 0;
    totalPagesSpan.innerText = totalCount > 0 ? (currentPagination.pageCount || 1) : 0;
    
    if (dealsToRender.length === 0) {
        dealsGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 5rem;"><i class="fas fa-ghost" style="font-size: 3rem; opacity: 0.2;"></i><h2>No deals found</h2></div>`;
        return;
    }

    dealsGrid.innerHTML = dealsToRender.map(deal => {
        const isFav = favorites.some(fav => fav.uuid === deal.uuid);
        // Remote API uses .id or we extract from title
        const legoId = deal.id || deal.title.match(/\b(\d{4,6})\b/)?.[1] || "N/A";
        const isSelected = selectedId === legoId ? "selected" : "";
        const temp = Math.round(deal.temperature || 0);
        
        // Remote API uses .photo
        const imgSrc = deal.photo || `https://placehold.co/300x300?text=LEGO+${legoId}`;
        
        return `
            <div class="card ${isSelected}" data-id="${legoId}" onclick="updateMarketInfo('${legoId}')">
                <div class="card-image">
                    ${deal.discount ? `<div class="discount-badge">-${deal.discount}%</div>` : ""}
                    <img src="${imgSrc}" alt="${deal.title}" referrerpolicy="no-referrer"
                         onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=LEGO+${legoId}';">
                    <button class="fav-toggle ${isFav ? 'active' : ''}" style="position:absolute; top:1rem; right:1rem; border:none; background:white; width:35px; height:35px; border-radius:50%; cursor:pointer; color:${isFav ? 'var(--accent)' : '#cbd5e1'}; box-shadow:0 2px 5px rgba(0,0,0,0.1);" onclick="toggleFavorite(event, '${deal.uuid}')">
                        <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
                    </button>
                </div>
                <div class="card-content">
                    <div class="card-meta">SET ${legoId}</div>
                    <h3 class="card-title">${deal.title}</h3>
                    <div class="card-footer">
                        <div class="card-price"><span class="price-now">${deal.price} €</span></div>
                        <div class="card-stats">
                            <div class="stat ${temp > 100 ? 'hot' : ''}"><i class="fas fa-fire"></i> ${temp}°</div>
                            <div class="stat"><i class="fas fa-comment"></i> ${deal.comments || 0}</div>
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
    if (sales && sales.length > 0) {
        const prices = sales.map(s => {
            if (typeof s.price === 'object' && s.price.amount) return parseFloat(s.price.amount);
            return parseFloat(s.price) || 0;
        }).filter(p => p > 0);

        if (prices.length > 0) {
            spanP5.innerText = percentile(prices, 0.05).toFixed(2) + " €";
            spanP25.innerText = percentile(prices, 0.25).toFixed(2) + " €";
            spanP50.innerText = percentile(prices, 0.50).toFixed(2) + " €";
        }

        const dates = sales.map(s => s.published ? new Date(s.published * 1000) : null).filter(d => d !== null);
        if (dates.length > 1) {
            const diff = Math.ceil(Math.abs(new Date(Math.max(...dates)) - new Date(Math.min(...dates))) / (1000 * 60 * 60 * 24));
            spanLTV.innerText = diff + " days";
        } else { spanLTV.innerText = "1 day"; }
    } else {
        spanP5.innerText = "-"; spanP25.innerText = "-"; spanP50.innerText = "-"; spanLTV.innerText = "-";
    }
};

window.updateMarketInfo = async (id) => {
    selectedId = id;
    spanSelectedId.innerText = id === "N/A" ? "N/A" : `#${id}`;
    const sales = await fetchSales(id);
    renderSalesIndicators(sales);
    document.querySelectorAll(".card").forEach(c => c.classList.toggle("selected", c.dataset.id === id));
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
    renderDeals();
};

const loadPage = async (page) => {
    const size = document.querySelector("#show-select").value;
    const data = await fetchDeals(page, size);
    allDeals = data.result;
    currentPagination = data.meta;
    prevBtn.disabled = currentPagination.currentPage === 1;
    nextBtn.disabled = currentPagination.currentPage === currentPagination.pageCount;
    renderDeals();
    if (allDeals.length > 0 && !selectedId) {
        updateMarketInfo(allDeals[0].id || allDeals[0].title.match(/\b(\d{4,6})\b/)?.[1] || "N/A");
    }
};

const populateIdDropdown = async () => {
    try {
        const response = await fetch("https://server-fawn-omega-23.vercel.app/deals?size=100");
        const body = await response.json();
        if (body.success) {
            const idSet = new Set();
            body.data.result.forEach(d => { const id = d.id || d.title.match(/\b(\d{4,6})\b/)?.[1]; if (id) idSet.add(id); });
            legoIdSelect.innerHTML = '<option value="">Search by LEGO Set ID...</option>';
            Array.from(idSet).sort().forEach(id => {
                const opt = document.createElement("option");
                opt.value = id; opt.innerText = `Lego Set ${id}`;
                legoIdSelect.appendChild(opt);
            });
        }
    } catch (e) {}
};

legoIdSelect.addEventListener("change", (e) => {
    activeFilters.search = e.target.value;
    loadPage(1);
});

const setupToggle = (btnId, filterKey) => {
    document.querySelector(`#${btnId}`).addEventListener("click", (e) => {
        const wasActive = activeFilters[filterKey];
        if (filterKey !== 'favorites') {
            activeFilters.discount = false; activeFilters.commented = false; activeFilters.hot = false;
            document.querySelectorAll(".toolbar .btn").forEach(b => b.classList.remove("active"));
        }
        activeFilters[filterKey] = !wasActive;
        e.currentTarget.classList.toggle("active", activeFilters[filterKey]);
        loadPage(1);
    });
};

setupToggle("filter-discount", "discount");
setupToggle("filter-commented", "commented");
setupToggle("filter-hot", "hot");
setupToggle("filter-favorites", "favorites");

document.querySelector("#sort-select").addEventListener("change", () => loadPage(1));
document.querySelector("#show-select").addEventListener("change", () => loadPage(1));
prevBtn.addEventListener("click", () => loadPage(currentPagination.currentPage - 1));
nextBtn.addEventListener("click", () => loadPage(currentPagination.currentPage + 1));

document.addEventListener("DOMContentLoaded", () => {
    populateIdDropdown();
    loadPage(1);
});
