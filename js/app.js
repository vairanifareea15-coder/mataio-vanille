'use strict';

const sb = supabase.createClient(
  'https://wggdfxekesluqprxhomk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2RmeGVrZXNsdXFwcnhob21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTA5NzgsImV4cCI6MjA5ODA4Njk3OH0.MClwLc6FFBwFdBjJzokm6FrZQ5VEjMst9MZJNRlDWvA'
);

function renderProductCard(p) {
  const epuise = p.stock === 0;
  return `
    <div class="product-card ${epuise ? 'product-epuise' : ''}">
      <a href="product.html?id=${p.id}" class="product-img-link">
        <div class="product-img" style="background:${p.bg}">
          ${epuise ? '<span class="product-badge badge-epuise">Épuisé</span>' : p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        </div>
      </a>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <span class="stars-sm">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
          <span class="rating-count">(${p.review_count})</span>
        </div>
        <p class="product-desc">${p.short_desc}</p>
        <div class="product-footer">
          <div>
            <div class="product-price">
              ${formatPrice(p.price_xpf)}
              <span>/ ${p.unite}</span>
            </div>
            ${p.price_per_kg_xpf ? `<div class="price-per-kg">${formatPrice(p.price_per_kg_xpf)} / kg</div>` : ''}
          </div>
          <div class="product-actions">
            <a href="product.html?id=${p.id}" class="btn-outline">Voir</a>
            ${epuise
              ? '<button class="add-btn btn-epuise" disabled>Épuisé</button>'
              : `<button class="add-btn" onclick="addToCartFromDB(${p.id})">+ Ajouter</button>`}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '<p style="text-align:center;color:var(--gris);padding:3rem">Chargement…</p>';

  const { data, error } = await sb.from('produits').select('*').order('id');
  if (error || !data) { grid.innerHTML = ''; return; }

  grid.innerHTML = data.map(renderProductCard).join('');
}

async function addToCartFromDB(id) {
  const { data } = await sb.from('produits').select('stock,name').eq('id', id).single();
  if (data && data.stock === 0) {
    showToast(`${data.name} est épuisé.`);
    return;
  }
  addToCart(id);
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('contactBtn');
  btn.textContent = 'Envoi en cours…';
  btn.disabled = true;

  const { error } = await sb.from('messages').insert({
    nom:     document.getElementById('contactNom').value,
    email:   document.getElementById('contactEmail').value,
    sujet:   document.getElementById('contactSujet').value,
    message: document.getElementById('contactMessage').value,
  });

  btn.textContent = 'Envoyer le message';
  btn.disabled = false;

  if (error) {
    showToast('Erreur lors de l\'envoi. Réessayez.');
    console.error(error);
  } else {
    showToast('Message envoyé ! On vous répond bientôt.');
    e.target.reset();
  }
}

async function loadGalerie() {
  const { data } = await sb.from('galerie').select('*').order('section').order('ordre');
  if (!data) return;

  const histoire   = data.filter(p => p.section === 'histoire');
  const provenance = data.filter(p => p.section === 'provenance');

  const galerieHistoire = document.getElementById('galerieHistoire');
  if (galerieHistoire && histoire.length > 0) {
    galerieHistoire.innerHTML = `
      <div class="histoire-photo-main">
        <img src="${histoire[0].url}" alt="${histoire[0].legende || ''}" />
        <div class="histoire-photo-caption">${histoire[0].legende || ''}</div>
      </div>
      ${histoire[1] ? `
      <div class="histoire-photo-side">
        <img src="${histoire[1].url}" alt="${histoire[1].legende || ''}" />
        <div class="histoire-photo-caption">${histoire[1].legende || ''}</div>
      </div>` : ''}
    `;
  }

  const mapPhoto = document.querySelector('.map-photo img');
  if (mapPhoto && provenance.length > 0) {
    mapPhoto.src = provenance[0].url;
    mapPhoto.alt = provenance[0].legende || '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  loadGalerie();
});
