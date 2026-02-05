/**
 * storage.js - LocalStorage Wrapper für Claude Dashboard
 * Zentrale Datenverwaltung mit Default-Werten und Hilfsfunktionen
 */

const STORAGE_KEY = 'claude-dashboard';

// Default-Struktur
const DEFAULT_DATA = {
  settings: {
    apiKey: '',
    syncInterval: 5,
    tokenBudget: 5000000,
    alertThreshold: 80,
    theme: 'system'
  },
  usage: {
    lastSync: null,
    today: { total: 0, byModel: {} },
    week: { total: 0, byModel: {} },
    month: { total: 0, byModel: {} }
  },
  history: {
    correction: 0,
    daily: {}
  },
  topics: {}
};

/**
 * Lädt alle Daten aus LocalStorage
 */
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    
    const data = JSON.parse(raw);
    // Merge mit Defaults für fehlende Felder
    return deepMerge(DEFAULT_DATA, data);
  } catch (e) {
    console.error('Claude Dashboard: Fehler beim Laden der Daten', e);
    return { ...DEFAULT_DATA };
  }
}

/**
 * Speichert alle Daten in LocalStorage
 */
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Claude Dashboard: Fehler beim Speichern', e);
    return false;
  }
}

/**
 * Lädt nur Settings
 */
function getSettings() {
  return loadData().settings;
}

/**
 * Speichert Settings
 */
function saveSettings(settings) {
  const data = loadData();
  data.settings = { ...data.settings, ...settings };
  return saveData(data);
}

/**
 * Lädt Usage-Daten
 */
function getUsage() {
  return loadData().usage;
}

/**
 * Speichert Usage-Daten
 */
function saveUsage(usage) {
  const data = loadData();
  data.usage = { ...data.usage, ...usage };
  return saveData(data);
}

/**
 * Lädt Historie
 */
function getHistory() {
  return loadData().history;
}

/**
 * Speichert Historie
 */
function saveHistory(history) {
  const data = loadData();
  data.history = { ...data.history, ...history };
  return saveData(data);
}

/**
 * Fügt einen Tages-Eintrag zur Historie hinzu
 */
function addHistoryEntry(date, entry) {
  const data = loadData();
  data.history.daily[date] = entry;
  return saveData(data);
}

/**
 * Lädt Themen
 */
function getTopics() {
  return loadData().topics;
}

/**
 * Fügt ein Thema hinzu
 */
function addTopic(date, time, title) {
  const data = loadData();
  
  if (!data.topics[date]) {
    data.topics[date] = [];
  }
  
  // Duplikate vermeiden (gleicher Titel am selben Tag)
  const exists = data.topics[date].some(t => t.title === title);
  if (!exists) {
    data.topics[date].push({ time, title });
    // Nach Zeit sortieren (neueste zuerst)
    data.topics[date].sort((a, b) => b.time.localeCompare(a.time));
  }
  
  return saveData(data);
}

/**
 * Löscht alle Daten
 */
function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exportiert alle Daten als JSON
 */
function exportData() {
  const data = loadData();
  return JSON.stringify(data, null, 2);
}

/**
 * Importiert Daten aus JSON
 */
function importData(json) {
  try {
    const data = JSON.parse(json);
    return saveData(data);
  } catch (e) {
    console.error('Claude Dashboard: Import fehlgeschlagen', e);
    return false;
  }
}

/**
 * Berechnet Verbrauch in Prozent
 */
function getUsagePercent() {
  const data = loadData();
  const budget = data.settings.tokenBudget || 1;
  const used = data.usage.month?.total || 0;
  return Math.min(99, Math.max(1, Math.round((used / budget) * 100)));
}

/**
 * Deep Merge für Objekte
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// Export für Module
if (typeof module !== 'undefined') {
  module.exports = {
    loadData, saveData, getSettings, saveSettings,
    getUsage, saveUsage, getHistory, saveHistory,
    addHistoryEntry, getTopics, addTopic,
    clearAllData, exportData, importData, getUsagePercent
  };
}
