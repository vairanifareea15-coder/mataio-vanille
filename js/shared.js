'use strict';

// ===== SÉCURITÉ =====
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== DEVISES =====
// 1 EUR = 119.33174 XPF (taux fixe officiel)
// 1 USD ≈ 110.50 XPF (taux approximatif)
const RATES = { XPF: 1, EUR: 1 / 119.33174, USD: 1 / 110.50 };
let currentCurrency = localStorage.getItem('mataio_currency') || 'XPF';

function setCurrency(currency) {
  currentCurrency = currency;
  localStorage.setItem('mataio_currency', currency);
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.currency === currency);
  });
  // Rafraîchir tous les prix affichés
  if (typeof renderProducts === 'function') renderProducts();
  if (typeof refreshProductPagePrices === 'function') refreshProductPagePrices();
  if (typeof renderSummary === 'function') renderSummary();
  updateCartUI();
}

function formatPrice(amountXPF) {
  const amount = amountXPF * RATES[currentCurrency];
  if (currentCurrency === 'XPF') {
    return Math.round(amount).toLocaleString('fr-FR') + ' XPF';
  }
  if (currentCurrency === 'EUR') {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }
  if (currentCurrency === 'USD') {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  return amount;
}

// ===== CATALOGUE =====
// Prix en XPF (Francs Pacifique) — devise de référence
// Vanille 1ère catégorie : 65 000 XPF/kg → 5 gousses ≈ 35g → 2 275 XPF
const PRODUCTS = [
  {
    id: 1,
    name: 'Vanille 2ème Catégorie',
    shortDesc: 'Gousses courtes et très concentrées en vanilline. Idéales pour extraits, infusions et sucre vanillé maison.',
    desc: 'La vanille 2ème catégorie de notre grand-père, c\'est la vanille des cuisiniers malins. Ces gousses sont plus courtes (moins de 14 cm) et plus sèches que la 1ère catégorie, mais elles sont souvent encore plus concentrées en vanilline — l\'arôme n\'a rien à envier aux gousses plus belles. Parfaites pour préparer vos propres extraits maison, infuser du lait ou du sucre, ou partout où l\'apparence de la gousse n\'a pas d\'importance.',
    usage: 'Idéale pour faire un extrait maison : faites macérer 5 gousses fendues dans 100 ml d\'alcool pendant 2 mois. Parfaite aussi pour infuser du lait, de la crème ou du sucre. Peut être broyée pour obtenir une poudre de vanille maison. Plus économique que la 1ère catégorie pour les grandes quantités.',
    priceXPF: 3500,
    unit: 'paquet 100g',
    emoji: '',
    badge: 'Économique',
    bg: '#EDD8DC',
    image: 'https://images.unsplash.com/photo-1592788174877-3f99727fd23d?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: 52,
    reviews: [
      { author: 'Pierre V.', stars: 5, text: 'Parfait pour faire mes extraits maison. L\'arôme est puissant, le prix est honnête. Je recommande.' },
      { author: 'Lucie B.', stars: 4, text: 'Très bon rapport qualité-prix. Les gousses sont petites mais très parfumées. Idéal pour infuser.' },
      { author: 'Thomas R.', stars: 5, text: 'J\'utilise ces gousses pour parfumer mon sucre. En quelques semaines le résultat est bluffant.' },
    ],
  },
  {
    id: 2,
    name: 'Vanille 1ère Catégorie',
    shortDesc: 'Gousses de qualité supérieure, idéales pour toutes vos préparations du quotidien.',
    desc: 'La vanille 1ère catégorie est la vanille du quotidien de notre grand-père. Ces gousses mesurent entre 14 et 17 cm, entièrement noires, souples, bien charnues et gorgées de graines aromatiques. Leur parfum floral et sucré est une signature de la Polynésie Française. Chaque gousse est cueillie à maturité optimale puis séchée selon les gestes transmis de génération en génération à Raiatea.',
    usage: 'Parfaite pour tous les usages courants : gâteaux, yaourts, compotes, riz au lait, crêpes, biscuits. Fendez et grattez comme une gousse classique. Une gousse par litre de préparation. Les gousses épuisées peuvent être réutilisées pour faire du sucre vanillé maison.',
    priceXPF: 6500,
    pricePerKgXPF: 65000,
    unit: 'paquet 100g',
    emoji: '',
    badge: 'Best-seller',
    bg: '#F2E0E4',
    image: 'https://images.unsplash.com/photo-1592788174877-3f99727fd23d?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 134,
    reviews: [
      { author: 'Sophie M.', stars: 5, text: 'Un rapport qualité-prix imbattable. Des gousses bien charnues, très parfumées. Je commande régulièrement.' },
      { author: 'Thomas R.', stars: 5, text: 'Livraison soignée, gousses fraîches et souples. Bien meilleures que tout ce qu\'on trouve en supermarché.' },
      { author: 'Lucie B.', stars: 4, text: 'Très bonnes gousses pour le quotidien. Parfum délicat et floral, typiquement polynésien.' },
    ],
  },
  {
    id: 3,
    name: 'Vanille en Poudre',
    shortDesc: 'Gousses de Raiatea broyées finement. Pure, sans additifs, sans sucre ajouté.',
    desc: 'Notre poudre de vanille est obtenue par broyage fin de gousses entières séchées, cultivées par notre grand-père à Raiatea. Aucun additif, aucun sucre ajouté, aucun arôme artificiel — uniquement de la vanille polynésienne pure. Sa texture fine se dissout rapidement dans toutes vos préparations et libère un arôme floral intense et naturel.',
    usage: 'Comptez environ 1 g de poudre (une petite cuillère rase) pour remplacer une gousse entière. Idéale dans les smoothies, yaourts, porridges, pâtes à gâteaux et crèmes. Peut s\'incorporer sans chauffe, contrairement aux gousses. Se conserve 2 ans dans un endroit sec à l\'abri de la lumière.',
    priceXPF: 7000,
    unit: 'paquet 100g',
    emoji: '',
    badge: null,
    bg: '#F7EEF0',
    image: 'https://images.unsplash.com/photo-1592788174877-3f99727fd23d?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 61,
    reviews: [
      { author: 'Pierre V.', stars: 5, text: 'Une poudre d\'une pureté remarquable. L\'arôme est puissant, une petite quantité suffit.' },
      { author: 'Isabelle P.', stars: 5, text: 'Je l\'utilise dans mon café chaque matin. C\'est devenu indispensable.' },
      { author: 'Antoine G.', stars: 4, text: 'Très bonne poudre, facile à doser. Je la préfère aux gousses pour les recettes au quotidien.' },
    ],
  },
];

// ===== PANIER (localStorage) =====
function getCart() {
  try { return JSON.parse(localStorage.getItem('mataio_cart') || '[]'); }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem('mataio_cart', JSON.stringify(cart));
}

function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, priceXPF: product.priceXPF, unit: product.unit, emoji: product.emoji, qty: 1 });
  }
  saveCart(cart);
  updateCartUI();
  showToast(`${product.name} ajouté au panier !`);
}

function removeFromCart(productId) {
  saveCart(getCart().filter(item => item.id !== productId));
  updateCartUI();
}

function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    saveCart(cart.filter(i => i.id !== productId));
  } else {
    saveCart(cart);
  }
  updateCartUI();
}

function getTotalXPF() {
  return getCart().reduce((sum, item) => sum + item.priceXPF * item.qty, 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// ===== UI PANIER =====
function updateCartUI() {
  const cart = getCart();
  const countEl = document.getElementById('cartCount');
  if (countEl) countEl.textContent = getCartCount();

  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Votre panier est vide</p>';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-dot"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-price">${formatPrice(item.priceXPF * item.qty)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, +1)">+</button>
      </div>
    </div>
  `).join('');

  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = formatPrice(getTotalXPF());
  if (footerEl) footerEl.style.display = 'block';
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const btn = document.querySelector('.hamburger-btn');
  if (!menu) return;
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
  btn.classList.toggle('open');
  document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
}

function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('cartOverlay');
  if (!sidebar) return;
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

function checkout() {
  if (getCart().length === 0) return;
  window.location.href = 'checkout.html';
}

// ===== UTILITAIRES =====
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== INJECTION NAVBAR & CART =====
function initNavbar(type) {
  const root = document.getElementById('navbar-root');
  if (!root) return;

  const isIndex = type === 'index';
  const base = isIndex ? '' : 'index.html';

  if (type === 'checkout') {
    root.innerHTML = `
      <header class="navbar navbar-checkout">
        <a href="javascript:history.back()" class="checkout-back">← Retour</a>
        <div class="nav-brand">
          <a href="index.html" style="display:flex;align-items:center;gap:.6rem;text-decoration:none">
            <span class="brand-name">Mataio Vanille</span>
          </a>
        </div>
        <div class="checkout-secure">Paiement sécurisé</div>
      </header>`;
    return;
  }

  root.innerHTML = `
    <header class="vn-navbar navbar">
      <nav class="nav-links vn-nav">
        <a href="${base}#produits">Boutique</a>
        <a href="${base}#origine">Origine</a>
        <a href="${base}#produits">Savoir-faire</a>
        <a href="${base}#contact">Contact</a>
      </nav>
      <a href="${base || 'index.html'}" class="nav-brand">
        <span class="brand-name">Mataio Vanille</span>
        <span class="brand-subtitle">Raiatea · Polynésie</span>
      </a>
      <div class="nav-actions vn-actions">
        <button class="cart-btn" onclick="toggleCart()">
          Panier <span class="cart-count" id="cartCount">0</span>
        </button>
        <button class="hamburger-btn" onclick="toggleMobileMenu()" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <!-- Menu mobile -->
    <div class="mobile-menu" id="mobileMenu">
      <a href="${base}#produits" onclick="toggleMobileMenu()">Boutique</a>
      <a href="${base}#origine" onclick="toggleMobileMenu()">Origine</a>
      <a href="${base}#produits" onclick="toggleMobileMenu()">Savoir-faire</a>
      <a href="${base}#contact" onclick="toggleMobileMenu()">Contact</a>
    </div>
    <div class="mobile-menu-overlay" id="mobileMenuOverlay" onclick="toggleMobileMenu()"></div>`;
}

function initCart() {
  const root = document.getElementById('cart-root');
  if (!root) return;
  root.innerHTML = `
    <div class="cart-overlay" id="cartOverlay" onclick="toggleCart()"></div>
    <div class="cart-sidebar" id="cartSidebar">
      <div class="cart-header">
        <h3>Votre Panier</h3>
        <button onclick="toggleCart()" class="close-btn">✕</button>
      </div>
      <div class="cart-items" id="cartItems">
        <p class="cart-empty">Votre panier est vide</p>
      </div>
      <div class="cart-footer" id="cartFooter" style="display:none">
        <div class="cart-total">
          <span>Total</span>
          <span id="cartTotal">0 XPF</span>
        </div>
        <button class="btn-primary btn-full" onclick="checkout()">Commander</button>
      </div>
    </div>
    <div class="toast" id="toast"></div>`;
}

// ===== COOKIES RGPD =====
function initCookieBanner() {
  if (localStorage.getItem('mataio_cookies')) return;
  const banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.innerHTML = `
    <p>Ce site utilise des cookies pour mémoriser votre panier et vos préférences. <a href="index.html#contact" style="color:var(--or);text-underline-offset:3px;">En savoir plus</a></p>
    <div class="cookie-btns">
      <button onclick="acceptCookies()">Accepter</button>
      <button onclick="refuseCookies()" class="cookie-refuse">Refuser</button>
    </div>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('show'), 300);
}

function acceptCookies() {
  localStorage.setItem('mataio_cookies', 'accepted');
  closeCookieBanner();
}

function refuseCookies() {
  localStorage.setItem('mataio_cookies', 'refused');
  closeCookieBanner();
}

function closeCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) { banner.classList.remove('show'); setTimeout(() => banner.remove(), 400); }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  // Synchroniser l'état des boutons devise avec la valeur sauvegardée
  document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.currency === currentCurrency);
  });
  // Rafraîchir les prix si la devise n'est pas XPF
  if (currentCurrency !== 'XPF' && typeof renderProducts === 'function') {
    renderProducts();
  }
  initCookieBanner();
});
