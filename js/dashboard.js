'use strict';

const sb = supabase.createClient(
  'https://wggdfxekesluqprxhomk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2RmeGVrZXNsdXFwcnhob21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTA5NzgsImV4cCI6MjA5ODA4Njk3OH0.MClwLc6FFBwFdBjJzokm6FrZQ5VEjMst9MZJNRlDWvA'
);

async function login(e) {
  e.preventDefault();
  const email    = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const errEl    = document.getElementById('loginError');
  errEl.textContent = '';

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.textContent = 'Email ou mot de passe incorrect.';
  } else {
    showDashboard();
  }
}

async function logout() {
  await sb.auth.signOut();
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadAll();
}

function switchTab(tab) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tabCommandes').style.display = tab === 'commandes' ? 'block' : 'none';
  document.getElementById('tabMessages').style.display  = tab === 'messages'  ? 'block' : 'none';
  document.getElementById('tabStocks').style.display    = tab === 'stocks'    ? 'block' : 'none';
  document.getElementById('tabGalerie').style.display   = tab === 'galerie'   ? 'block' : 'none';
  document.getElementById('tabAvis').style.display      = tab === 'avis'      ? 'block' : 'none';
}

async function validerAvis(id) {
  await sb.from('avis').update({ valide: true }).eq('id', id);
  loadAvisDash();
}

async function supprimerAvis(id) {
  if (!confirm('Supprimer cet avis ?')) return;
  await sb.from('avis').delete().eq('id', id);
  loadAvisDash();
}

async function loadAvisDash() {
  const { data: produits } = await sb.from('produits').select('id,name');
  const { data: avis } = await sb.from('avis').select('*').order('created_at', { ascending: false });

  const nomsMap = {};
  (produits || []).forEach(p => nomsMap[p.id] = p.name);

  const enAttente = (avis || []).filter(a => !a.valide).length;
  const badge = document.getElementById('avisBadge');
  const statEl = document.getElementById('statAvisEnAttente');
  const statWrap = document.getElementById('statAvisWrap');

  if (badge) {
    badge.textContent = enAttente;
    badge.style.display = enAttente > 0 ? 'inline-flex' : 'none';
  }
  if (statEl) statEl.textContent = enAttente;
  if (statWrap) statWrap.style.borderColor = enAttente > 0 ? 'var(--rose)' : '';

  const body = document.getElementById('avisBody');
  if (!avis || avis.length === 0) {
    body.innerHTML = '<tr><td colspan="6" class="dash-loading">Aucun avis</td></tr>';
    return;
  }
  body.innerHTML = avis.map(a => `
    <tr style="${!a.valide ? 'background:rgba(196,116,138,0.07);' : ''}">
      <td>${formatDate(a.created_at)}</td>
      <td>${nomsMap[a.produit_id] || '—'}</td>
      <td>${a.auteur}</td>
      <td>${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</td>
      <td>${a.commentaire}</td>
      <td>
        ${!a.valide ? `<button class="btn-valider" onclick="validerAvis(${a.id})">✓ Valider</button>` : '<span style="color:var(--sauge);font-size:0.8rem">✓ Publié</span>'}
        <button class="btn-supprimer" onclick="supprimerAvis(${a.id})" style="margin-left:0.5rem">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

async function ajouterPhoto() {
  const url     = document.getElementById('newUrl').value.trim();
  const legende = document.getElementById('newLegende').value.trim();
  const section = document.getElementById('newSection').value;
  if (!url) return;
  await sb.from('galerie').insert({ url, legende, section, ordre: 99 });
  document.getElementById('addPhotoForm').style.display = 'none';
  document.getElementById('newUrl').value = '';
  document.getElementById('newLegende').value = '';
  loadGalerie();
}

async function supprimerPhoto(id) {
  if (!confirm('Supprimer cette photo ?')) return;
  await sb.from('galerie').delete().eq('id', id);
  loadGalerie();
}

async function loadGalerie() {
  const { data } = await sb.from('galerie').select('*').order('section').order('ordre');
  const grid = document.getElementById('galerieGrid');
  if (!data || data.length === 0) { grid.innerHTML = '<p style="color:var(--gris);padding:2rem">Aucune photo.</p>'; return; }
  grid.innerHTML = data.map(p => `
    <div class="galerie-card">
      <img src="${p.url}" alt="${p.legende || ''}" />
      <div class="galerie-info">
        <span class="galerie-section">${p.section}</span>
        <span class="galerie-legende">${p.legende || '—'}</span>
        <button class="btn-supprimer" onclick="supprimerPhoto(${p.id})">Supprimer</button>
      </div>
    </div>
  `).join('');
}

async function updateStock(id, input) {
  const val = parseInt(input.value);
  if (isNaN(val) || val < 0) return;
  await sb.from('produits').update({ stock: val }).eq('id', id);
  input.style.borderColor = 'var(--sauge)';
  setTimeout(() => input.style.borderColor = '', 1500);
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function statutBadge(statut) {
  const colors = { nouvelle: '#C4748A', traitée: '#7A9B7E', expédiée: '#C4974A' };
  const c = colors[statut] || '#9A8A90';
  return `<select class="statut-select" style="border-color:${c};color:${c}" onchange="updateStatut(${event}, this)">
    <option value="nouvelle"  ${statut==='nouvelle'  ? 'selected' : ''}>Nouvelle</option>
    <option value="traitée"   ${statut==='traitée'   ? 'selected' : ''}>Traitée</option>
    <option value="expédiée"  ${statut==='expédiée'  ? 'selected' : ''}>Expédiée</option>
  </select>`;
}

async function updateStatut(e, select) {
  const row = select.closest('tr');
  const id = row.dataset.id;
  const newStatut = select.value;

  await sb.from('commandes').update({ statut: newStatut }).eq('id', id);

  const c = { nouvelle: '#C4748A', traitée: '#7A9B7E', expédiée: '#C4974A' }[newStatut] || '#9A8A90';
  select.style.borderColor = c;
  select.style.color = c;

  if (newStatut === 'expédiée') {
    const { data } = await sb.from('commandes').select('prenom,email,total').eq('id', id).single();
    if (data?.email) {
      await sb.functions.invoke('envoyer-email', {
        body: { prenom: data.prenom, email: data.email, total: data.total },
      });
    }
  }
}

async function loadAll() {
  const [{ data: commandes }, { data: messages }, { data: produits }] = await Promise.all([
    sb.from('commandes').select('*').order('created_at', { ascending: false }),
    sb.from('messages').select('*').order('created_at', { ascending: false }),
    sb.from('produits').select('*').order('id'),
  ]);

  // Stats
  const now = new Date();
  const moisCourant = now.getMonth();
  const anneeCourante = now.getFullYear();

  document.getElementById('statCommandes').textContent = commandes?.length ?? 0;
  document.getElementById('statMessages').textContent  = messages?.length ?? 0;

  const ca = (commandes || []).reduce((s, c) => s + (c.total || 0), 0);
  document.getElementById('statChiffre').textContent = ca.toLocaleString('fr-FR');

  const caMois = (commandes || [])
    .filter(c => { const d = new Date(c.created_at); return d.getMonth() === moisCourant && d.getFullYear() === anneeCourante; })
    .reduce((s, c) => s + (c.total || 0), 0);
  document.getElementById('statMoisCA').textContent = caMois.toLocaleString('fr-FR');

  const compteProduits = {};
  (commandes || []).forEach(c => (c.produits || []).forEach(p => {
    compteProduits[p.nom] = (compteProduits[p.nom] || 0) + (p.qty || 1);
  }));
  const topProduit = Object.entries(compteProduits).sort((a,b) => b[1]-a[1])[0];
  document.getElementById('statProduit').textContent = topProduit ? topProduit[0].replace('Vanille ', '') : '—';

  // Commandes
  document.getElementById('commandesBody').innerHTML = (commandes || []).length === 0
    ? '<tr><td colspan="7" class="dash-loading">Aucune commande</td></tr>'
    : (commandes || []).map(c => `
      <tr data-id="${c.id}">
        <td>${formatDate(c.created_at)}</td>
        <td>${c.prenom} ${c.nom}</td>
        <td>${c.email}</td>
        <td>${(c.produits || []).map(p => `${p.qty}× ${p.nom}`).join('<br>')}</td>
        <td>${(c.total || 0).toLocaleString('fr-FR')} XPF</td>
        <td>${c.livraison}</td>
        <td>${statutBadge(c.statut)}</td>
      </tr>`).join('');

  // Messages
  document.getElementById('messagesBody').innerHTML = (messages || []).length === 0
    ? '<tr><td colspan="5" class="dash-loading">Aucun message</td></tr>'
    : (messages || []).map(m => `
      <tr>
        <td>${formatDate(m.created_at)}</td>
        <td>${m.nom || '—'}</td>
        <td>${m.email || '—'}</td>
        <td>${m.sujet || '—'}</td>
        <td>${m.message || '—'}</td>
      </tr>`).join('');

  // Galerie
  loadGalerie();

  // Avis
  loadAvisDash();

  // Stocks
  document.getElementById('stocksBody').innerHTML = (produits || []).map(p => {
    const stockColor = p.stock === 0 ? 'var(--rose)' : p.stock < 10 ? '#C4974A' : 'var(--sauge)';
    return `<tr>
      <td><strong>${p.name}</strong></td>
      <td>${(p.price_xpf || 0).toLocaleString('fr-FR')} XPF</td>
      <td style="color:${stockColor};font-weight:600">${p.stock === 0 ? 'Épuisé' : p.stock + ' paquets'}</td>
      <td>
        <input type="number" class="stock-input" value="${p.stock}" min="0"
          onchange="updateStock(${p.id}, this)" />
      </td>
    </tr>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showDashboard();
});
