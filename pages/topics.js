/**
 * topics.js - Themen-Log Seite Logik
 */

// DOM Elements
const elements = {
  btnBack: document.getElementById('btn-back'),
  filterInput: document.getElementById('filter-input'),
  topicContainer: document.getElementById('topic-container')
};

let allTopics = {};

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadTopics();
  setupEventListeners();
});

/**
 * Event Listeners
 */
function setupEventListeners() {
  elements.btnBack.addEventListener('click', () => {
    window.close();
  });
  
  elements.filterInput.addEventListener('input', () => {
    renderTopics(elements.filterInput.value.toLowerCase());
  });
}

/**
 * Lädt Themen
 */
async function loadTopics() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    allTopics = data?.topics || {};
    renderTopics();
  } catch (error) {
    console.error('Fehler beim Laden:', error);
    elements.topicContainer.innerHTML = '<div class="empty-state">Fehler beim Laden</div>';
  }
}

/**
 * Rendert Themen-Liste
 */
function renderTopics(filter = '') {
  const dates = Object.keys(allTopics).sort().reverse();
  
  if (dates.length === 0) {
    elements.topicContainer.innerHTML = '<div class="empty-state">Keine Themen erfasst</div>';
    return;
  }
  
  let html = '';
  let hasResults = false;
  
  for (const date of dates) {
    const topics = allTopics[date] || [];
    
    // Filter anwenden
    const filtered = filter 
      ? topics.filter(t => t.title.toLowerCase().includes(filter))
      : topics;
    
    if (filtered.length === 0) continue;
    
    hasResults = true;
    const dateLabel = formatRelativeDate(date);
    
    html += `
      <div class="day-group">
        <div class="day-header" data-date="${date}">
          <span>${dateLabel} – ${date}</span>
          <span>${filtered.length} Themen</span>
        </div>
        <div class="day-content">
          ${filtered.map(t => `
            <div class="topic-entry">
              <span class="topic-time">${t.time}</span>
              <span class="topic-title">${escapeHtml(highlightMatch(t.title, filter))}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  if (!hasResults) {
    html = '<div class="empty-state">Keine Treffer für "' + escapeHtml(filter) + '"</div>';
  }
  
  elements.topicContainer.innerHTML = html;
}

/**
 * Formatiert relatives Datum
 */
function formatRelativeDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (dateStr === todayStr) return 'Heute';
  if (dateStr === yesterdayStr) return 'Gestern';
  
  return date.toLocaleDateString('de-DE', { weekday: 'long' });
}

/**
 * Hebt Suchbegriff hervor
 */
function highlightMatch(text, filter) {
  if (!filter) return text;
  
  const regex = new RegExp(`(${escapeRegex(filter)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escaped RegExp Sonderzeichen
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escaped HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
