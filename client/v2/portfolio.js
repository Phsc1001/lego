"use strict";

let currentDeals = [];
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

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

const btnFilterDiscount = document.querySelector("#filter-discount");
const btnFilterCommented = document.querySelector("#filter-commented");
const btnFilterHot = document.querySelector("#filter-hot");
const btnFilterFavorites = document.querySelector("#filter-favorites");

const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`);
    const body = await response.json();
    if (body.success !== true) return {currentDeals, currentPagination};
    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

const fetchSales = async (id) => {
  try {
    const response = await fetch(`https://lego-api-blue.vercel.app/sales?id=${id}`);
    const body = await response.json();
    return body.success === true ? body.data.result : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const renderDeals = (deals) => {
  const template = deals
    .map(deal => {
      const isFav = favorites.some(fav => fav.uuid === deal.uuid);
      const discount = deal.discount ? `<div class="deal-badge">-${deal.discount}%</div>` : "";
      const hot = (deal.temperature || 0) > 100 ? "hot" : "";
      
      return `
      <div class="deal-card" id="${deal.uuid}">
        <div class="deal-img-wrapper">
          ${discount}
          <img class="deal-img" src="${deal.photo || 'https://placehold.co/300x300?text=No+Photo'}" alt="${deal.title}" onerror="this.src='https://placehold.co/300x300?text=No+Photo'">
          <button class="deal-fav ${isFav ? "is-fav" : ""}" data-uuid="${deal.uuid}">
            <i class="${isFav ? 'fas' : 'far'} fa-star"></i>
          </button>
        </div>
        <div class="deal-content">
          <div class="deal-id">ID: ${deal.id}</div>
          <a class="deal-title" href="${deal.link}" target="_blank">${deal.title}</a>
          <div class="deal-meta">
            <div class="deal-price">${deal.price || 0} €</div>
            <div class="deal-stats">
              <span class="${hot}"><i class="fas fa-fire"></i> ${Math.round(deal.temperature || 0)}°</span>
              <span><i class="fas fa-comment"></i> ${deal.comments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  sectionDealsGrid.innerHTML = template || "<p>No deals found matching your criteria.</p>";

  const favBtns = sectionDealsGrid.querySelectorAll(".deal-fav");
  favBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const uuid = btn.getAttribute("data-uuid");
      const deal = currentDeals.find(d => d.uuid === uuid) || favorites.find(d => d.uuid === uuid);
      const index = favorites.findIndex(fav => fav.uuid === uuid);
      
      if (index > -1) {
        favorites.splice(index, 1);
        btn.classList.remove("is-fav");
        btn.querySelector('i').className = 'far fa-star';
      } else if (deal) {
        favorites.push(deal);
        btn.classList.add("is-fav");
        btn.querySelector('i').className = 'fas fa-star';
      }
      localStorage.setItem("favorites", JSON.stringify(favorites));
    });
  });
};

const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from({length: pageCount}, (_, i) => `<option value="${i + 1}" ${i + 1 === currentPage ? 'selected' : ''}>Page ${i + 1}</option>`).join("");
  selectPage.innerHTML = options;
};

const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const uniqueIds = [...new Set(ids)].sort();
  const options = uniqueIds.map(id => `<option value="${id}">${id}</option>`).join("");
  selectLegoSetIds.innerHTML = `<option value="">All Sets</option>` + options;
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
    if (sales.length > 0) {
        const prices = sales.map(s => s.price);
        spanP5.innerHTML = percentile(prices, 0.05).toFixed(2) + " €";
        spanP25.innerHTML = percentile(prices, 0.25).toFixed(2) + " €";
        spanP50.innerHTML = percentile(prices, 0.5).toFixed(2) + " €";
        
        const dates = sales.map(s => new Date(s.published));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const diffDays = Math.ceil(Math.abs(maxDate - minDate) / (1000 * 60 * 60 * 24));
        spanLTV.innerHTML = diffDays + " days";
    } else {
        spanP5.innerHTML = "-"; spanP25.innerHTML = "-"; spanP50.innerHTML = "-"; spanLTV.innerHTML = "-";
    }
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  spanNbDeals.innerHTML = pagination.count;
  renderLegoSetIds(deals);
};

selectShow.addEventListener("change", async (e) => {
  const deals = await fetchDeals(1, parseInt(e.target.value));
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectPage.addEventListener("change", async (e) => {
  const deals = await fetchDeals(parseInt(e.target.value), parseInt(selectShow.value));
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

selectLegoSetIds.addEventListener("change", async (e) => {
    const id = e.target.value;
    if (id) {
        const sales = await fetchSales(id);
        renderSalesIndicators(sales);
    } else {
        renderSalesIndicators([]);
    }
});

btnFilterDiscount.addEventListener("click", () => {
  const filtered = currentDeals.filter(deal => (deal.discount || 0) >= 50);
  renderDeals(filtered);
});

btnFilterCommented.addEventListener("click", () => {
  const filtered = currentDeals.filter(deal => (deal.comments || 0) >= 15);
  renderDeals(filtered);
});

btnFilterHot.addEventListener("click", () => {
  const filtered = currentDeals.filter(deal => (deal.temperature || 0) >= 100);
  renderDeals(filtered);
});

btnFilterFavorites.addEventListener("click", () => {
    renderDeals(favorites);
});

selectSort.addEventListener("change", (e) => {
  const sortType = e.target.value;
  let sortedDeals = [...currentDeals];
  switch (sortType) {
    case "price-asc": sortedDeals.sort((a, b) => a.price - b.price); break;
    case "price-desc": sortedDeals.sort((a, b) => b.price - a.price); break;
    case "date-asc": sortedDeals.sort((a, b) => new Date(b.published) - new Date(a.published)); break;
    case "date-desc": sortedDeals.sort((a, b) => new Date(a.published) - new Date(b.published)); break;
  }
  renderDeals(sortedDeals);
});

document.addEventListener("DOMContentLoaded", async () => {
  const deals = await fetchDeals();
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
