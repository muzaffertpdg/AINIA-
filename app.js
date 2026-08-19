// ---- Shared scene 1 card ----
const sharedHasExcerpt = SHARED_SCENE.excerpt && SHARED_SCENE.excerpt.trim().length > 0;
const sharedCard = document.getElementById('sharedSceneCard');
sharedCard.className = 'shared-scene-card' + (sharedHasExcerpt ? ' has-excerpt' : '');
sharedCard.innerHTML = `
  <a href="${SHARED_SCENE.url}" target="_blank" rel="noopener">
    <span class="ssc-label">Scene ${SHARED_SCENE.scene} &middot; Shared opening</span>
    <span class="ssc-title">${SHARED_SCENE.title}</span>
    ${sharedHasExcerpt ? `<span class="sc-tooltip">${SHARED_SCENE.excerpt}</span>` : ''}
  </a>
  <svg class="ssc-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
`;

// ---- Scene rows ----
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
    </div>
  `;
}

const rowsEl = document.getElementById('sceneRows');
SCENES.forEach(row => {
  const div = document.createElement('div');
  div.className = 'scene-row';
  div.innerHTML = `
    <div class="scene-num">${row.scene}</div>
    ${cellHTML(row.ui, 'ui')}
    ${cellHTML(row.rh, 'rh')}
  `;
  rowsEl.appendChild(div);
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
