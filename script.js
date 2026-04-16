/* ═══════════════════════════════════════════
   L'Oréal Routine Builder — Full Logic
   With Web Search & RTL LevelUps
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
const webSearchToggle = document.getElementById("webSearchToggle");
const rtlToggle = document.getElementById("rtlToggle");
const rtlLabel = document.getElementById("rtlLabel");

// Modal
const productModal = document.getElementById("productModal");
const modalClose = document.getElementById("modalClose");
const modalImage = document.getElementById("modalImage");
const modalName = document.getElementById("modalName");
const modalBrand = document.getElementById("modalBrand");
const modalCategory = document.getElementById("modalCategory");
const modalDescription = document.getElementById("modalDescription");
const modalSelectBtn = document.getElementById("modalSelectBtn");

/* ── Config ── */
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
- When web search is enabled, include relevant links and current information

Tone: Warm, luxurious, knowledgeable — reflecting L'Oréal's "Because You're Worth It" identity.
Keep responses concise (2-4 paragraphs max).`;

const conversationHistory = [{ role: "system", content: SYSTEM_PROMPT }];

/* ══════════════════════════════════════════
   RTL TOGGLE (LevelUp: RTL Language Support)
   ══════════════════════════════════════════ */
function loadRTLPreference() {
  const isRTL = localStorage.getItem("lorealRTL") === "true";
  applyRTL(isRTL);
}

function applyRTL(isRTL) {
  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", isRTL ? "ar" : "en");
  rtlToggle.classList.toggle("active", isRTL);
  rtlLabel.textContent = isRTL ? "LTR" : "RTL";
}

rtlToggle.addEventListener("click", () => {
  const currentlyRTL = document.documentElement.getAttribute("dir") === "rtl";
  const newRTL = !currentlyRTL;
  localStorage.setItem("lorealRTL", newRTL);
  applyRTL(newRTL);
});

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
   LOCALSTORAGE — Save/Load Selections
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

  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      toggleProduct(parseInt(card.dataset.id));
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
    card.classList.toggle(
      "selected",
      selectedProducts.some((p) => p.id === id),
    );
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

    document.querySelectorAll(".remove-tag").forEach((btn) => {
      btn.addEventListener("click", () =>
        toggleProduct(parseInt(btn.dataset.id)),
      );
    });
  }
}

/* ── Clear All ── */
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
  updateModalButton(isSelected);
  productModal.style.display = "flex";
}

function updateModalButton(isSelected) {
  modalSelectBtn.innerHTML = isSelected
    ? '<i class="fa-solid fa-check"></i> Added to Routine'
    : '<i class="fa-solid fa-plus"></i> Add to Routine';
  modalSelectBtn.className = isSelected
    ? "modal-select-btn added"
    : "modal-select-btn";
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
  updateModalButton(
    selectedProducts.some((p) => p.id === currentModalProduct.id),
  );
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

categoryFilter.addEventListener("change", () =>
  displayProducts(getFilteredProducts()),
);

searchInput.addEventListener("input", () => {
  if (!categoryFilter.value) categoryFilter.value = "all";
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
    const isBullets = lines.every((l) => /^[-•*]\s/.test(l.trim()));
    const isNumbered = lines.every((l) => /^\d+[\.\)]\s/.test(l.trim()));

    if (isBullets) {
      html +=
        "<ul>" +
        lines
          .map((l) => `<li>${esc(l.trim().replace(/^[-•*]\s*/, ""))}</li>`)
          .join("") +
        "</ul>";
    } else if (isNumbered) {
      html +=
        "<ol>" +
        lines
          .map((l) => `<li>${esc(l.trim().replace(/^\d+[\.\)]\s*/, ""))}</li>`)
          .join("") +
        "</ol>";
    } else {
      html += `<p>${esc(trimmed)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(
          /\[(.*?)\]\((https?:\/\/[^\)]+)\)/g,
          '<a href="$2" target="_blank" class="citation-link">$1</a>',
        )
        .replace(/\n/g, "<br>")}</p>`;
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
   PARSE WEB SEARCH RESPONSE (LevelUp)
   ══════════════════════════════════════════ */
function extractWebSearchResponse(data, isWebSearch) {
  // Regular chat completions format
  if (!isWebSearch) {
    const content = data.choices?.[0]?.message?.content;
    return { text: content || "No response received.", citations: [] };
  }

  // Responses API format (web search)
  // The output is an array of content blocks
  let text = "";
  let citations = [];

  const output = data.output;
  if (!output || !Array.isArray(output)) {
    // Fallback: try chat completions format
    const content = data.choices?.[0]?.message?.content;
    if (content) return { text: content, citations: [] };
    return { text: "No response received.", citations: [] };
  }

  for (const block of output) {
    // message blocks contain the text
    if (block.type === "message" && block.content) {
      for (const part of block.content) {
        if (part.type === "output_text") {
          text += part.text;
          // Extract annotations/citations
          if (part.annotations) {
            for (const ann of part.annotations) {
              if (ann.type === "url_citation" && ann.url) {
                citations.push({
                  title: ann.title || ann.url,
                  url: ann.url,
                });
              }
            }
          }
        }
      }
    }
  }

  if (!text) {
    return { text: "No response received.", citations: [] };
  }

  return { text, citations };
}

function formatCitations(citations) {
  if (!citations || citations.length === 0) return "";

  const uniqueCitations = citations.filter(
    (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i,
  );

  if (uniqueCitations.length === 0) return "";

  let html = '<div class="citations-block"><strong>Sources:</strong><br>';
  uniqueCitations.forEach((c, i) => {
    const title = c.title || new URL(c.url).hostname;
    html += `${i + 1}. <a href="${c.url}" target="_blank">${esc(title)}</a><br>`;
  });
  html += "</div>";
  return html;
}

/* ══════════════════════════════════════════
   SEND MESSAGE TO CLOUDFLARE WORKER
   ══════════════════════════════════════════ */
async function sendToAPI(userText) {
  conversationHistory.push({ role: "user", content: userText });
  showTyping();
  userInput.disabled = true;
  sendBtn.disabled = true;

  const useWebSearch = webSearchToggle.checked;

  try {
    const body = {
      messages: conversationHistory,
    };

    // LevelUp: Web Search — tell worker to enable web search tool
    if (useWebSearch) {
      body.web_search = true;
      body.model = "gpt-4o";
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`API status ${response.status}`);

    const data = await response.json();

    // Parse response (handles both regular and web search formats)
    const { text: aiMessage, citations } = extractWebSearchResponse(
      data,
      useWebSearch,
    );

    conversationHistory.push({ role: "assistant", content: aiMessage });
    hideTyping();

    // Build response with citations if web search was used
    let responseHTML = formatResponse(aiMessage);
    if (useWebSearch && citations.length > 0) {
      responseHTML += formatCitations(citations);
    }

    appendBubble("assistant", responseHTML, true);
  } catch (error) {
    console.error("API error:", error);
    hideTyping();
    appendBubble(
      "assistant",
      "I'm having trouble connecting. Please check your Cloudflare Worker and try again.",
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
  loadRTLPreference();
})();
