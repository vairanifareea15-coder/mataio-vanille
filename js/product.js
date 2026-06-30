'use strict';

const sbProduct = supabase.createClient(
  'https://wggdfxekesluqprxhomk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2RmeGVrZXNsdXFwcnhob21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTA5NzgsImV4cCI6MjA5ODA4Njk3OH0.MClwLc6FFBwFdBjJzokm6FrZQ5VEjMst9MZJNRlDWvA'
);

let currentProduct = null;
let selectedQty = 1;

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'), 10);
}

function renderProduct(product) {
  document.title = `${product.name} — Mataio Vanille`;
  document.getElementById('breadcrumbName').textContent = product.name;

  const hasPhoto = product.id === 1;
  const imageHTML = hasPhoto
    ? `<img src="${product.image}" alt="${product.name}" />`
    : `<div class="pd-emoji-bg" style="background:${product.bg}">${product.emoji}</div>`;

  document.getElementById('productDetail').innerHTML = `
    <div class="pd-image-wrap">
      <div class="pd-main-img">${imageHTML}</div>
      <div class="pd-trust">
        <span class="pd-trust-item">Bio certifié</span>
        <span class="pd-trust-item">Livraison 48h</span>
        <span class="pd-trust-item">Retour 30 jours</span>
        <span class="pd-trust-item">Raiatea, PF</span>
      </div>
    </div>

    <div class="pd-info">
      ${product.badge ? `<span class="pd-badge">${product.badge}</span>` : ''}
      <h1 class="pd-name">${product.name}</h1>

      <div class="pd-rating" id="pdRatingWrap">
        <span class="pd-stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
        <span class="pd-rating-num">${product.rating}</span>
        <span class="pd-rating-count">(${product.reviewCount} avis)</span>
      </div>

      <div class="pd-price-wrap">
        <span class="pd-price">${formatPrice(product.priceXPF)}</span>
        <span class="pd-unit">/ ${product.unit}</span>
      </div>
      ${product.pricePerKgXPF ? `<p class="pd-price-kg">soit ${formatPrice(product.pricePerKgXPF)} / kg</p>` : ''}
      <p class="pd-shipping">Livraison gratuite dès 2 000 XPF</p>

      <p class="pd-short-desc">${product.shortDesc}</p>

      <div class="pd-qty-label">Quantité</div>
      <div class="pd-qty-wrap">
        <button class="pd-qty-btn" onclick="changeSelectedQty(-1)">−</button>
        <span class="pd-qty-num" id="selectedQtyDisplay">1</span>
        <button class="pd-qty-btn" onclick="changeSelectedQty(+1)">+</button>
      </div>

      <button class="pd-add-btn" onclick="addCurrentToCart()">
        Ajouter au panier — ${formatPrice(product.priceXPF)}
      </button>
      <button class="pd-wishlist-btn">Ajouter à ma liste de souhaits</button>
    </div>
  `;

  document.getElementById('tabDescription').innerHTML = `<p>${product.desc}</p>`;
  document.getElementById('tabUtilisation').innerHTML = `<p>${product.usage}</p>`;

  loadAvis(product.id);

  const related = PRODUCTS.filter(p => p.id !== product.id).slice(0, 3);
  document.getElementById('relatedGrid').innerHTML = related.map(p => `
    <div class="product-card">
      <a href="product.html?id=${p.id}" class="product-img-link">
        <div class="product-img" style="background:${p.bg}">
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        </div>
      </a>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <span class="stars-sm">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
          <span class="rating-count">(${p.reviewCount})</span>
        </div>
        <p class="product-desc">${p.shortDesc}</p>
        <div class="product-footer">
          <div class="product-price">
            ${formatPrice(p.price)}
            <span>/ ${p.unit}</span>
          </div>
          <div class="product-actions">
            <a href="product.html?id=${p.id}" class="btn-outline">Voir</a>
            <button class="add-btn" onclick="addToCart(${p.id})">+ Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('productTabsSection').style.display = 'block';
  document.getElementById('relatedSection').style.display = 'block';
}

async function loadAvis(produitId) {
  const { data: avis } = await sbProduct
    .from('avis')
    .select('*')
    .eq('produit_id', produitId)
    .eq('valide', true)
    .order('created_at', { ascending: false });

  const listeHTML = (avis && avis.length > 0)
    ? avis.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${r.auteur[0].toUpperCase()}</div>
          <div>
            <div class="review-author">${r.auteur}</div>
            <div class="review-stars">${'★'.repeat(r.note)}${'☆'.repeat(5 - r.note)}</div>
          </div>
        </div>
        <p class="review-text">${r.commentaire}</p>
      </div>
    `).join('')
    : '<p class="avis-vide">Aucun avis pour ce produit. Soyez le premier !</p>';

  document.getElementById('tabAvis').innerHTML = `
    ${listeHTML}

    <div class="avis-form-wrap">
      <h3 class="avis-form-title">Laisser un avis</h3>
      <div class="avis-stars-pick" id="avisPick">
        ${[1,2,3,4,5].map(n => `<span class="avis-star" data-note="${n}" onclick="setNote(${n})">★</span>`).join('')}
      </div>
      <p class="avis-note-label" id="avisNoteLabel">Choisissez une note</p>
      <input type="text" id="avisAuteur" class="avis-input" placeholder="Votre prénom" maxlength="50" />
      <textarea id="avisCommentaire" class="avis-input avis-textarea" placeholder="Votre avis…" rows="4" maxlength="500"></textarea>
      <button class="btn-primary" onclick="soumettreAvis(${produitId})">Envoyer</button>
      <p class="avis-mention">Votre avis sera visible après validation.</p>
    </div>
  `;
}

let noteSelectionnee = 0;

function setNote(n) {
  noteSelectionnee = n;
  document.querySelectorAll('.avis-star').forEach((s, i) => {
    s.classList.toggle('active', i < n);
  });
  const labels = ['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'];
  document.getElementById('avisNoteLabel').textContent = labels[n];
}

async function soumettreAvis(produitId) {
  const auteur      = document.getElementById('avisAuteur').value.trim();
  const commentaire = document.getElementById('avisCommentaire').value.trim();

  if (!noteSelectionnee) { showToast('Choisissez une note.'); return; }
  if (!auteur)            { showToast('Entrez votre prénom.'); return; }
  if (!commentaire)       { showToast('Écrivez un commentaire.'); return; }

  const btn = document.querySelector('.avis-form-wrap .btn-primary');
  btn.textContent = 'Envoi…';
  btn.disabled = true;

  const { error } = await sbProduct.from('avis').insert({
    produit_id: produitId,
    auteur,
    note: noteSelectionnee,
    commentaire,
    valide: false,
  });

  btn.textContent = 'Envoyer';
  btn.disabled = false;

  if (error) {
    showToast('Erreur. Réessayez.');
  } else {
    showToast('Merci ! Votre avis sera visible après validation.');
    document.getElementById('avisAuteur').value = '';
    document.getElementById('avisCommentaire').value = '';
    noteSelectionnee = 0;
    document.querySelectorAll('.avis-star').forEach(s => s.classList.remove('active'));
    document.getElementById('avisNoteLabel').textContent = 'Choisissez une note';
  }
}

function changeSelectedQty(delta) {
  selectedQty = Math.max(1, selectedQty + delta);
  document.getElementById('selectedQtyDisplay').textContent = selectedQty;
  if (currentProduct) {
    document.querySelector('.pd-add-btn').textContent =
      `Ajouter au panier — ${formatPrice(currentProduct.priceXPF * selectedQty)}`;
  }
}

function addCurrentToCart() {
  if (!currentProduct) return;
  const cart = getCart();
  const existing = cart.find(item => item.id === currentProduct.id);
  if (existing) {
    existing.qty += selectedQty;
  } else {
    cart.push({
      id: currentProduct.id,
      name: currentProduct.name,
      priceXPF: currentProduct.priceXPF,
      unit: currentProduct.unit,
      emoji: currentProduct.emoji,
      qty: selectedQty,
    });
  }
  saveCart(cart);
  updateCartUI();
  showToast(`${currentProduct.name} ajouté au panier !`);
  toggleCart();
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  const id = getProductIdFromURL();
  currentProduct = PRODUCTS.find(p => p.id === id);
  if (!currentProduct) {
    document.getElementById('productDetail').innerHTML = '<p style="text-align:center;padding:4rem;color:var(--gray)">Produit introuvable.</p>';
    return;
  }
  renderProduct(currentProduct);
});
