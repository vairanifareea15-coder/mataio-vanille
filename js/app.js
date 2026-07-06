'use strict';

const sb = supabase.createClient(
  'https://wggdfxekesluqprxhomk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2RmeGVrZXNsdXFwcnhob21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTA5NzgsImV4cCI6MjA5ODA4Njk3OH0.MClwLc6FFBwFdBjJzokm6FrZQ5VEjMst9MZJNRlDWvA'
);

function renderProductCard(p) {
  const epuise = p.stock === 0;
  const imgSrc = p.image || 'https://images.unsplash.com/photo-1592788174877-3f99727fd23d?auto=format&fit=crop&w=800&q=80';
  const bgColor = p.bg || '#E7DBC6';
  return `
    <article class="vn-product-card">
      <a href="product.html?id=${p.id}" class="vn-product-img vn-stripe" style="background:${esc(bgColor)};">
        <img src="${esc(imgSrc)}" alt="${esc(p.name)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'" />
        ${epuise ? '<span class="vn-product-badge epuise">Épuisé</span>' : p.badge ? `<span class="vn-product-badge">${esc(p.badge)}</span>` : ''}
      </a>
      <div class="vn-product-body">
        <div class="vn-product-meta">
          <a href="product.html?id=${p.id}" class="vn-product-name">${esc(p.name)}</a>
          <span class="vn-product-price">${formatPrice(p.price_xpf)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="color:#9A6B3F;font-size:12px;letter-spacing:1px;">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
          <span style="font-size:12px;color:#8A7457;">(${p.review_count})</span>
        </div>
        <p class="vn-product-desc">${esc(p.short_desc)}</p>
        <div style="display:flex;gap:8px;margin-top:auto;">
          <a href="product.html?id=${p.id}" class="vn-view-btn">Voir</a>
          ${epuise
            ? '<button class="vn-add-btn" disabled style="flex:1">Épuisé</button>'
            : `<button class="vn-add-btn" onclick="addToCartFromDB(${p.id})" style="flex:1">+ Panier</button>`}
        </div>
      </div>
    </article>
  `;
}

async function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  // Skeleton de chargement
  grid.innerHTML = Array(3).fill(`
    <div class="vn-skeleton-card">
      <div class="vn-skeleton vn-skeleton-img"></div>
      <div class="vn-skeleton vn-skeleton-line"></div>
      <div class="vn-skeleton vn-skeleton-line short"></div>
      <div class="vn-skeleton vn-skeleton-line short"></div>
    </div>
  `).join('');

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
  // Honeypot : si rempli c'est un bot
  if (document.getElementById('honeypot')?.value) return;
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

  const provenance = data.filter(p => p.section === 'provenance');
  const histoire   = data.filter(p => p.section === 'histoire');

  // Mise à jour de l'image de la section Origine
  const origineImg = document.getElementById('origineImg');
  if (origineImg && provenance.length > 0) {
    origineImg.src = provenance[0].url;
    origineImg.alt = provenance[0].legende || '';
  }

  // Mise à jour de la galerie histoire (section cachée mais présente)
  const galerieHistoire = document.getElementById('galerieHistoire');
  if (galerieHistoire && histoire.length > 0) {
    galerieHistoire.innerHTML = histoire.slice(0, 2).map(p => `
      <div class="galerie-item">
        <img src="${p.url}" alt="${p.legende || ''}" />
        ${p.legende ? `<div class="galerie-caption">${p.legende}</div>` : ''}
      </div>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  loadGalerie();
  initScrollReveal();
});

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.vn-reveal').forEach(el => observer.observe(el));
}
