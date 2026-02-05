/**
 * topic-collector.js - Content Script für claude.ai
 * Extrahiert automatisch Chat-Titel und sendet sie an die Extension
 */

(function() {
  'use strict';
  
  // Verhindere mehrfaches Laden
  if (window.__claudeDashboardCollector) return;
  window.__claudeDashboardCollector = true;
  
  let lastTitle = null;
  let observer = null;
  
  // Mögliche Selektoren für den Chat-Titel (können sich ändern)
  const TITLE_SELECTORS = [
    '[data-testid="chat-title-button"] .truncate',
    'button[data-testid="chat-title-button"] div.truncate',
    '[data-testid="chat-title"]',
    '.truncate[title]',
    'h1.truncate'
  ];
  
  // Titel die ignoriert werden sollen
  const IGNORE_TITLES = [
    'New chat',
    'Neuer Chat',
    'Untitled',
    ''
  ];
  
  /**
   * Findet den aktuellen Chat-Titel im DOM
   */
  function findChatTitle() {
    for (const selector of TITLE_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) {
        const title = el.textContent?.trim() || el.getAttribute('title')?.trim();
        if (title && !IGNORE_TITLES.includes(title)) {
          return title;
        }
      }
    }
    return null;
  }
  
  /**
   * Sendet ein Thema an die Extension
   */
  async function sendTopic(title) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_TOPIC',
        payload: { date, time, title }
      });
      console.log('Claude Dashboard: Thema erfasst -', title);
    } catch (error) {
      // Extension möglicherweise nicht verfügbar
      console.debug('Claude Dashboard: Konnte Thema nicht senden', error);
    }
  }
  
  /**
   * Prüft auf neuen Titel
   */
  function checkTitle() {
    const title = findChatTitle();
    
    if (title && title !== lastTitle) {
      lastTitle = title;
      sendTopic(title);
    }
  }
  
  /**
   * Startet den MutationObserver
   */
  function startObserver() {
    // Bestehenden Observer stoppen
    if (observer) {
      observer.disconnect();
    }
    
    // Neuen Observer erstellen
    observer = new MutationObserver((mutations) => {
      // Debounce: Nur alle 500ms prüfen
      clearTimeout(window.__claudeDashboardTimeout);
      window.__claudeDashboardTimeout = setTimeout(checkTitle, 500);
    });
    
    // Beobachte den gesamten Body auf Änderungen
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    console.log('Claude Dashboard: Topic Collector gestartet');
  }
  
  /**
   * Initialisierung
   */
  function init() {
    // Warte bis DOM bereit
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        startObserver();
        checkTitle();
      });
    } else {
      startObserver();
      checkTitle();
    }
    
    // Auch bei URL-Änderungen prüfen (SPA Navigation)
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Bei neuer URL den Titel zurücksetzen
        lastTitle = null;
        setTimeout(checkTitle, 1000);
      }
    }, 1000);
  }
  
  // Starten
  init();
  
})();
