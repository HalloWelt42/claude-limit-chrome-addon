/**
 * settings.js - Einstellungen-Seite Logik (vereinfacht)
 */

const STORAGE_KEY = 'claude-dashboard';

// DOM Elements
const elements = {
  btnBack: document.getElementById('btn-back'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import'),
  btnClear: document.getElementById('btn-clear'),
  importFile: document.getElementById('import-file'),
  storageSize: document.getElementById('storage-size'),
  topicCount: document.getElementById('topic-count'),
  historyCount: document.getElementById('history-count'),
  debugInfo: document.getElementById('debug-info')
};

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
});

/**
 * Event Listeners
 */
function setupEventListeners() {
  elements.btnBack.addEventListener('click', () => {
    window.close();
  });
  
  // Theme
  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        payload: { theme: e.target.value }
      });
    });
  });
  
  // Export
  elements.btnExport.addEventListener('click', exportData);
  
  // Import
  elements.btnImport.addEventListener('click', () => {
    elements.importFile.click();
  });
  elements.importFile.addEventListener('change', importData);
  
  // Clear
  elements.btnClear.addEventListener('click', clearData);
}

/**
 * Lädt Daten
 */
async function loadData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    
    // Theme setzen
    const theme = data?.settings?.theme || 'system';
    const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
    if (radio) radio.checked = true;
    
    // Statistiken
    const topicDays = Object.keys(data?.topics || {}).length;
    const topicTotal = Object.values(data?.topics || {}).reduce((sum, arr) => sum + arr.length, 0);
    elements.topicCount.textContent = `${topicTotal} (${topicDays} Tage)`;
    
    const historyDays = Object.keys(data?.history?.daily || {}).length;
    elements.historyCount.textContent = `${historyDays} Tage`;
    
    // Storage Size
    const size = new Blob([JSON.stringify(data)]).size;
    elements.storageSize.textContent = `${(size / 1024).toFixed(1)} KB`;
    
    // Debug-Info
    const debugLines = [
      `Letzter Sync: ${data?.usage?.lastSync || 'nie'}`,
      `Plan: ${data?.usage?.plan || '–'}`,
      `Verbrauch: ${data?.usage?.percent || 0}%`,
      `Reset: ${data?.usage?.resetDate || '–'}`,
      '',
      'Raw Data:',
      JSON.stringify(data?.usage?.raw || {}, null, 2)
    ];
    
    if (data?.lastScrapeError) {
      debugLines.push('', 'Letzter Scrape-Fehler:', JSON.stringify(data.lastScrapeError, null, 2));
    }
    
    elements.debugInfo.textContent = debugLines.join('\n');
    
  } catch (error) {
    console.error('Fehler beim Laden:', error);
    elements.debugInfo.textContent = 'Fehler: ' + error.message;
  }
}

/**
 * Exportiert Daten
 */
async function exportData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('Export fehlgeschlagen: ' + error.message);
  }
}

/**
 * Importiert Daten
 */
async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    
    alert('Import erfolgreich! Seite wird neu geladen.');
    location.reload();
    
  } catch (error) {
    alert('Import fehlgeschlagen: ' + error.message);
  }
  
  event.target.value = '';
}

/**
 * Löscht alle Daten
 */
async function clearData() {
  if (!confirm('Wirklich alle Daten löschen?')) {
    return;
  }
  
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    alert('Daten gelöscht!');
    location.reload();
  } catch (error) {
    alert('Fehler: ' + error.message);
  }
}
