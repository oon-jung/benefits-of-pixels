// 2x3 그리드. works.json import → 카드 클릭 → /works/:id
import { navigate } from '../router.js';
import works from '../../data/works.json';

export function mount(root) {
  root.innerHTML = `
    <section class="view view-grid">
      <header class="grid-header">
        <span>BENEFITS OF PIXELS</span>
      </header>
      <div class="grid-body">
        ${works
          .map(
            w => `
          <button class="grid-cell" type="button" data-id="${w.id}">
            <img class="grid-thumb" src="/${w.photo}" alt="${w.name}" />
            <span class="grid-cell-label">
              <span class="grid-cell-name">${w.name}</span>
              <span class="grid-cell-emotion">${w.label || ''}</span>
            </span>
          </button>
        `
          )
          .join('')}
      </div>
      <footer class="grid-footer">TAP A WORK</footer>
    </section>
  `;

  const cleanups = [];
  root.querySelectorAll('.grid-cell').forEach(btn => {
    const handler = () => navigate(`/works/${btn.dataset.id}`);
    btn.addEventListener('click', handler);
    cleanups.push(() => btn.removeEventListener('click', handler));
  });

  return () => cleanups.forEach(fn => fn());
}
