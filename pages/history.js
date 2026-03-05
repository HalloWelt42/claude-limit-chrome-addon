const elements = {
  btnBack: document.getElementById('btn-back'),
  btnApply: document.getElementById('btn-apply'),
  btnExport: document.getElementById('btn-export'),
  dateFrom: document.getElementById('date-from'),
  dateTo: document.getElementById('date-to'),
  statSyncs: document.getElementById('stat-syncs'),
  statDays: document.getElementById('stat-days'),
  statMax5h: document.getElementById('stat-max-5h'),
  statMax7d: document.getElementById('stat-max-7d'),
  chart: document.getElementById('chart')
};

let historyData = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  setDefaultDates();
  calculateStats();
});

function setupEventListeners() {
  elements.btnBack.addEventListener('click', () => window.close());
  elements.btnApply.addEventListener('click', calculateStats);
  elements.btnExport.addEventListener('click', exportData);

  document.querySelectorAll('.btn-preset[data-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Aktiven Preset markieren
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      setDateRange(btn.dataset.range);
      calculateStats();
    });
  });
}

async function loadData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    historyData = data?.history?.daily || {};
  } catch (error) {
    console.error('Fehler beim Laden:', error);
  }
}

function setDefaultDates() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  elements.dateTo.value = today.toISOString().split('T')[0];
  elements.dateFrom.value = sevenDaysAgo.toISOString().split('T')[0];
}

function setDateRange(range) {
  const today = new Date();
  const to = today.toISOString().split('T')[0];

  if (range === 'all') {
    const dates = Object.keys(historyData).sort();
    elements.dateFrom.value = dates[0] || to;
    elements.dateTo.value = to;
    return;
  }

  const days = parseInt(range);
  const from = new Date(today);
  from.setDate(today.getDate() - days);

  elements.dateFrom.value = from.toISOString().split('T')[0];
  elements.dateTo.value = to;
}

function calculateStats() {
  const from = elements.dateFrom.value;
  const to = elements.dateTo.value;
  if (!from || !to) return;

  let totalSyncs = 0;
  let activeDays = 0;
  let max5h = 0;
  let max7d = 0;
  const dailyMax5h = [];

  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const entries = historyData[dateStr];

    let dayMax5h = 0;

    if (entries && Array.isArray(entries) && entries.length > 0) {
      activeDays++;
      totalSyncs += entries.length;

      for (const entry of entries) {
        const fh = entry.fiveHour ?? 0;
        const sd = entry.sevenDay ?? 0;
        if (fh > max5h) max5h = fh;
        if (sd > max7d) max7d = sd;
        if (fh > dayMax5h) dayMax5h = fh;
      }
    }

    dailyMax5h.push({ date: dateStr, value: dayMax5h });
    current.setDate(current.getDate() + 1);
  }

  elements.statSyncs.textContent = totalSyncs;
  elements.statDays.textContent = activeDays;
  elements.statMax5h.textContent = max5h + '%';
  elements.statMax7d.textContent = max7d + '%';

  renderChart(dailyMax5h);
}

function renderChart(dailyData) {
  // Clear
  elements.chart.textContent = '';

  if (dailyData.length === 0 || dailyData.every(d => d.value === 0)) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Keine Daten im Zeitraum';
    elements.chart.appendChild(empty);
    return;
  }

  // Aggregation bei vielen Tagen
  let step = 1;
  if (dailyData.length > 60) step = 3;
  else if (dailyData.length > 30) step = 2;

  const filtered = dailyData.filter((_, i) => i % step === 0);
  const maxValue = Math.max(...filtered.map(d => d.value), 1);

  for (const d of filtered) {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const height = Math.max(2, (d.value / maxValue) * 100);
    bar.style.height = height + '%';
    bar.title = d.date + ': ' + d.value + '%';

    // Farbe basierend auf Wert
    if (d.value >= 75) {
      bar.style.background = 'var(--red)';
    } else if (d.value >= 40) {
      bar.style.background = 'var(--yellow)';
    }

    elements.chart.appendChild(bar);
  }
}

async function exportData() {
  try {
    const from = elements.dateFrom.value;
    const to = elements.dateTo.value;

    const exportObj = {
      period: { from, to },
      daily: {}
    };

    const current = new Date(from);
    const end = new Date(to);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (historyData[dateStr]) {
        exportObj.daily[dateStr] = historyData[dateStr];
      }
      current.setDate(current.getDate() + 1);
    }

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'claude-usage-' + from + '-to-' + to + '.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export fehlgeschlagen:', error);
    alert('Export fehlgeschlagen');
  }
}
