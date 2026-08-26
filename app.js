// ---- localStorage: remember the reader's last open chapter ----
const LAST_CHAPTER_KEY = 'ainia-last-chapter';
function getStoredChapter() {
  try { return localStorage.getItem(LAST_CHAPTER_KEY); } catch (e) { return null; }
}
function storeChapter(num) {
  try {
    if (num === null) localStorage.removeItem(LAST_CHAPTER_KEY);
    else localStorage.setItem(LAST_CHAPTER_KEY, String(num));
  } catch (e) { /* private mode / storage disabled: fail silently */ }
}

// ---- Shared scene card markup (opening / closing) ----
function sharedCardHTML(data, fallbackLabel) {
  if (!data) return '';
  const hasExcerpt = data.excerpt && data.excerpt.trim().length > 0;
  return `
    <div class="shared-scene-card${hasExcerpt ? ' has-excerpt' : ''}">
      <a href="${data.url}" target="_blank" rel="noopener">
        <span class="ssc-label">${data.label || fallbackLabel}</span>
        <span class="ssc-title">${data.title}</span>
        ${hasExcerpt ? `<span class="sc-tooltip">${data.excerpt}</span>` : ''}
      </a>
      <svg class="ssc-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
    </div>`;
}

// ---- Individual scene cell markup ----
function cellHTML(entry, kind) {
  if (!entry) {
    return `<div class="scene-cell empty"><span>not yet published</span></div>`;
  }
  const hasExcerpt = entry.excerpt && entry.excerpt.trim().length > 0;
  return `
    <div class="scene-cell ${kind}-cell${hasExcerpt ? ' has-excerpt' : ''}">
      <a href="${entry.url}" target="_blank" rel="noopener">
        <span class="sc-title"><span class="cell-dot dot-${kind}"></span>${entry.title}</span>
        ${hasExcerpt ? `<span class="sc-tooltip">${entry.excerpt}</span>` : ''}
      </a>
    </div>`;
}

// ---- Full content for one chapter panel: either the scene table, or the empty state ----
function chapterContentHTML(chapter) {
  const hasContent = (chapter.scenes && chapter.scenes.length > 0) || chapter.sharedScene || chapter.closingScene;

  if (!hasContent) {
    return `
      <div class="chapter-empty">
        <p class="ce-line">Here be scenes from Chapter ${chapter.number}</p>
        <p class="ce-line ce-muted">Stay tuned</p>
        <p class="ce-line"><a href="https://unibodyinfinity.substack.com" target="_blank" rel="noopener">follow the novel on substack</a></p>
      </div>`;
  }

  let html = '';
  if (chapter.sharedScene) {
    html += sharedCardHTML(chapter.sharedScene, `Scene ${chapter.sharedScene.scene} &middot; Shared opening`);
  }
  if (chapter.scenes && chapter.scenes.length) {
    html += `
      <div class="legend-key">
        <span class="lk-item"><span class="lk-dot" style="background:var(--color-algae)"></span>Unibody Infinity</span>
        <span class="lk-item"><span class="lk-dot" style="background:var(--color-accent)"></span>The Red Handbag</span>
      </div>
      <div class="column-headers">
        <span class="ch-label"></span>
        <span class="ch-label ch-novel-ui">Unibody Infinity</span>
        <span class="ch-label ch-novel-rh">The Red Handbag</span>
      </div>
      <div class="scene-rows">`;
    chapter.scenes.forEach(row => {
      html += `
        <div class="scene-row">
          <div class="scene-num">${row.scene}</div>
          ${cellHTML(row.ui, 'ui')}
          ${cellHTML(row.rh, 'rh')}
        </div>`;
    });
    html += `</div>`;
  }
  if (chapter.closingScene) {
    html += sharedCardHTML(chapter.closingScene, 'Closing scene');
  }
  return html;
}

// ---- Determine which chapter should open on load ----
// Priority: URL hash (#chapter-2) > remembered last chapter > Chapter 1.
function resolveInitialChapter() {
  const hashMatch = window.location.hash.match(/^#chapter-(\d+)$/);
  if (hashMatch) return parseInt(hashMatch[1], 10);

  const stored = getStoredChapter();
  if (stored && CHAPTERS.some(c => String(c.number) === stored)) {
    return parseInt(stored, 10);
  }

  return CHAPTERS[0].number;
}

// ---- Build the accordion ----
const container = document.getElementById('chaptersContainer');
const initialChapter = resolveInitialChapter();

CHAPTERS.forEach(chapter => {
  const count = chapter.scenes ? chapter.scenes.length : 0;
  const isPublished = count > 0 || chapter.sharedScene || chapter.closingScene;
  const isOpen = chapter.number === initialChapter;

  const block = document.createElement('div');
  block.className = 'chapter-block';
  block.dataset.chapter = chapter.number;

  block.innerHTML = `
    <button class="chapter-bar${isOpen ? ' is-open' : ''}" type="button" aria-expanded="${isOpen}" aria-controls="chapter-panel-${chapter.number}">
      <span class="cb-left">
        <span class="cb-num">Chapter ${chapter.number}</span>
        ${chapter.title ? `<span class="cb-title">${chapter.title}</span>` : ''}
      </span>
      <span class="cb-right">
        <span class="cb-count${isPublished ? '' : ' cb-count-pending'}">${isPublished ? count + (count === 1 ? ' scene' : ' scenes') : 'coming soon'}</span>
        <svg class="cb-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </span>
    </button>
    <div class="chapter-panel${isOpen ? ' is-open' : ''}" id="chapter-panel-${chapter.number}">
      <div class="chapter-panel-inner">${chapterContentHTML(chapter)}</div>
    </div>`;

  container.appendChild(block);
});

// ---- Accordion open/close: one chapter open at a time ----
document.querySelectorAll('.chapter-bar').forEach(bar => {
  bar.addEventListener('click', () => {
    const block = bar.closest('.chapter-block');
    const chapterNum = block.dataset.chapter;
    const panel = block.querySelector('.chapter-panel');
    const wasOpen = bar.classList.contains('is-open');

    document.querySelectorAll('.chapter-bar.is-open').forEach(b => {
      b.classList.remove('is-open');
      b.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.chapter-panel.is-open').forEach(p => p.classList.remove('is-open'));

    if (!wasOpen) {
      bar.classList.add('is-open');
      bar.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      storeChapter(chapterNum);
      history.replaceState(null, '', `#chapter-${chapterNum}`);
    } else {
      storeChapter(null);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  });
});

// ---- Tooltip behavior ----
// Desktop/hover-capable devices: pure CSS :hover reveals the tooltip (see si-styles.css),
// and a normal click navigates immediately — no JS needed for that path.
// Touch-primary devices: first tap reveals the tooltip and does NOT navigate; a second
// tap on that same box navigates normally. Tapping a DIFFERENT scene's tooltip closes
// whichever one was previously open. Cells with no excerpt never get this treatment —
// a single tap just navigates.
const isTouchPrimary = window.matchMedia('(hover: none)').matches;
if (isTouchPrimary) {
  let currentlyRevealed = null;
  document.querySelectorAll('.has-excerpt > a').forEach(link => {
    link.addEventListener('click', function (e) {
      const cell = this.closest('.has-excerpt');
      if (!cell.classList.contains('revealed')) {
        e.preventDefault();
        if (currentlyRevealed && currentlyRevealed !== cell) {
          currentlyRevealed.classList.remove('revealed');
        }
        cell.classList.add('revealed');
        currentlyRevealed = cell;
      }
      // already revealed: default navigation proceeds
    });
  });
}

// ---- PWA: register service worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
