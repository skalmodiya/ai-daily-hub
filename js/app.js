/* =====================================================
   AI Daily Hub — app.js
   Seeded daily content, streak tracking, search/filter
   ===================================================== */

const STORAGE_KEY = 'ai-daily-hub';
const TRENDING_CACHE_KEY = 'ai-trending-cache';

// ─── Seeded PRNG (Mulberry32) ───────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function getDailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── LocalStorage helpers ────────────────────────────
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Streak logic ─────────────────────────────────────
function updateStreak(state) {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (state.lastVisit === today) return state;

  const newState = { ...state };
  if (state.lastVisit === yesterday) {
    newState.streak = (state.streak || 0) + 1;
  } else if (!state.lastVisit) {
    newState.streak = 1;
  } else {
    newState.streak = 1;
  }
  newState.lastVisit = today;
  newState.visitHistory = [...(state.visitHistory || []), today].slice(-90);
  return newState;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Daily content selection ──────────────────────────
function selectDailyContent(items) {
  const rng = mulberry32(getDailySeed());
  const categories = ['framework', 'agent', 'sap-ai', 'paper', 'repo', 'concept'];

  const featured = [];
  const usedIds = new Set();

  for (const cat of categories) {
    const pool = items.filter(i => i.category === cat);
    if (!pool.length) continue;
    const shuffled = seededShuffle(pool, mulberry32(getDailySeed() + cat.charCodeAt(0)));
    featured.push(shuffled[0]);
    usedIds.add(shuffled[0].id);
  }

  const remaining = seededShuffle(items.filter(i => !usedIds.has(i.id)), rng);
  const bonus = remaining.slice(0, 4);

  return { featured, bonus };
}

// ─── Card HTML renderer ──────────────────────────────
const CATEGORY_LABELS = {
  framework: 'Framework',
  agent: 'AI Agent',
  'sap-ai': 'SAP AI',
  paper: 'Research',
  repo: 'Repository',
  concept: 'Core Concept'
};

function renderCard(item, state, opts = {}) {
  const learned = (state.learned || []).includes(item.id);
  const classes = ['card', `cat-${item.category}`, learned ? 'learned' : '', opts.featured ? 'card-featured' : ''].filter(Boolean).join(' ');

  const tags = (item.tags || []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');
  const stars = item.stars ? `<span class="trending-stars">⭐ ${item.stars}</span>` : '';
  const dailyLabel = opts.featured ? `<span class="daily-label">Today's Pick</span>` : '';

  return `
    <article class="${classes}" data-id="${item.id}" data-cat="${item.category}">
      ${dailyLabel}
      <div class="card-inner">
        <div class="card-header">
          <div class="card-emoji-wrap">${item.emoji || '🤖'}</div>
          <div class="card-meta">
            <span class="card-category">${CATEGORY_LABELS[item.category] || item.category}</span>
          </div>
          <div class="card-actions">
            <button class="btn-icon learned-btn ${learned ? 'active' : ''}" data-id="${item.id}" title="${learned ? 'Mark unlearned' : 'Mark as learned'}">
              ${learned ? '✅' : '○'}
            </button>
          </div>
        </div>
        <h3 class="card-title">${escHtml(item.title)}</h3>
        <p class="card-desc">${escHtml(item.description)}</p>
        ${tags ? `<div class="card-tags">${tags}</div>` : ''}
        <div class="card-footer">
          <span class="difficulty-badge diff-${item.difficulty}">${item.difficulty}</span>
          ${stars}
          <a class="card-link" href="${item.url}" target="_blank" rel="noopener noreferrer">
            Explore →
          </a>
        </div>
      </div>
    </article>`;
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Trending repos (curated + live attempt) ────────
const CURATED_TRENDING = [
  { name: 'ollama/ollama', desc: 'Get up and running with large language models locally', stars: '100k+', url: 'https://github.com/ollama/ollama' },
  { name: 'langchain-ai/langchain', desc: 'Build context-aware reasoning applications with LangChain', stars: '95k+', url: 'https://github.com/langchain-ai/langchain' },
  { name: 'open-webui/open-webui', desc: 'User-friendly AI interface supporting Ollama and OpenAI', stars: '50k+', url: 'https://github.com/open-webui/open-webui' },
  { name: 'langgenius/dify', desc: 'Open-source LLM app development platform with visual workflow', stars: '80k+', url: 'https://github.com/langgenius/dify' },
  { name: 'microsoft/autogen', desc: 'Multi-agent conversation framework for complex task automation', stars: '40k+', url: 'https://github.com/microsoft/autogen' },
  { name: 'microsoft/graphrag', desc: 'LLM-powered knowledge graph for advanced retrieval', stars: '20k+', url: 'https://github.com/microsoft/graphrag' },
  { name: 'BerriAI/litellm', desc: 'Call all LLM APIs using the OpenAI format', stars: '15k+', url: 'https://github.com/BerriAI/litellm' },
  { name: 'vllm-project/vllm', desc: 'High-throughput and memory-efficient LLM inference', stars: '40k+', url: 'https://github.com/vllm-project/vllm' },
];

function renderTrending(repos, isLive) {
  const trendEl = document.getElementById('trending-list');
  const liveEl = document.getElementById('trending-status');

  if (isLive) {
    liveEl.innerHTML = `<span class="live-indicator"><span class="live-dot"></span> Live</span>`;
    const dot = document.getElementById('tab-live-dot');
    if (dot) dot.classList.add('visible');
  } else {
    liveEl.innerHTML = `<span style="font-size:12px;color:var(--text-muted)">Curated</span>`;
  }

  trendEl.innerHTML = repos.slice(0, 8).map((r, i) => `
    <a class="trending-item" href="${r.url || r.html_url || '#'}" target="_blank" rel="noopener noreferrer">
      <span class="trending-rank">${String(i + 1).padStart(2, '0')}</span>
      <div class="trending-info">
        <div class="trending-title">${escHtml(r.name || r.full_name)}</div>
        <div class="trending-desc">${escHtml(r.desc || r.description || '')}</div>
      </div>
      <span class="trending-stars">⭐ ${r.stars || r.stargazers_count || '—'}</span>
    </a>`).join('');
}

async function loadTrending() {
  // Try a CORS-friendly public trending endpoint
  try {
    const cached = sessionStorage.getItem(TRENDING_CACHE_KEY);
    if (cached) {
      renderTrending(JSON.parse(cached), true);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://ghtrending.vercel.app/repositories', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const repos = (data.items || data || []).slice(0, 8).map(r => ({
        name: r.author ? `${r.author}/${r.name}` : r.name,
        desc: r.description || '',
        stars: r.stars || r.stargazers_count || '—',
        url: r.url || `https://github.com/${r.author}/${r.name}`
      }));
      if (repos.length > 0) {
        sessionStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify(repos));
        renderTrending(repos, true);
        return;
      }
    }
  } catch (_) {}

  renderTrending(CURATED_TRENDING, false);
}

// ─── Search & Filter ──────────────────────────────────
let allItems = [];
let filteredItems = [];
let activeCategory = 'all';
let searchQuery = '';

function applyFilters() {
  const q = searchQuery.toLowerCase();
  filteredItems = allItems.filter(item => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });
  renderAllCards();
}

function renderAllCards() {
  const grid = document.getElementById('all-cards-grid');
  const state = loadState();

  if (filteredItems.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">🔍</div>
      <h3>No matches found</h3>
      <p>Try a different search term or category filter.</p>
    </div>`;
    return;
  }

  grid.innerHTML = filteredItems.map(item => renderCard(item, state)).join('');
  bindLearnedButtons(grid);
}

// ─── Learned toggle ───────────────────────────────────
function bindLearnedButtons(container) {
  container.querySelectorAll('.learned-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const state = loadState();
      const learned = state.learned || [];
      const idx = learned.indexOf(id);
      if (idx === -1) {
        state.learned = [...learned, id];
        btn.classList.add('active');
        btn.textContent = '✅';
        btn.closest('.card').classList.add('learned');
        showToast('Marked as learned! Keep going 🎉');
      } else {
        state.learned = learned.filter(i => i !== id);
        btn.classList.remove('active');
        btn.textContent = '○';
        btn.closest('.card').classList.remove('learned');
      }
      saveState(state);
      updateProgressUI(state);
    });
  });
}

// ─── Progress UI ──────────────────────────────────────
function updateProgressUI(state) {
  const learned = (state.learned || []).length;
  const total = allItems.length;
  const pct = total ? Math.round((learned / total) * 100) : 0;

  const el = (id) => document.getElementById(id);
  if (el('stat-streak')) el('stat-streak').textContent = state.streak || 1;
  if (el('stat-learned')) el('stat-learned').textContent = learned;
  if (el('stat-total')) el('stat-total').textContent = total;
  if (el('stat-days')) el('stat-days').textContent = (state.visitHistory || []).length;
  if (el('progress-fill')) {
    el('progress-fill').style.width = pct + '%';
  }
  if (el('progress-pct')) el('progress-pct').textContent = pct + '%';
  if (el('streak-count')) el('streak-count').textContent = state.streak || 1;
}

// ─── Toast ────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.querySelector('.toast-msg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Share ────────────────────────────────────────────
function shareApp() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied to clipboard!'));
  } else {
    const el = document.createElement('textarea');
    el.value = url;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('🔗 Link copied to clipboard!');
  }
}

// ─── Date display ─────────────────────────────────────
function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── Main init ────────────────────────────────────────
async function init() {
  const today = new Date();
  document.getElementById('hero-date').textContent = formatDate(today);
  document.getElementById('header-date').textContent = getTodayString();

  // Streak
  let state = loadState();
  state = updateStreak(state);
  saveState(state);
  updateProgressUI(state);

  // Load content
  let items = [];
  try {
    const res = await fetch('./data/content.json');
    items = await res.json();
  } catch (e) {
    document.getElementById('daily-grid').innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><h3>Could not load content</h3><p>Please refresh or try again.</p></div>';
    return;
  }

  allItems = items;
  filteredItems = items;

  // Daily picks
  const { featured, bonus } = selectDailyContent(items);

  const dailyGrid = document.getElementById('daily-grid');
  dailyGrid.innerHTML = featured.map(item => renderCard(item, state, { featured: true })).join('');
  bindLearnedButtons(dailyGrid);

  const bonusGrid = document.getElementById('bonus-grid');
  bonusGrid.innerHTML = bonus.map(item => renderCard(item, state)).join('');
  bindLearnedButtons(bonusGrid);

  // All cards
  renderAllCards();

  // Trending
  loadTrending();

  // Filters
  document.querySelectorAll('.pill[data-cat]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill[data-cat]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.cat;
      applyFilters();
    });
  });

  // Search
  let debounce;
  document.getElementById('search-input').addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = e.target.value;
      applyFilters();
    }, 280);
  });

  // ── Scroll-spy with IntersectionObserver ──────────────
  const sections = document.querySelectorAll('.page-section');
  const tabs = document.querySelectorAll('.tab[data-section]');

  function setActiveTab(sectionId) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.section === sectionId));
  }

  // Track which sections are currently visible; activate the topmost one
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    // Pick the section that appears first in DOM order among visible ones
    for (const s of sections) {
      if (visible.has(s.id)) { setActiveTab(s.id); break; }
    }
  }, {
    rootMargin: '-112px 0px -40% 0px',  // offset matches scroll-margin-top
    threshold: 0
  });
  sections.forEach(s => observer.observe(s));

  // ── Click-to-jump: smooth scroll to section ───────────
  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(tab.dataset.section);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Share button
  document.getElementById('share-btn').addEventListener('click', shareApp);

  // Update stats after load
  updateProgressUI(state);
}

document.addEventListener('DOMContentLoaded', init);
