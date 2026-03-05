function initDonations() {
  // Ko-fi
  if (DONATE_CONFIG.kofi) {
    document.getElementById('kofi-btn').href = DONATE_CONFIG.kofi;
  }

  // Crypto addresses + QR
  var coins = ['btc', 'doge', 'eth'];
  coins.forEach(function(coin) {
    var cfg = DONATE_CONFIG[coin];
    if (cfg && cfg.address) {
      document.getElementById(coin + '-address').textContent = cfg.address;
      if (cfg.qr) {
        var qrEl = document.getElementById(coin + '-qr');
        var img = document.createElement('img');
        img.src = cfg.qr;
        img.alt = coin.toUpperCase() + ' QR';
        qrEl.textContent = '';
        qrEl.appendChild(img);
      }
    }
  });
}

// Tab switching
document.querySelectorAll('.crypto-tab').forEach(function(tab) {
  tab.addEventListener('click', function() {
    // Deactivate all tabs + contents
    document.querySelectorAll('.crypto-tab').forEach(function(t) {
      t.classList.remove('active');
    });
    document.querySelectorAll('.crypto-content').forEach(function(c) {
      c.classList.remove('active');
    });

    // Activate clicked tab + matching content
    tab.classList.add('active');
    document.getElementById('crypto-' + tab.dataset.crypto).classList.add('active');
  });
});

// Copy buttons
document.querySelectorAll('.copy-btn[data-coin]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var coin = btn.dataset.coin;
    var address = document.getElementById(coin + '-address').textContent;
    navigator.clipboard.writeText(address).then(function() {
      var textEl = btn.querySelector('.copy-text');
      var original = textEl.textContent;
      textEl.textContent = i18n('copied');
      setTimeout(function() { textEl.textContent = original; }, 2000);
    });
  });
});

initDonations();
