const elements = {
  btnBack: document.getElementById('btn-back'),
  filterInput: document.getElementById('filter-input'),
  topicContainer: document.getElementById('topic-container')
};

let allTopics = {};

document.addEventListener('DOMContentLoaded', async () => {
  await loadTopics();
  setupEventListeners();
});

function setupEventListeners() {
  elements.btnBack.addEventListener('click', () => window.close());

  let debounceTimer;
  elements.filterInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderTopics(elements.filterInput.value.toLowerCase().trim());
    }, 150);
  });
}

async function loadTopics() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_DATA' });
    allTopics = data?.topics || {};
    renderTopics();
  } catch (error) {
    console.error('Error loading topics:', error);
    elements.topicContainer.textContent = '';
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = i18n('loadError');
    elements.topicContainer.appendChild(empty);
  }
}

function renderTopics(filter = '') {
  const dates = Object.keys(allTopics).sort().reverse();

  elements.topicContainer.textContent = '';

  if (dates.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = i18n('noTopicsRecorded');
    elements.topicContainer.appendChild(empty);
    return;
  }

  let hasResults = false;

  for (const date of dates) {
    const topics = allTopics[date] || [];

    const filtered = filter
      ? topics.filter(t => t.title.toLowerCase().includes(filter))
      : topics;

    if (filtered.length === 0) continue;
    hasResults = true;

    const group = document.createElement('div');
    group.className = 'day-group';

    const header = document.createElement('div');
    header.className = 'day-header';

    const headerLabel = document.createElement('span');
    headerLabel.textContent = formatRelativeDate(date) + ' -- ' + date;

    const headerCount = document.createElement('span');
    headerCount.textContent = i18n('topicsCount', [String(filtered.length)]);

    header.appendChild(headerLabel);
    header.appendChild(headerCount);

    const content = document.createElement('div');
    content.className = 'day-content';

    for (const t of filtered) {
      const entry = document.createElement('div');
      entry.className = 'topic-entry';

      if (t.url) {
        entry.classList.add('topic-link');
        entry.addEventListener('click', () => {
          chrome.tabs.create({ url: t.url });
        });
        entry.title = t.title;
      }

      const time = document.createElement('span');
      time.className = 'topic-time';
      time.textContent = t.time;

      const title = document.createElement('span');
      title.className = 'topic-title';

      if (filter) {
        highlightText(title, t.title, filter);
      } else {
        title.textContent = t.title;
      }

      entry.appendChild(time);
      entry.appendChild(title);
      content.appendChild(entry);
    }

    group.appendChild(header);
    group.appendChild(content);
    elements.topicContainer.appendChild(group);
  }

  if (!hasResults) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = i18n('noResultsFor', [filter]);
    elements.topicContainer.appendChild(empty);
  }
}

function highlightText(container, text, filter) {
  const lower = text.toLowerCase();
  let lastIndex = 0;

  while (true) {
    const idx = lower.indexOf(filter, lastIndex);
    if (idx === -1) break;

    if (idx > lastIndex) {
      container.appendChild(document.createTextNode(text.slice(lastIndex, idx)));
    }

    const mark = document.createElement('mark');
    mark.textContent = text.slice(idx, idx + filter.length);
    container.appendChild(mark);

    lastIndex = idx + filter.length;
  }

  if (lastIndex < text.length) {
    container.appendChild(document.createTextNode(text.slice(lastIndex)));
  }
}

function formatRelativeDate(dateStr) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return i18n('today');
  if (dateStr === yesterdayStr) return i18n('yesterday');

  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long' });
}
