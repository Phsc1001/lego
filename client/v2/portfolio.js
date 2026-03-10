"use strict";

let currentDeals = [];
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let selectedId = null;

const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const selectSort = document.querySelector("#sort-select");
const sectionDealsGrid = document.querySelector("#deals-grid");
const spanNbDeals = document.querySelector("#nbDeals");
const spanNbSales = document.querySelector("#nbSales");
const spanP5 = document.querySelector("#p5Price");
const spanP25 = document.querySelector("#p25Price");
const spanP50 = document.querySelector("#p50Price");
const spanLTV = document.querySelector("#ltvPrice");
const marketStats = document.querySelector("#market-stats");
const marketLoading = document.querySelector("#market-loading");

const setCurrentDeals = (data) => {
  currentDeals = data.result || [];
  currentPagination = data.meta || {};
};

const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`);
    const body = await response.json();
    return body.success === true ? body.data : {result: [], meta: {}};
  } catch (error) {
    console.error("Fetch deals error:", error);
    return {result: [], meta: {}};
  }
};

const fetchSales = async (id) => {
  if (!id) return [];
  try {
    marketStats.style.opacity = "0.3";
    marketLoading.style.display = "block";
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
    const body = await response.json();
    marketStats.style.opacity = "1";
    marketLoading.style.display = "none";
    return (body.success === true && body.data) ? body.data.result : [];
  } catch (error) {
    console.error("Fetch sales error:", error);
    marketStats.style.opacity = "1";
    marketLoading.style.display = "none";
    return [];
  }
};

const updateMarketInfo = async (id) => {
  if (!id) return;
  selectedId = id;
  const sales = await fetchSales(id);
  renderSalesIndicators(sales);
  
  if (selectLegoSetIds.value !== id) {
    selectLegoSetIds.value = id;
  }

  document.querySelectorAll(".deal-card").forEach(card => {
    card.classList.toggle("selected", card.getAttribute("data-id") === id);
  });
};

const renderDeals = (deals) => {
  if (!deals || deals.length === 0) {
    sectionDealsGrid.innerHTML = "<div class='card' style='grid-column: 1/-1; text-align: center;'>No deals found matching your criteria.</div>";
    return;
  }

  sectionDealsGrid.innerHTML = deals.map(deal => {
    const isFav = favorites.some(fav => fav.uuid === deal.uuid);
    const isSelected = selectedId === deal.id ? "selected" : "";
    const discountTag = deal.discount ? `<div class="badge">-${deal.discount}%</div>` : "";
    
    return `
      <div class="deal-card ${isSelected}" data-id="${deal.id}" onclick="updateMarketInfo('${deal.id}')">
        <div class="img-container">
          ${discountTag}
          <img src="${deal.photo || 'https://placehold.co/300x300?text=Lego'}" alt="${deal.title}" onerror="this.src='https://placehold.co/300x300?text=Lego'">
          <button class="fav-btn ${isFav ? 'is-fav' : ''}" data-uuid="${deal.uuid}" onclick="toggleFavorite(event, '${deal.uuid}')">
            <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
          </button>
        </div>
        <div class="content">
          <div class="deal-id">REF: ${deal.id}</div>
          <h3 class="deal-title">${deal.title}</h3>
          <div class="footer">
            <div class="price">${deal.price} \u20AC</div>
            <div class="meta">
              <span class="${deal.temperature > 100 ? 'fire' : ''}"><i class="fas fa-fire"></i> ${Math.round(deal.temperature || 0)}&deg;</span>
              <span><i class="fas fa-comment"></i> ${deal.comments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

window.updateMarketInfo = updateMarketInfo;

window.toggleFavorite = (event, uuid) => {
  event.stopPropagation();
  const btn = event.currentTarget;
  const deal = currentDeals.find(d => d.uuid === uuid) || favorites.find(d => d.uuid === uuid);
  const index = favorites.findIndex(fav => fav.uuid === uuid);
  
  if (index > -1) {
    favorites.splice(index, 1);
    btn.classList.remove("is-fav");
    btn.querySelector("i").className = "far fa-star";
  } else if (deal) {
    favorites.push(deal);
    btn.classList.add("is-fav");
    btn.querySelector("i").className = "fas fa-star";
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
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
  spanNbSales.innerHTML = sales.length;
  if (sales && sales.length > 0) {
    // Correctly parse the price from the object structure
    const prices = sales.map(s => {
      if (typeof s.price === 'object' && s.price.amount) return parseFloat(s.price.amount);
      return parseFloat(s.price) || 0;
    }).filter(p => p > 0);

    if (prices.length > 0) {
        spanP5.innerHTML = percentile(prices, 0.05).toFixed(2) + " \u20AC";
        spanP25.innerHTML = percentile(prices, 0.25).toFixed(2) + " \u20AC";
        spanP50.innerHTML = percentile(prices, 0.50).toFixed(2) + " \u20AC";
    } else {
        spanP5.innerHTML = "-"; spanP25.innerHTML = "-"; spanP50.innerHTML = "-";
    }

    const dates = sales.map(s => s.published ? new Date(s.published * 1000) : null).filter(d => d !== null);
    if (dates.length > 1) {
        const diff = Math.ceil(Math.abs(new Date(Math.max(...dates)) - new Date(Math.min(...dates))) / (1000 * 60 * 60 * 24));
        spanLTV.innerHTML = diff + " days";
    } else {
        spanLTV.innerHTML = "-";
    }
  } else {
    spanP5.innerHTML = "-"; spanP25.innerHTML = "-"; spanP50.innerHTML = "-"; spanLTV.innerHTML = "-";
  }
};

const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  if (!pageCount) {
    selectPage.innerHTML = "<option value='1'>Page 1</option>";
    return;
  }
  selectPage.innerHTML = Array.from({length: pageCount}, (_, i) => `<option value="${i + 1}" ${i + 1 === currentPage ? 'selected' : ''}>Page ${i + 1}</option>`).join("");
};

const renderLegoSetIds = deals => {
  if (!deals) return;
  const ids = [...new Set(getIdsFromDeals(deals))].sort();
  selectLegoSetIds.innerHTML = `<option value="">Pick a set ID</option>` + ids.map(id => `<option value="${id}">${id}</option>`).join("");
};

const renderAll = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderLegoSetIds(deals);
  spanNbDeals.innerHTML = pagination.count || deals.length;
  if (deals.length > 0 && !selectedId) {
    updateMarketInfo(deals[0].id);
  }
};

selectShow.addEventListener("change", async (e) => {
  const data = await fetchDeals(1, parseInt(e.target.value));
  setCurrentDeals(data);
  renderAll(currentDeals, currentPagination);
});

selectPage.addEventListener("change", async (e) => {
  const data = await fetchDeals(parseInt(e.target.value), parseInt(selectShow.value));
  setCurrentDeals(data);
  renderAll(currentDeals, currentPagination);
});

selectLegoSetIds.addEventListener("change", (e) => {
  if (e.target.value) updateMarketInfo(e.target.value);
});

document.querySelector("#filter-discount").addEventListener("click", (e) => {
  const filtered = currentDeals.filter(d => (d.discount || 0) >= 50);
  renderDeals(filtered);
  document.querySelectorAll(".btn").forEach(b => b.classList.remove("active"));
  e.currentTarget.classList.add("active");
});

document.querySelector("#filter-commented").addEventListener("click", (e) => {
  const filtered = currentDeals.filter(d => (d.comments || 0) >= 15);
  renderDeals(filtered);
  document.querySelectorAll(".btn").forEach(b => b.classList.remove("active"));
  e.currentTarget.classList.add("active");
});

document.querySelector("#filter-hot").addEventListener("click", (e) => {
  const filtered = currentDeals.filter(d => (d.temperature || 0) >= 100);
  renderDeals(filtered);
  document.querySelectorAll(".btn").forEach(b => b.classList.remove("active"));
  e.currentTarget.classList.add("active");
});

document.querySelector("#filter-favorites").addEventListener("click", (e) => {
  renderDeals(favorites);
  document.querySelectorAll(".btn").forEach(b => b.classList.remove("active"));
  e.currentTarget.classList.add("active");
});

selectSort.addEventListener("change", (e) => {
  let sorted = [...currentDeals];
  const type = e.target.value;
  if (type === "price-asc") sorted.sort((a,b) => a.price - b.price);
  if (type === "price-desc") sorted.sort((a,b) => b.price - a.price);
  if (type === "date-asc") sorted.sort((a,b) => new Date(b.published * 1000) - new Date(a.published * 1000));
  if (type === "date-desc") sorted.sort((a,b) => new Date(a.published * 1000) - new Date(b.published * 1000));
  renderDeals(sorted);
});

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchDeals();
  setCurrentDeals(data);
  renderAll(currentDeals, currentPagination);
});
