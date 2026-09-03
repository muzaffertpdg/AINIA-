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
// These "ainia"-level cards (the story before/after it bifurcates into the
// two columns) get the same Standout@/Allusions@ footer as scene cells,
// styled in a neutral tone since they belong to neither sub-novel alone.
function sharedCardHTML(data, fallbackLabel) {
  if (!data) return '';
  cellUid++;
  const standoutId = `sc-tt-standout-${cellUid}`;
  const allusionsId = `sc-tt-allusions-${cellUid}`;
  const hasExcerpt = data.excerpt && data.excerpt.trim().length > 0;
  const allusions = Array.isArray(data.allusions) ? data.allusions.filter(s => s && String(s).trim().length) : [];
  const allusionsText = allusions.length
    ? allusions.join(', ')
    : `<span class="sca-none">none yet</span>`;

  return `
    <div class="shared-scene-card">
      <div class="ssc-row">
        <a href="${data.url}" target="_blank" rel="noopener">
          <span class="ssc-label">${data.label || fallbackLabel}</span>
          <span class="ssc-title">${data.title}</span>
        </a>
        <svg class="ssc-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      </div>
      <div class="sc-footer">
        ${hasExcerpt ? `<button type="button" class="sc-tag sc-tag-standout sc-tag-neutral" data-tooltip-target="${standoutId}" aria-expanded="false" aria-controls="${standoutId}">highlight@</button>` : ''}
        <button type="button" class="sc-tag sc-tag-allusions sc-tag-neutral" data-tooltip-target="${allusionsId}" aria-expanded="false" aria-controls="${allusionsId}">connected@</button>
      </div>
      ${hasExcerpt ? `<div class="sc-tooltip sc-tooltip-standout" id="${standoutId}">${data.excerpt}</div>` : ''}
      <div class="sc-tooltip sc-tooltip-allusions" id="${allusionsId}">${allusionsText}</div>
    </div>`;
}

// ---- Individual scene cell markup ----
// Each cell shows a Standout@ tag (the excerpt / key quote — same content as
// before, now tag-triggered instead of hover-on-title) and an Allusions@ tag
// ("confusing map": bare, non-linked, author-curated scene-number references
// to other scenes this one alludes to — not reciprocal by default; the author
// decides whether a connection is noted on one side, both, or neither).
let cellUid = 0;
function cellHTML(entry, kind) {
  if (!entry) {
    return `<div class="scene-cell empty"><span>not yet published</span></div>`;
  }
  cellUid++;
  const standoutId = `sc-tt-standout-${cellUid}`;
  const allusionsId = `sc-tt-allusions-${cellUid}`;
  const hasExcerpt = entry.excerpt && entry.excerpt.trim().length > 0;
  const allusions = Array.isArray(entry.allusions) ? entry.allusions.filter(s => s && String(s).trim().length) : [];
  const allusionsText = allusions.length
    ? allusions.join(', ')
    : `<span class="sca-none">none yet</span>`;

  return `
    <div class="scene-cell ${kind}-cell">
      <a href="${entry.url}" target="_blank" rel="noopener">
        <span class="sc-title"><span class="cell-dot dot-${kind}"></span>${entry.title}</span>
      </a>
      <div class="sc-footer">
        ${hasExcerpt ? `<button type="button" class="sc-tag sc-tag-standout" data-tooltip-target="${standoutId}" aria-expanded="false" aria-controls="${standoutId}">highlight@</button>` : ''}
        <button type="button" class="sc-tag sc-tag-allusions" data-tooltip-target="${allusionsId}" aria-expanded="false" aria-controls="${allusionsId}">connected@</button>
      </div>
      ${hasExcerpt ? `<div class="sc-tooltip sc-tooltip-standout" id="${standoutId}">${entry.excerpt}</div>` : ''}
      <div class="sc-tooltip sc-tooltip-allusions" id="${allusionsId}">${allusionsText}</div>
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
        <svg class="cb-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </span>
    </button>
    <div class="chapter-panel${isOpen ? ' is-open' : ''}" id="chapter-panel-${chapter.number}">
      <div class="chapter-panel-inner">${chapterContentHTML(chapter)}</div>
    </div>`;

  container.appendChild(block);
});

// ---- Accordion open/close: one chapter open at a time ----
// The panel's inner wrapper stays overflow:hidden WHILE the height is animating
// (so the open/close slide still looks clipped and clean), then switches to
// overflow:visible once fully open, so a tooltip on the last card (e.g. the
// closing scene) can pop out past the panel's bottom edge instead of being cut off.
document.querySelectorAll('.chapter-bar').forEach(bar => {
  bar.addEventListener('click', () => {
    const block = bar.closest('.chapter-block');
    const chapterNum = block.dataset.chapter;
    const panel = block.querySelector('.chapter-panel');
    const inner = panel.querySelector('.chapter-panel-inner');
    const wasOpen = bar.classList.contains('is-open');

    document.querySelectorAll('.chapter-bar.is-open').forEach(b => {
      b.classList.remove('is-open');
      b.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.chapter-panel.is-open').forEach(p => {
      p.classList.remove('is-open');
      const pi = p.querySelector('.chapter-panel-inner');
      if (pi) pi.style.overflow = 'hidden'; // re-clip before it starts closing
    });

    if (!wasOpen) {
      bar.classList.add('is-open');
      bar.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      inner.style.overflow = 'hidden'; // clipped while it opens
      storeChapter(chapterNum);
      history.replaceState(null, '', `#chapter-${chapterNum}`);
    } else {
      storeChapter(null);
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  });
});

// Once a panel finishes opening, release the clip so tooltips can overflow it.
document.querySelectorAll('.chapter-panel').forEach(panel => {
  panel.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'grid-template-rows') return;
    if (panel.classList.contains('is-open')) {
      const inner = panel.querySelector('.chapter-panel-inner');
      if (inner) inner.style.overflow = 'visible';
    }
  });
});

// The chapter that's open by default on page load never fires a transition
// (it's rendered already-open), so release its clip immediately too.
document.querySelectorAll('.chapter-panel.is-open .chapter-panel-inner').forEach(inner => {
  inner.style.overflow = 'visible';
});

// ---- Tooltip behavior: Standout@ / Allusions@ tags ----
// Used by both scene cells and the opening/closing shared "ainia" cards.
// Click/tap-driven on all devices (these are buttons, not the card link, so
// there's no navigate-vs-reveal ambiguity to resolve). Clicking a tag toggles
// its tooltip; clicking a different tag closes whichever tooltip was open;
// clicking anywhere outside a tooltip/tag closes the open one.
(function () {
  let openTag = null;
  let openTooltip = null;

  function closeOpen() {
    if (openTag) openTag.setAttribute('aria-expanded', 'false');
    if (openTooltip) openTooltip.classList.remove('revealed');
    openTag = null;
    openTooltip = null;
  }

  document.querySelectorAll('.sc-tag').forEach(tag => {
    tag.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const targetId = this.getAttribute('data-tooltip-target');
      const tooltip = document.getElementById(targetId);
      if (!tooltip) return;

      const wasOpen = tooltip.classList.contains('revealed');
      closeOpen();
      if (!wasOpen) {
        tooltip.classList.add('revealed');
        this.setAttribute('aria-expanded', 'true');
        openTag = this;
        openTooltip = tooltip;
      }
    });
  });

  document.addEventListener('click', () => closeOpen());
})();

// ---- PWA: register service worker ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
