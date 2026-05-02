// Hash 기반 라우터.
//   #/            → intro
//   #/works       → grid
//   #/works/:id   → card

const routes = [
  { pattern: /^\/?$/, name: 'intro' },
  { pattern: /^\/works\/?$/, name: 'grid' },
  { pattern: /^\/works\/([\w-]+)\/?$/, name: 'card' }
];

let listener = null;

export function navigate(path) {
  const target = `#${path}`;
  if (location.hash === target) {
    // 같은 해시면 hashchange가 안 뜨므로 직접 한번 더 트리거
    parseAndDispatch();
  } else {
    location.hash = target;
  }
}

function parseHash() {
  const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const path = raw || '/';
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) {
      return { name: r.name, params: m.slice(1) };
    }
  }
  return { name: 'intro', params: [] };
}

function parseAndDispatch() {
  if (!listener) return;
  const { name, params } = parseHash();
  listener({ name, params });
}

export function start(onChange) {
  listener = onChange;
  window.addEventListener('hashchange', parseAndDispatch);
  // 첫 진입 시 hash 비어있으면 #/ 로 초기화
  if (!location.hash) {
    location.replace(location.pathname + location.search + '#/');
  }
  parseAndDispatch();
}

export function stop() {
  window.removeEventListener('hashchange', parseAndDispatch);
  listener = null;
}
