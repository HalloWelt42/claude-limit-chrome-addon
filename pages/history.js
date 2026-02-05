/**
 * history.js - Historie-Seite Logik
 */

const STORAGE_KEY = 'claude-dashboard';

// DOM Elements
const elements = {
  btnBack: document.getElementById('btn-back'),
  btnApply: document.getElementById('btn-apply'),
  btnExport: document.getElementById('btn-export'),
  btnSaveCorrection: document.getElementById('btn-save-correction'),
  dateFrom: document.getElementById('date-from'),
  dateTo: document.getElementById('date-to'),
  correction: document.getElementById('correction'),
  statTotal: document.getElementById('stat-total'),
  statInput: document.getElementById('stat-input'),
  statOutput: document.getElementById('stat-output'),
  statDays: document.getElementById('stat-days'),
  correctedTotal: document.getElementById('corrected-total'),
  chart: document.getElementById('chart')
};

let historyData = {};
let currentStats = { total: 0, input: 0, output: 0 };

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  setDefaultDates();
  calculateStats();
});

/**
 * Event Listeners
 */
function setupEventListeners() {
  elements.btnBack.addEventListener('click', () => {
    window.close();
  });
  
  elements.btnApply.addEventListener('click', calculateStats);
  
  elements.correction.addEventListener('input', updateCorrectedTotal);
  
  elements.btnSaveCorrection.addEventListener('click', saveCorrection);
  
  elements.btnExport.addEventListener('click', exportData);
  
  // Preset Buttons
  document.querySelectorAll('.btn-preset[data-range]').forEach(btn => {
    btn.addEventListener('click', () => {
      const range = btn.dataset.range;
      setDateRange(range);
      calculateStats();
    });
  });
}

/**
 * Lädt Daten
 */
async function loadData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    historyData = data?.history?.daily || {};
    elements.correction.value = data?.history?.correction || 0;
  } catch (error) {
    console.error('Fehler beim Laden:', error);
  }
}

/**
 * Setzt Standard-Datumswerte (letzte 30 Tage)
 */
function setDefaultDates() {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  elements.dateTo.value = today.toISOString().split('T')[0];
  elements.dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0];
}

/**
 * Setzt Datumsbereich basierend auf Preset
 */
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

/**
 * Berechnet Statistiken für den Zeitraum
 */
function calculateStats() {
  const from = elements.dateFrom.value;
  const to = elements.dateTo.value;
  
  if (!from || !to) return;
  
  let total = 0;
  let input = 0;
  let output = 0;
  let days = 0;
  const dailyTotals = [];
  
  // Alle Tage im Bereich durchgehen
  const current = new Date(from);
  const end = new Date(to);
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayData = historyData[dateStr];
    
    if (dayData) {
      total += dayData.total || 0;
      input += dayData.input || 0;
      output += dayData.output || 0;
      days++;
    }
    
    dailyTotals.push({
      date: dateStr,
      total: dayData?.total || 0
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  currentStats = { total, input, output };
  
  // Anzeige aktualisieren
  elements.statTotal.textContent = formatTokens(total);
  elements.statInput.textContent = formatTokens(input);
  elements.statOutput.textContent = formatTokens(output);
  elements.statDays.textContent = days;
  
  updateCorrectedTotal();
  renderChart(dailyTotals);
}

/**
 * Aktualisiert korrigierten Gesamtwert
 */
function updateCorrectedTotal() {
  const correction = parseInt(elements.correction.value) || 0;
  const corrected = currentStats.total + correction;
  elements.correctedTotal.textContent = formatTokens(corrected);
}

/**
 * Speichert Korrekturwert
 */
async function saveCorrection() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    data.history.correction = parseInt(elements.correction.value) || 0;
    
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    
    elements.btnSaveCorrection.textContent = '✓ Gespeichert';
    setTimeout(() => {
      elements.btnSaveCorrection.textContent = 'Korrektur speichern';
    }, 2000);
    
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    alert('Fehler beim Speichern');
  }
}

/**
 * Rendert Mini-Chart
 */
function renderChart(dailyTotals) {
  if (dailyTotals.length === 0 || dailyTotals.every(d => d.total === 0)) {
    elements.chart.innerHTML = '<div class="empty-state">Keine Daten im Zeitraum</div>';
    return;
  }
  
  const maxValue = Math.max(...dailyTotals.map(d => d.total));
  
  // Bei vielen Tagen: nur jeden n-ten zeigen
  let step = 1;
  if (dailyTotals.length > 60) step = 3;
  else if (dailyTotals.length > 30) step = 2;
  
  const bars = dailyTotals
    .filter((_, i) => i % step === 0)
    .map(d => {
      const height = maxValue > 0 ? (d.total / maxValue) * 100 : 0;
      return `<div class="chart-bar" style="height: ${Math.max(2, height)}%" title="${d.date}: ${formatTokens(d.total)}"></div>`;
    })
    .join('');
  
  elements.chart.innerHTML = bars;
}

/**
 * Exportiert Daten als JSON
 */
async function exportData() {
  try {
    const from = elements.dateFrom.value;
    const to = elements.dateTo.value;
    const correction = parseInt(elements.correction.value) || 0;
    
    const exportObj = {
      period: { from, to },
      stats: {
        ...currentStats,
        corrected: currentStats.total + correction
      },
      correction,
      daily: {}
    };
    
    // Nur Daten im Zeitraum
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
    a.download = `claude-usage-${from}-to-${to}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Export fehlgeschlagen:', error);
    alert('Export fehlgeschlagen');
  }
}

/**
 * Formatiert Token-Zahlen
 */
function formatTokens(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
