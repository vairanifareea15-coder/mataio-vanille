'use strict';

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
      <span class="summary-item-price">${formatPrice(item.priceXPF * item.qty)}</span>
    </div>
  `).join('');

  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal);
  document.getElementById('summaryShipping').textContent = shippingCost === 0 ? 'Gratuit' : formatPrice(shippingCost);
  document.getElementById('summaryTotal').textContent = formatPrice(total);
}

function updateShipping(radio) {
  shippingCost = radio.value === 'express' ? Math.round(4.90 * 119.33174) : 0;
  document.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('selected'));
  radio.closest('.shipping-option').classList.add('selected');
  renderSummary();
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('field-error');
    if (!field.value.trim()) {
      field.classList.add('field-error');
      valid = false;
    }
  });
  return valid;
}

async function goToStripe(e) {
  e.preventDefault();

  if (!validateForm(e.target)) {
    showToast('Veuillez remplir tous les champs obligatoires.');
    e.target.querySelector('.field-error')?.focus();
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Redirection vers le paiement…';
  btn.disabled = true;

  const sb = supabase.createClient(
    'https://wggdfxekesluqprxhomk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnZ2RmeGVrZXNsdXFwcnhob21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTA5NzgsImV4cCI6MjA5ODA4Njk3OH0.MClwLc6FFBwFdBjJzokm6FrZQ5VEjMst9MZJNRlDWvA'
  );

  const { data, error } = await sb.functions.invoke('create-checkout', {
    body: {
      cart:        getCart(),
      livraison:   shippingCost === 0 ? 'standard' : 'express',
      prenom:      document.getElementById('firstName').value,
      nom:         document.getElementById('lastName').value,
      email:       document.getElementById('email').value,
      telephone:   document.getElementById('phone').value,
      adresse:     document.getElementById('address').value,
      code_postal: document.getElementById('postal').value,
      ville:       document.getElementById('city').value,
      pays:        document.getElementById('country').value,
      origin:      window.location.origin,
    },
  });

  if (error || !data?.url) {
    showToast('Erreur lors de la redirection. Réessayez.');
    btn.textContent = 'Payer en sécurité';
    btn.disabled = false;
    return;
  }

  saveCart([]);
  window.location.href = data.url;
}

document.addEventListener('DOMContentLoaded', () => {
  const cart = getCart();
  if (cart.length === 0 && window.location.pathname.includes('checkout')) {
    window.location.href = 'index.html';
    return;
  }
  renderSummary();
});
