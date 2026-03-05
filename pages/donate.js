function initDonations() {
  let hasAnyOption = false;

  // Ko-fi
  if (DONATE_CONFIG.kofi) {
    const el = document.getElementById('opt-kofi');
    el.href = DONATE_CONFIG.kofi;
    el.classList.remove('hidden');
    hasAnyOption = true;
  }

  // PayPal
  if (DONATE_CONFIG.paypal) {
    const el = document.getElementById('opt-paypal');
    el.href = DONATE_CONFIG.paypal;
    el.classList.remove('hidden');
    hasAnyOption = true;
  }

  // Bitcoin
  if (DONATE_CONFIG.btc?.address) {
    document.getElementById('opt-btc').classList.remove('hidden');
    document.getElementById('btc-address').textContent = DONATE_CONFIG.btc.address;
    if (DONATE_CONFIG.btc.qr) {
      const img = document.createElement('img');
      img.src = DONATE_CONFIG.btc.qr;
      img.alt = 'Bitcoin QR';
      const qr = document.getElementById('btc-qr');
      qr.textContent = '';
      qr.appendChild(img);
    }
    hasAnyOption = true;
  }

  // Litecoin
  if (DONATE_CONFIG.ltc?.address) {
    document.getElementById('opt-ltc').classList.remove('hidden');
    document.getElementById('ltc-address').textContent = DONATE_CONFIG.ltc.address;
    if (DONATE_CONFIG.ltc.qr) {
      const img = document.createElement('img');
      img.src = DONATE_CONFIG.ltc.qr;
      img.alt = 'Litecoin QR';
      const qr = document.getElementById('ltc-qr');
      qr.textContent = '';
      qr.appendChild(img);
    }
    hasAnyOption = true;
  }

  // Dogecoin
  if (DONATE_CONFIG.doge?.address) {
    document.getElementById('opt-doge').classList.remove('hidden');
    document.getElementById('doge-address').textContent = DONATE_CONFIG.doge.address;
    if (DONATE_CONFIG.doge.qr) {
      const img = document.createElement('img');
      img.src = DONATE_CONFIG.doge.qr;
      img.alt = 'Dogecoin QR';
      const qr = document.getElementById('doge-qr');
      qr.textContent = '';
      qr.appendChild(img);
    }
    hasAnyOption = true;
  }

  // Monero
  if (DONATE_CONFIG.xmr?.address) {
    document.getElementById('opt-xmr').classList.remove('hidden');
    document.getElementById('xmr-address').textContent = DONATE_CONFIG.xmr.address;
    if (DONATE_CONFIG.xmr.qr) {
      const img = document.createElement('img');
      img.src = DONATE_CONFIG.xmr.qr;
      img.alt = 'Monero QR';
      const qr = document.getElementById('xmr-qr');
      qr.textContent = '';
      qr.appendChild(img);
    }
    hasAnyOption = true;
  }

  // Fallback wenn nichts konfiguriert
  if (!hasAnyOption) {
    document.getElementById('donate-options').classList.add('hidden');
    document.getElementById('no-options').classList.remove('hidden');
  }
}

function showCrypto(type) {
  document.getElementById('main-view').style.display = 'none';
  document.querySelector('.donate-footer').style.display = 'none';
  document.getElementById(type + '-view').classList.add('active');
}

function showMain() {
  document.getElementById('main-view').style.display = 'block';
  document.querySelector('.donate-footer').style.display = 'block';
  document.querySelectorAll('.crypto-detail').forEach(function(el) {
    el.classList.remove('active');
  });
}

function copyAddress(type) {
  const address = document.getElementById(type + '-address').textContent;
  navigator.clipboard.writeText(address).then(function() {
    const btn = document.querySelector('.copy-btn[data-coin="' + type + '"]');
    const original = btn.textContent;
    btn.textContent = '\u2713 Kopiert!';
    setTimeout(function() { btn.textContent = original; }, 2000);
  });
}

document.querySelectorAll('[data-crypto]').forEach(function(el) {
  el.addEventListener('click', function() {
    showCrypto(el.dataset.crypto);
  });
});

document.querySelectorAll('[data-back]').forEach(function(el) {
  el.addEventListener('click', showMain);
});

document.querySelectorAll('.copy-btn[data-coin]').forEach(function(el) {
  el.addEventListener('click', function() {
    copyAddress(el.dataset.coin);
  });
});

initDonations();
