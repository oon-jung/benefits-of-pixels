// FSM + 작은 pub/sub 스토어.
// 카드 내부 상태: idle → detecting → detected → filtered → animated
// (Phase 1에서는 idle만 사용. 다음 phase에서 전이 함수 추가.)

const CARD_STATES = ['idle', 'detecting', 'detected', 'filtered', 'animated', 'message'];

const TRANSITIONS = {
  idle: ['detecting'],
  detecting: ['detected', 'idle'],
  detected: ['filtered', 'idle'],
  filtered: ['animated', 'idle'],
  animated: ['message', 'idle'],
  message: ['idle']
};

const state = {
  view: 'intro', // 'intro' | 'grid' | 'card'
  workId: null,
  cardState: 'idle',
  selectedFilter: null
};

const subs = new Set();

export function getState() {
  return { ...state };
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

function emit() {
  for (const fn of subs) fn(getState());
}

export function setView(view, opts = {}) {
  state.view = view;
  if ('workId' in opts) state.workId = opts.workId;
  if (view !== 'card') {
    state.cardState = 'idle';
    state.selectedFilter = null;
  }
  emit();
}

export function setCardState(next) {
  const allowed = TRANSITIONS[state.cardState] || [];
  if (!allowed.includes(next)) {
    console.warn(`[state] illegal transition ${state.cardState} → ${next}`);
    return false;
  }
  state.cardState = next;
  emit();
  return true;
}

export function setSelectedFilter(name) {
  state.selectedFilter = name;
  emit();
}

export const STATES = CARD_STATES;
