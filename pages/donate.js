function initDonations() {
  let hasAnyOption = false;

  if (DONATE_CONFIG.kofi) {
    const el = document.getElementById('opt-kofi');
    el.href = DONATE_CONFIG.kofi;
    el.classList.remove('hidden');
    hasAnyOption = true;
  }

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

  if (DONATE_CONFIG.eth?.address) {
    document.getElementById('opt-eth').classList.remove('hidden');
    document.getElementById('eth-address').textContent = DONATE_CONFIG.eth.address;
    if (DONATE_CONFIG.eth.qr) {
      const img = document.createElement('img');
      img.src = DONATE_CONFIG.eth.qr;
      img.alt = 'Ethereum QR';
      const qr = document.getElementById('eth-qr');
      qr.textContent = '';
      qr.appendChild(img);
    }
    hasAnyOption = true;
  }

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
