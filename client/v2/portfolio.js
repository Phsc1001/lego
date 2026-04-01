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
const spanDealPrice = document.querySelector("#dealPrice");
const spanProfit = document.querySelector("#profitPotential");
const marketStats = document.querySelector("#market-stats");
const marketLoading = document.querySelector("#market-loading");

let allDeals = [];
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let selectedId = null;
let selectedPrice = null;
let currentSort = '';

// ── Theme Toggle ──
const themeToggle = document.querySelector('#theme-toggle');
const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
};
applyTheme(localStorage.getItem('theme') || 'light');
themeToggle.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// Cyclical sort state machines
const PRICE_CYCLE = [
    { val: '',           label: 'Price',   icon: 'fa-sort' },
    { val: 'price-asc',  label: 'Price ↑', icon: 'fa-sort-up' },
    { val: 'price-desc', label: 'Price ↓', icon: 'fa-sort-down' }
];
const DATE_CYCLE = [
    { val: '',           label: 'Date',    icon: 'fa-calendar' },
    { val: 'date-desc',  label: 'Newest',  icon: 'fa-clock' },
    { val: 'date-asc',   label: 'Oldest',  icon: 'fa-calendar' }
];
let priceIdx = 0;
let dateIdx  = 0;

const getDealId = d => d.id || d.title.match(/\b(\d{4,6})\b/)?.[1] || d.link?.replace(/-\d{7}$/, '').match(/\b(\d{4,6})\b/)?.[1] || null;
const isRealSetId = id => id && /^\d{4,6}$/.test(id);
const timeAgo = ts => {
    const diff = Math.floor((Date.now() / 1000 - ts) / 86400);
    if (diff === 0) return 'Today';
    if (diff === 1) return '1d ago';
    return `${diff}d ago`;
};
const tempColor = temp => temp >= 300 ? '#ef4444' : temp >= 100 ? '#f97316' : '#64748b';

const activeFilters = {
    discount: false, commented: false, hot: false, onSale: false, favorites: false, sniper: false, search: ""
};

/**
 * Fetch deals from API
 */
const fetchDeals = async (page = 1, size = 12) => {
    try {
        let url = `http://localhost:8092/deals?page=${page}&size=${size}`;

        if (activeFilters.discount)       url += `&filterBy=best-discount`;
        else if (activeFilters.commented) url += `&filterBy=most-commented`;
        else if (activeFilters.hot)       url += `&filterBy=hot-deals`;
        else if (activeFilters.onSale)    url += `&filterBy=on-sale`;
        else if (activeFilters.sniper)    url += `&filterBy=sniper`;

        if (activeFilters.search) url += `&search=${encodeURIComponent(activeFilters.search)}`;
        if (currentSort) url += `&sort=${currentSort}`;

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
        // Instant skeleton feedback on all metric values + ROI hero
        document.querySelectorAll('#market-stats .metric-value, #roiPercent').forEach(el => el.classList.add('skeleton'));
        const response = await fetch(`http://localhost:8092/sales/search?legoSetId=${id}`);
        const body = await response.json();
        document.querySelectorAll('#market-stats .metric-value, #roiPercent').forEach(el => el.classList.remove('skeleton'));
        return (body.success && body.data) ? body.data.result : [];
    } catch (e) {
        console.error("Sales Error:", e);
        document.querySelectorAll('#market-stats .metric-value, #roiPercent').forEach(el => el.classList.remove('skeleton'));
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

    dealsGrid.innerHTML = dealsToRender.map((deal, i) => {
        const isFav = favorites.some(fav => fav.uuid === deal.uuid);
        const legoId = getDealId(deal) || "N/A";
        const isSelected = selectedId === legoId && selectedPrice === deal.price ? "selected" : "";
        const temp = Math.round(deal.temperature || 0);
        const imgSrc = deal.photo || deal.image || `https://placehold.co/300x300?text=LEGO+${legoId}`;
        const age = deal.published ? timeAgo(deal.published) : "";
        const retailHtml = deal.retail ? `<span style="text-decoration:line-through; color:var(--text-muted); font-size:0.75rem; margin-right:4px;">${deal.retail} €</span>` : "";

        // Profit heatmap
        const discount = deal.discount || 0;
        const profitClass = discount >= 50 ? 'profit-gold' : discount >= 25 ? 'profit-green' : '';
        const hotBadge = discount >= 50 ? `<div class="hot-deal-badge">🔥 HOT DEAL</div>` : '';
        const savings = deal.retail && deal.retail > deal.price
            ? `<div class="savings-tag">+€${(deal.retail - deal.price).toFixed(2)} saved</div>`
            : (age ? `<div class="age-tag">${age}</div>` : '');

        return `
            <div class="card ${isSelected} ${profitClass}" data-id="${legoId}" data-uuid="${deal.uuid}" data-price="${deal.price}" style="animation-delay: ${Math.min(i * 0.06, 0.6)}s" onclick="updateMarketInfo('${legoId}', ${deal.price})">
                <div class="card-image">
                    ${hotBadge}
                    ${!hotBadge && deal.discount ? `<div class="discount-badge">-${deal.discount}%</div>` : ""}
                    ${savings}
                    <img src="${imgSrc}" alt="${deal.title}" referrerpolicy="no-referrer"
                         onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=LEGO+${legoId}';">
                    <button class="fav-toggle ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${deal.uuid}')">
                        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="card-content">
                    <div class="card-meta">SET ${isRealSetId(legoId) ? legoId : '—'}</div>
                    <h3 class="card-title">${deal.title}</h3>
                    <div class="card-footer">
                        <div class="card-price">${retailHtml}<span class="price-now">${deal.price} €</span></div>
                        <div class="card-stats">
                            <div class="stat" style="color:${tempColor(temp)}"><i class="fas fa-fire"></i> ${temp}°</div>
                            <div class="stat"><i class="fas fa-comment"></i> ${deal.comments || 0}</div>
                        </div>
                    </div>
                </div>
                ${deal.link ? `<a href="${deal.link}" target="_blank" rel="noopener noreferrer" class="buy-deal-btn" onclick="event.stopPropagation()"><i class="fas fa-external-link-alt"></i> Buy Deal</a>` : ""}
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

const renderSalesIndicators = (sales, dealPrice) => {
    // Re-trigger staggered bubble entrance (spring pop-in on each selection)
    document.querySelectorAll('.metric-row').forEach((el, i) => {
        el.style.animation = 'none';
        void el.offsetWidth; // force reflow
        el.style.animation = '';
        el.style.animationDelay = `${i * 0.05}s`;
    });

    spanNbSales.innerText = sales.length;
    spanDealPrice.innerText = dealPrice != null ? dealPrice.toFixed(2) + " €" : "-";

    const roiEl     = document.querySelector('#roiPercent');
    const roiWidget = document.querySelector('.roi-hero-widget');
    const buySignal = document.querySelector('#buySignal');

    const resetExtras = () => {
        if (roiEl)     { roiEl.textContent = '—'; roiEl.className = 'roi-value'; }
        if (roiWidget) roiWidget.classList.remove('glow-pulse');
        if (buySignal) { buySignal.className = 'buy-signal'; buySignal.querySelector('.buy-signal-label').textContent = '—'; }
    };

    if (sales && sales.length > 0) {
        const prices = sales.map(s => {
            if (typeof s.price === 'object' && s.price.amount) return parseFloat(s.price.amount);
            return parseFloat(s.price) || 0;
        }).filter(p => p > 0);

        if (prices.length > 0) {
            spanP5.innerText = percentile(prices, 0.05).toFixed(2) + " €";
            spanP25.innerText = percentile(prices, 0.25).toFixed(2) + " €";
            const p50 = percentile(prices, 0.50);
            spanP50.innerText = p50.toFixed(2) + " €";

            if (dealPrice != null) {
                const profit = p50 - dealPrice;
                const pct = ((profit / dealPrice) * 100).toFixed(0);
                const roiPct = parseFloat(pct);
                spanProfit.innerText = (profit >= 0 ? "+" : "") + profit.toFixed(2) + " € (" + pct + "%)";
                const tier = roiPct >= 20 ? 'high' : roiPct >= 0 ? 'mid' : 'low';
                spanProfit.className = `metric-value profit-${tier}`;
                const dot = document.querySelector('#tl-dot');
                if (dot) dot.className = `tl-dot ${tier}${tier === 'high' ? ' pulse' : ''}`;

                // ROI count-up animation
                if (roiEl) {
                    roiEl.className = `roi-value${roiPct < 0 ? ' negative' : ''}`;
                    let step = 0; const STEPS = 18;
                    const timer = setInterval(() => {
                        step++;
                        const cur = roiPct * (step / STEPS);
                        roiEl.textContent = (cur >= 0 ? '+' : '') + cur.toFixed(1) + '%';
                        if (step >= STEPS) { clearInterval(timer); roiEl.textContent = (roiPct >= 0 ? '+' : '') + roiPct.toFixed(1) + '%'; }
                    }, 20);
                }
                if (roiWidget) roiWidget.classList.toggle('glow-pulse', roiPct >= 30);

                // Buy Signal Gauge
                if (buySignal) {
                    const state = tier === 'high' ? 'strong-buy' : tier === 'mid' ? 'hold' : 'liquidate';
                    const label = tier === 'high' ? 'Strong Buy' : tier === 'mid' ? 'Hold' : 'Liquidate';
                    buySignal.className = `buy-signal ${state}`;
                    buySignal.querySelector('.buy-signal-label').textContent = label;
                }
            } else {
                spanProfit.innerText = "-"; spanProfit.className = 'metric-value';
                const dot = document.querySelector('#tl-dot');
                if (dot) dot.className = 'tl-dot';
                resetExtras();
            }
        }

        const dates = sales.map(s => s.published ? new Date(s.published * 1000) : null).filter(d => d !== null);
        if (dates.length > 1) {
            const diff = Math.ceil(Math.abs(new Date(Math.max(...dates)) - new Date(Math.min(...dates))) / (1000 * 60 * 60 * 24));
            spanLTV.innerText = diff + " days";
        } else { spanLTV.innerText = "1 day"; }
    } else {
        spanP5.innerText = "-"; spanP25.innerText = "-"; spanP50.innerText = "-";
        spanLTV.innerText = "-"; spanProfit.innerText = "-"; spanProfit.style.color = "";
        resetExtras();
    }
};

const renderRelatedDeals = (setId, currentPrice) => {
    const section = document.querySelector("#related-section");
    const container = document.querySelector("#related-deals");
    if (!section || !container) return;

    if (!isRealSetId(setId)) { section.style.display = "none"; return; }

    const related = allDeals.filter(d => getDealId(d) === setId);
    if (related.length <= 1) { section.style.display = "none"; return; }

    section.style.display = "block";
    container.innerHTML = related.map(deal => {
        const isActive = deal.price === currentPrice;
        return `<div class="related-deal-item${isActive ? ' active' : ''}" onclick="updateMarketInfo('${setId}', ${deal.price})">
                    <span>${deal.title.substring(0, 38)}…</span>
                    <span>${deal.price.toFixed(2)} €</span>
                </div>`;
    }).join('');
};

window.updateMarketInfo = async (id, dealPrice) => {
    selectedId = id;
    selectedPrice = dealPrice;
    spanSelectedId.innerText = isRealSetId(id) ? `#${id}` : "—";
    const sales = await fetchSales(isRealSetId(id) ? id : null);
    renderSalesIndicators(sales, dealPrice);
    renderRelatedDeals(id, dealPrice);
    document.querySelectorAll(".card").forEach(c => {
        c.classList.toggle("selected", c.dataset.id === id && parseFloat(c.dataset.price) === dealPrice);
    });
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
    // Heart pop animation on the re-rendered button
    requestAnimationFrame(() => {
        const btn = document.querySelector(`.card[data-uuid="${uuid}"] .fav-toggle`);
        if (btn) {
            btn.classList.remove('popping');
            void btn.offsetWidth;
            btn.classList.add('popping');
            btn.addEventListener('animationend', () => btn.classList.remove('popping'), { once: true });
        }
    });
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
        const first = allDeals[0];
        const firstId = first.id || first.title.match(/\b(\d{4,6})\b/)?.[1] || "N/A";
        updateMarketInfo(firstId, first.price);
    }
};

const populateIdDropdown = async () => {
    try {
        const response = await fetch("http://localhost:8092/deals?size=100");
        const body = await response.json();
        if (body.success) {
            const idSet = new Set();
            body.data.result.forEach(d => { const id = getDealId(d); if (isRealSetId(id)) idSet.add(id); });
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
        if (filterKey !== 'favorites' && filterKey !== 'sniper') {
            activeFilters.discount = false; activeFilters.commented = false;
            activeFilters.hot = false; activeFilters.onSale = false;
            document.querySelectorAll(".toolbar .btn:not(#sniper-mode):not(#filter-favorites)").forEach(b => b.classList.remove("active"));
        }
        activeFilters[filterKey] = !wasActive;
        e.currentTarget.classList.toggle("active", activeFilters[filterKey]);
        loadPage(1);
    });
};

setupToggle("filter-discount", "discount");
setupToggle("filter-commented", "commented");
setupToggle("filter-hot", "hot");
setupToggle("filter-on-sale", "onSale");
setupToggle("filter-favorites", "favorites");
setupToggle("sniper-mode", "sniper");

const updateSortBtn = (el, state) => {
    const label = el.querySelector('.sort-label');
    label.style.opacity = '0';
    label.style.transform = 'translateY(-6px)';
    setTimeout(() => {
        label.innerText = state.label;
        label.style.opacity = '1';
        label.style.transform = 'translateY(0)';
    }, 150);
    el.querySelector('.sort-icon').className = `fas ${state.icon} sort-icon`;
    el.classList.toggle('active', state.val !== '');
};

document.querySelector('#sort-price').addEventListener('click', () => {
    priceIdx = (priceIdx + 1) % PRICE_CYCLE.length;
    dateIdx = 0;
    updateSortBtn(document.querySelector('#sort-price'), PRICE_CYCLE[priceIdx]);
    updateSortBtn(document.querySelector('#sort-date'), DATE_CYCLE[dateIdx]);
    currentSort = PRICE_CYCLE[priceIdx].val;
    loadPage(1);
});

document.querySelector('#sort-date').addEventListener('click', () => {
    dateIdx = (dateIdx + 1) % DATE_CYCLE.length;
    priceIdx = 0;
    updateSortBtn(document.querySelector('#sort-date'), DATE_CYCLE[dateIdx]);
    updateSortBtn(document.querySelector('#sort-price'), PRICE_CYCLE[priceIdx]);
    currentSort = DATE_CYCLE[dateIdx].val;
    // Animate directional arrow on date button
    const arrow = document.querySelector('#sort-date .date-arrow');
    if (arrow) {
        const state = DATE_CYCLE[dateIdx];
        arrow.style.opacity = state.val ? '0.8' : '0';
        arrow.style.transform = state.val === 'date-asc' ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    loadPage(1);
});

document.querySelector("#show-select").addEventListener("change", () => loadPage(1));
prevBtn.addEventListener("click", () => loadPage(currentPagination.currentPage - 1));
nextBtn.addEventListener("click", () => loadPage(currentPagination.currentPage + 1));

document.addEventListener("DOMContentLoaded", async () => {
    populateIdDropdown();
    await loadPage(1);
    // Dismiss intro overlay after first page load
    const overlay = document.querySelector('#intro-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 580);
    }
});
