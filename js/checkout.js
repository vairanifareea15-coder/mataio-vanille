'use strict';

let currentStep = 1;
let shippingCost = 0;

function renderSummary() {
  const cart = getCart();
  const subtotal = getTotalXPF();
  const total = subtotal + shippingCost;

  document.getElementById('summaryItems').innerHTML = cart.map(item => `
    <div class="summary-item">
      <span class="summary-item-emoji">${item.emoji}</span>
      <div class="summary-item-info">
        <div class="summary-item-name">${item.name}</div>
        <div class="summary-item-qty">Qté : ${item.qty}</div>
      </div>
      <span class="summary-item-price">${formatPrice(item.price * item.qty)}</span>
    </div>
  `).join('');

  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
  document.getElementById('summaryShipping').textContent = shippingCost === 0 ? 'Gratuit' : formatPrice(shippingCost);
  document.getElementById('summaryTotal').textContent = formatPrice(total);
}

function updateShipping(radio) {
  shippingCost = radio.value === 'express' ? 4.90 : 0;
  document.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('selected'));
  radio.closest('.shipping-option').classList.add('selected');
  renderSummary();
}

function setStep(step) {
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-indicator-${i}`);
    indicator.classList.remove('active', 'done');
    if (i < step) indicator.classList.add('done');
    if (i === step) indicator.classList.add('active');
  }

  document.querySelectorAll('.step-line').forEach((line, idx) => {
    line.classList.toggle('done', idx + 1 < step);
  });

  document.getElementById('formStep1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('formStep2').style.display = step === 2 ? 'block' : 'none';
  document.getElementById('formStep3').style.display = step === 3 ? 'block' : 'none';

  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2(e) {
  e.preventDefault();
  setStep(2);
}

function backToStep1() {
  setStep(1);
}

async function goToStep3(e) {
  e.preventDefault();

  const cart = getCart();
  const subtotal = getTotalXPF();
  const ref = 'MV-' + Math.floor(100000 + Math.random() * 900000);

  const commande = {
    prenom:          document.getElementById('firstName').value,
    nom:             document.getElementById('lastName').value,
    email:           document.getElementById('email').value,
    telephone:       document.getElementById('phone').value,
    adresse:         document.getElementById('address').value,
    code_postal:     document.getElementById('postal').value,
    ville:           document.getElementById('city').value,
    pays:            document.getElementById('country').value,
    livraison:       shippingCost === 0 ? 'standard' : 'express',
    produits:        cart.map(i => ({ nom: i.name, qty: i.qty, prix: i.priceXPF })),
    sous_total:      subtotal,
    frais_livraison: shippingCost,
    total:           subtotal + shippingCost,
    statut:          'nouvelle',
  };

  const sb = supabase.createClient(
    'https://wggdfxekesluqprxhomk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2RmeGVrZXNsdXFwcnhob21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTA5NzgsImV4cCI6MjA5ODA4Njk3OH0.MClwLc6FFBwFdBjJzokm6FrZQ5VEjMst9MZJNRlDWvA'
  );

  await sb.from('commandes').insert(commande);

  document.getElementById('confirmEmail').textContent = commande.email;
  document.getElementById('orderRef').textContent = ref;
  saveCart([]);
  setStep(3);
  document.getElementById('orderSummary').style.display = 'none';
}

function formatCard(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = val.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 4);
  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
  input.value = val;
}

document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  if (cart.length === 0 && window.location.pathname.includes('checkout')) {
    window.location.href = 'index.html';
    return;
  }
  renderSummary();
});
