/**
 * utils.js - Hilfsfunktionen für Claude Dashboard
 * Formatierung, Berechnungen, etc.
 */

/**
 * Formatiert Token-Zahlen lesbar (z.B. 1.2M, 450K)
 * @param {number} num - Token-Anzahl
 * @returns {string} Formatierte Zahl
 */
function formatTokens(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}

/**
 * Formatiert Datum für Anzeige (z.B. "23.01.2026")
 * @param {string|Date} date - Datum
 * @returns {string} Formatiertes Datum
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatiert Zeit für Anzeige (z.B. "14:32")
 * @param {Date} date - Datum mit Zeit
 * @returns {string} Formatierte Zeit
 */
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gibt "Heute", "Gestern" oder Datum zurück
 * @param {string} dateStr - Datum als YYYY-MM-DD
 * @returns {string} Relatives oder formatiertes Datum
 */
function formatRelativeDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const dateOnly = dateStr;
  const todayOnly = today.toISOString().split('T')[0];
  const yesterdayOnly = yesterday.toISOString().split('T')[0];
  
  if (dateOnly === todayOnly) return 'Heute';
  if (dateOnly === yesterdayOnly) return 'Gestern';
  
  return formatDate(date);
}

/**
 * Bestimmt Farbe basierend auf Verbrauchsprozent
 * @param {number} percent - Verbrauch in %
 * @returns {string} Hex-Farbcode
 */
function getUsageColor(percent) {
  if (percent < 34) return '#22c55e'; // Grün
  if (percent < 67) return '#eab308'; // Gelb
  return '#ef4444'; // Rot
}

/**
 * Bestimmt CSS-Klasse basierend auf Verbrauchsprozent
 * @param {number} percent - Verbrauch in %
 * @returns {string} CSS-Klasse
 */
function getUsageClass(percent) {
  if (percent < 34) return 'low';
  if (percent < 67) return 'medium';
  return 'high';
}

/**
 * Kürzt Modellnamen für Anzeige
 * @param {string} model - Voller Modellname
 * @returns {string} Gekürzter Name
 */
function shortModelName(model) {
  if (model.includes('opus')) return 'Opus 4.5';
  if (model.includes('sonnet')) return 'Sonnet 4.5';
  if (model.includes('haiku')) return 'Haiku 4.5';
  return model;
}

/**
 * Sortiert Modelle nach Priorität (Opus > Sonnet > Haiku)
 * @param {Object} byModel - { model: tokens } Objekt
 * @returns {Array} Sortiertes Array von [model, tokens]
 */
function sortModelsByPriority(byModel) {
  const priority = { opus: 1, sonnet: 2, haiku: 3 };
  
  return Object.entries(byModel).sort((a, b) => {
    const getPriority = (name) => {
      if (name.includes('opus')) return priority.opus;
      if (name.includes('sonnet')) return priority.sonnet;
      if (name.includes('haiku')) return priority.haiku;
      return 99;
    };
    return getPriority(a[0]) - getPriority(b[0]);
  });
}

/**
 * Berechnet Prozentanteil
 * @param {number} value - Wert
 * @param {number} total - Gesamtwert
 * @returns {number} Prozent (0-100)
 */
function calcPercent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Gibt das heutige Datum als YYYY-MM-DD zurück
 * @returns {string}
 */
function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Debounce-Funktion
 * @param {Function} func - Auszuführende Funktion
 * @param {number} wait - Wartezeit in ms
 * @returns {Function} Debounced Funktion
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export für Module
if (typeof module !== 'undefined') {
  module.exports = {
    formatTokens,
    formatDate,
    formatTime,
    formatRelativeDate,
    getUsageColor,
    getUsageClass,
    shortModelName,
    sortModelsByPriority,
    calcPercent,
    getTodayStr,
    debounce
  };
}
