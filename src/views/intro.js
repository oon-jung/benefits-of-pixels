// 인트로 — 2페이지: 인용구 → 작품 소개. 탭으로 다음 페이지, 마지막엔 /works.
import { navigate } from '../router.js';

const PAGES = [
  {
    type: 'cover',
    fullBleed: true,
    render: () => `
      <img class="intro-cover" src="/posters/intre.png" alt="Benefits of Pixels" />
    `
  },
  {
    type: 'quote',
    render: () => `
      <p class="intro-quote-lead">
        “인생은 멀리서 보면 <em>희극</em>,<br/>
        가까이서 보면 <em>비극</em>”
      </p>
      <p class="intro-quote-attr">— 라는 말, 아시나요?</p>
      <p class="intro-quote-tail">
        조금 <strong>흐리게</strong> 본다면,<br/>
        가까이서도 <strong>희극</strong>일 수 있습니다.
      </p>
    `
  },
  {
    type: 'title',
    render: () => `
      <h1 class="intro-title">&lt;픽셀의 효능&gt;</h1>
      <p class="intro-subtitle">Benefits of Pixels</p>
      <p class="intro-body">
        픽셀은 과도한 현실감을 줄이고<br/>
        분노와 민망함을 적당히 완화합니다.
      </p>
      <p class="intro-body">
        선명한 진실로부터 눈을 보호하고,<br/>
        대충 봐도 괜찮은 마음을 길러줍니다.
      </p>
      <p class="intro-body intro-body-meta">
        장시간 현실 감상으로 인한 피로에<br/>
        도움이 될 수 있습니다.
      </p>
    `
  }
];

export function mount(root) {
  let pageIdx = 0;
  let cleanups = [];

  function render() {
    cleanups.forEach(fn => fn());
    cleanups = [];

    const page = PAGES[pageIdx];
    const isLast = pageIdx === PAGES.length - 1;
    const fullBleed = page.fullBleed === true;
    root.innerHTML = `
      <section class="view view-intro intro-page-${page.type}${fullBleed ? ' intro-fullbleed' : ''}">
        <div class="intro-stack">
          ${page.render()}
        </div>
        ${
          fullBleed
            ? ''
            : `<footer class="intro-foot">
                 <span class="intro-hint">${isLast ? '탭하여 시작' : '탭하여 계속'}</span>
                 <span class="intro-dots">
                   ${PAGES.map((_, i) => `<span class="intro-dot${i === pageIdx ? ' is-active' : ''}"></span>`).join('')}
                 </span>
               </footer>`
        }
      </section>
    `;

    const view = root.querySelector('.view-intro');
    const onTap = () => {
      pageIdx += 1;
      if (pageIdx >= PAGES.length) {
        navigate('/works');
        return;
      }
      render();
    };
    view.addEventListener('click', onTap);
    cleanups.push(() => view.removeEventListener('click', onTap));
  }

  render();

  return () => cleanups.forEach(fn => fn());
}
