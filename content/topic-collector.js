(function() {
  'use strict';

  if (window.__claudeDashboardCollector) return;
  window.__claudeDashboardCollector = true;

  let lastTitle = null;
  let observer = null;

  const TITLE_SELECTORS = [
    '[data-testid="chat-title-button"] .truncate',
    'button[data-testid="chat-title-button"] div.truncate',
    '[data-testid="chat-title"]',
    '.truncate[title]',
    'h1.truncate'
  ];
  
  const IGNORE_TITLES = [
    'New chat',
    'Neuer Chat',
    'Untitled',
    ''
  ];
  
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
        payload: { date, time, title, url: location.href }
      });
      console.log('Dashboard: Thema erfasst -', title);
    } catch (error) {
      // Extension möglicherweise nicht verfügbar
      console.debug('Dashboard: Konnte Thema nicht senden', error);
    }
  }
  
  function checkTitle() {
    const title = findChatTitle();
    
    if (title && title !== lastTitle) {
      lastTitle = title;
      sendTopic(title);
    }
  }
  
  function startObserver() {
    if (observer) {
      observer.disconnect();
    }
    
    observer = new MutationObserver((mutations) => {
      clearTimeout(window.__claudeDashboardTimeout);
      window.__claudeDashboardTimeout = setTimeout(checkTitle, 500);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    console.log('Dashboard: Topic Collector gestartet');
  }
  
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        startObserver();
        checkTitle();
      });
    } else {
      startObserver();
      checkTitle();
    }
    
    // SPA Navigation
    let lastUrl = location.href;
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        lastTitle = null;
        setTimeout(checkTitle, 1000);
      }
    }, 1000);
  }
  
  init();
  
})();
