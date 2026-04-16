/* ═══════════════════════════════════════════
   L'Oréal Routine Builder — Full Logic
   ═══════════════════════════════════════════ */

/* ── DOM Elements ── */
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const clearAllBtn = document.getElementById("clearAllBtn");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Modal elements
const productModal = document.getElementById("productModal");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalBrand = document.getElementById("modalBrand");
const modalCategory = document.getElementById("modalCategory");
const modalDescription = document.getElementById("modalDescription");
const modalSelectBtn = document.getElementById("modalSelectBtn");

/* ── Configuration ── */
const API_URL = "https://loreal-chatbot.jaskiratsingh4752.workers.dev";

/* ── State ── */
let allProducts = [];
let selectedProducts = [];
let currentModalProduct = null;

/* ── System Prompt ── */
const SYSTEM_PROMPT = `You are L'Oréal's Smart Routine & Product Advisor, an expert beauty consultant for L'Oréal Group brands (CeraVe, La Roche-Posay, Vichy, L'Oréal Paris, Garnier, Maybelline, Lancôme, Kiehl's, Kérastase, SkinCeuticals, Urban Decay, YSL Beauty, Redken).

When generating a routine:
- Create a step-by-step morning and/or evening routine using ONLY the selected products
- Explain the order and why each product fits at that step
- Include tips on application technique
- Be specific about how each product's ingredients benefit the user

For follow-up questions:
- Answer questions about the routine, products, skincare/haircare/makeup/fragrance topics
- If asked something unrelated to beauty, politely redirect
- Remember the conversation context including which products were selected

Tone: Warm, luxurious, knowledgeable — reflecting L'Oréal's "Because You're Worth It" identity.
Keep responses concise (2-4 paragraphs max).`;

const conversationHistory = [{ role: "system", content: SYSTEM_PROMPT }];

/* ══════════════════════════════════════════
   LOAD PRODUCTS
   ══════════════════════════════════════════ */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* ══════════════════════════════════════════
   LOAD SAVED SELECTIONS FROM LOCALSTORAGE
   ══════════════════════════════════════════ */
function loadSavedSelections() {
  try {
    const saved = localStorage.getItem("lorealSelectedProducts");
    if (saved) {
      selectedProducts = JSON.parse(saved);
      renderSelectedProducts();
    }
  } catch (e) {
    console.error("Error loading saved selections:", e);
  }
}

function saveSelections() {
  localStorage.setItem(
    "lorealSelectedProducts",
    JSON.stringify(selectedProducts),
  );
}

/* ══════════════════════════════════════════
   DISPLAY PRODUCTS
   ══════════════════════════════════════════ */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        <i class="fa-solid fa-search"></i>
        <p>No products found — try a different category or search term</p>
      </div>`;
    return;
  }

  productsContainer.innerHTML = products
    .map((product) => {
      const isSelected = selectedProducts.some((p) => p.id === product.id);
      return `
      <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" />
        <div class="product-info">
          <span class="brand-label">${product.brand}</span>
          <h3>${product.name}</h3>
          <button class="info-btn" data-id="${product.id}" onclick="event.stopPropagation(); openModal(${product.id})">
            <i class="fa-solid fa-circle-info"></i> Details
          </button>
        </div>
      </div>`;
    })
    .join("");

  // Click to select/unselect
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = parseInt(card.dataset.id);
      toggleProduct(id);
    });
  });
}

/* ══════════════════════════════════════════
   PRODUCT SELECTION
   ══════════════════════════════════════════ */
function toggleProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  const index = selectedProducts.findIndex((p) => p.id === id);
  if (index > -1) {
    selectedProducts.splice(index, 1);
  } else {
    selectedProducts.push(product);
  }

  saveSelections();
  renderSelectedProducts();
  updateCardStates();
}

function updateCardStates() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const id = parseInt(card.dataset.id);
    const isSelected = selectedProducts.some((p) => p.id === id);
    card.classList.toggle("selected", isSelected);
  });
}

function renderSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<p class="empty-selection">No products selected yet — click a product card to add it</p>`;
    clearAllBtn.style.display = "none";
    generateBtn.disabled = true;
  } else {
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (p) => `
      <div class="selected-tag">
        <span>${p.name}</span>
        <button class="remove-tag" data-id="${p.id}" title="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`,
      )
      .join("");

    clearAllBtn.style.display = "inline-flex";
    generateBtn.disabled = false;

    // Remove individual items
    document.querySelectorAll(".remove-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        toggleProduct(id);
      });
    });
  }
}

/* ══════════════════════════════════════════
   CLEAR ALL
   ══════════════════════════════════════════ */
clearAllBtn.addEventListener("click", () => {
  selectedProducts = [];
  saveSelections();
  renderSelectedProducts();
  updateCardStates();
});

/* ══════════════════════════════════════════
   MODAL — Reveal Product Description
   ══════════════════════════════════════════ */
function openModal(id) {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return;

  currentModalProduct = product;
  modalImage.src = product.image;
  modalImage.alt = product.name;
  modalName.textContent = product.name;
  modalBrand.textContent = product.brand;
  modalCategory.textContent = product.category;
  modalDescription.textContent = product.description;

  const isSelected = selectedProducts.some((p) => p.id === id);
  modalSelectBtn.innerHTML = isSelected
    ? '<i class="fa-solid fa-check"></i> Added to Routine'
    : '<i class="fa-solid fa-plus"></i> Add to Routine';
  modalSelectBtn.className = isSelected
    ? "modal-select-btn added"
    : "modal-select-btn";

  productModal.style.display = "flex";
}

function closeModal() {
  productModal.style.display = "none";
  currentModalProduct = null;
}

modalClose.addEventListener("click", closeModal);
productModal.addEventListener("click", (e) => {
  if (e.target === productModal) closeModal();
});

modalSelectBtn.addEventListener("click", () => {
  if (!currentModalProduct) return;
  toggleProduct(currentModalProduct.id);

  const isNowSelected = selectedProducts.some(
    (p) => p.id === currentModalProduct.id,
  );
  modalSelectBtn.innerHTML = isNowSelected
    ? '<i class="fa-solid fa-check"></i> Added to Routine'
    : '<i class="fa-solid fa-plus"></i> Add to Routine';
  modalSelectBtn.className = isNowSelected
    ? "modal-select-btn added"
    : "modal-select-btn";
});

/* ══════════════════════════════════════════
   FILTER & SEARCH (LevelUp: Product Search)
   ══════════════════════════════════════════ */
function getFilteredProducts() {
  let filtered = allProducts;

  const category = categoryFilter.value;
  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }

  const search = searchInput.value.trim().toLowerCase();
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.brand.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search),
    );
  }

  return filtered;
}

categoryFilter.addEventListener("change", () => {
  displayProducts(getFilteredProducts());
});

searchInput.addEventListener("input", () => {
  // If user types without selecting a category, show all matches
  if (!categoryFilter.value) {
    categoryFilter.value = "all";
  }
  displayProducts(getFilteredProducts());
});

/* ══════════════════════════════════════════
   CHAT HELPERS
   ══════════════════════════════════════════ */
function appendBubble(role, content, isHTML = false) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.innerHTML =
    role === "user"
      ? '<i class="fa-solid fa-user"></i>'
      : '<i class="fa-solid fa-spa"></i>';

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  if (isHTML) {
    bubble.innerHTML = content;
  } else if (role === "assistant") {
    bubble.innerHTML = formatResponse(content);
  } else {
    bubble.textContent = content;
  }

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function formatResponse(text) {
  const paragraphs = text.split("\n\n");
  let html = "";
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const isList = lines.every((l) => /^[-•*]\s/.test(l.trim()));
    if (isList) {
      html +=
        "<ul>" +
        lines
          .map((l) => `<li>${esc(l.trim().replace(/^[-•*]\s*/, ""))}</li>`)
          .join("") +
        "</ul>";
    } else {
      // Handle numbered lists like "1. Step one"
      const isNumbered = lines.every((l) => /^\d+[\.\)]\s/.test(l.trim()));
      if (isNumbered) {
        html +=
          "<ol>" +
          lines
            .map(
              (l) => `<li>${esc(l.trim().replace(/^\d+[\.\)]\s*/, ""))}</li>`,
            )
            .join("") +
          "</ol>";
      } else {
        html += `<p>${esc(trimmed)
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\n/g, "<br>")}</p>`;
      }
    }
  }
  return html || `<p>${esc(text)}</p>`;
}

function esc(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function showTyping() {
  const msg = document.createElement("div");
  msg.className = "msg assistant";
  msg.id = "typingIndicator";
  msg.innerHTML = `
    <div class="msg-avatar"><i class="fa-solid fa-spa"></i></div>
    <div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function hideTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

/* ══════════════════════════════════════════
   SEND MESSAGE TO CLOUDFLARE WORKER
   ══════════════════════════════════════════ */
async function sendToAPI(userText) {
  conversationHistory.push({ role: "user", content: userText });
  showTyping();
  userInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) throw new Error(`API status ${response.status}`);

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    conversationHistory.push({ role: "assistant", content: aiMessage });
    hideTyping();
    appendBubble("assistant", aiMessage);
  } catch (error) {
    console.error("API error:", error);
    hideTyping();
    appendBubble(
      "assistant",
      "I'm having trouble connecting. Please check your Cloudflare Worker configuration and try again.",
      true,
    );
  } finally {
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

/* ══════════════════════════════════════════
   GENERATE ROUTINE
   ══════════════════════════════════════════ */
generateBtn.addEventListener("click", () => {
  if (selectedProducts.length === 0) return;

  const productData = selectedProducts.map((p) => ({
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
  }));

  const prompt = `Please create a personalized beauty routine using ONLY these selected products:\n\n${JSON.stringify(productData, null, 2)}\n\nOrganize into morning and/or evening steps as appropriate. Explain the order and application tips.`;

  appendBubble(
    "user",
    `Generate a routine with my ${selectedProducts.length} selected products`,
  );
  sendToAPI(prompt);
});

/* ══════════════════════════════════════════
   CHAT FOLLOW-UP
   ══════════════════════════════════════════ */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  userInput.value = "";
  appendBubble("user", text);
  sendToAPI(text);
});

/* ══════════════════════════════════════════
   INITIALIZE
   ══════════════════════════════════════════ */
(async function init() {
  await loadProducts();
  loadSavedSelections();
})();
