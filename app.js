// ---- Shared scene 1 card ----
const sharedCard = document.getElementById('sharedSceneCard');
sharedCard.innerHTML = `
  <a href="${SHARED_SCENE.url}" target="_blank" rel="noopener">
    <span class="ssc-label">Scene ${SHARED_SCENE.scene} &middot; Shared opening</span>
    <span class="ssc-title">${SHARED_SCENE.title}</span>
  </a>
  <svg class="ssc-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
`;

// ---- Scene rows ----
function cellHTML(entry, kind) {
  if (!entry) {
    return `<div class="scene-cell empty"><span>not yet published</span></div>`;
  }
  return `
    <div class="scene-cell ${kind}-cell">
      <a href="${entry.url}" target="_blank" rel="noopener">
        <span class="sc-title">${entry.title}</span>
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
