# 2025 CAU Art & Tech Showcase — Interactive Poster Cards

> 라즈베리파이 디스플레이에서 동작하는 인터랙티브 포스터 카드 전시 시스템.
> 사진풍 포스터의 오브젝트가 인식되고, 사용자가 선택한 필터로 변환된 후, 출렁이는 모션으로 살아 움직임.

---

## 0. 결정 사항 요약

| 항목 | 값 |
|---|---|
| 작품 수 | **6개** (Work01 ~ Work06, 임시명) |
| 필터 종류 | **7종** (mosaic, halftone, stipple, spike, wave, ascii, glitch) |
| 필터 선택 | **사용자가 카드 안에서 선택** (작품 제한 없음) |
| 모션 | **알고리즘** (영상 X, 작품 통일된 스타일) |
| 캡션 | placeholder만 (추후 결정) |
| 그리드 | 2×3, 6개 한 화면 |
| 디스플레이 | Pi 2.8" — **320×240 가로형** |
| 진입 흐름 | 인트로 → 6개 아이콘 → 풀스크린 카드 |
| 객체 인식 | MediaPipe (실시간 + 캐시 모드) + SAM 마스크 (사전 처리) |
| 빌드 | Vite + vanilla JS |

---

## 1. 인터랙션 플로우

```
[intro screen]                    ← 전시 소개
    │ ENTER 탭
    ▼
[grid view]                        ← 2×3 아이콘
    │ 아이콘 탭
    ▼
[idle]                             ← 풀스크린, 사진풍 포스터
    │ 탭
    ▼
[detecting]                        ← MediaPipe 인식 (브래킷 + 스캔라인)
    │ 자동 (0.6~1초)
    ▼
[detected]                         ← 박스 유지, ⊕ 필터 토글 등장
    │ 필터 선택 (7개 중 1개)
    ▼
[filtered]                         ← 카드 전체에 필터 wave-front 좌→우
                                     객체 영역에만 정착, 캡션 페이드인
    │ 탭
    ▼
[animated]                         ← 객체가 latent 모션으로 출렁임
    │ BACK 또는 길게 누르기
    ▼
[idle] 복귀
```

---

## 2. 필터 7종

모든 필터는 동일 인터페이스:

```js
// filters/{name}.js
export function apply(srcCtx, mask, options) {
  // returns: { canvas, cells }
  //   canvas: HTMLCanvasElement (마스크 영역만 필터, 외부 투명)
  //   cells:  [{ x, y, w, h, color, shape, ...meta }]
}
```

`cells` 배열을 반환하는 게 핵심. 모션 단계에서 이 배열의 좌표에 sine wave 변위를 주면, 어떤 필터든 같은 출렁임 모션이 적용됨.

| # | 필터 | 셀 정의 | 옵션 |
|---|---|---|---|
| 1 | `mosaic` | 정사각형 픽셀 | cellSize |
| 2 | `halftone` | 명도→반지름 원 | cellSize |
| 3 | `stipple` | 작은 점 밀도 분포 | density |
| 4 | `spike` | 수직 슬라이스 + 톱니 가장자리 | stripW, sawAmp |
| 5 | `wave` | sine 디스플레이스먼트 | amp, freq |
| 6 | `ascii` | 명도→문자 매핑 | cellW, cellH, ramp |
| 7 | `glitch` | 가로 슬라이스 + RGB shift | sliceH, rgbShift |

---

## 3. 폴더 구조

```
showcase/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   ├── posters/
│   │   ├── work01-photo.png       # 사진풍 원본
│   │   ├── work01-mask.png        # SAM 마스크
│   │   └── ... (work06까지)
│   └── mediapipe/
│       ├── wasm/
│       └── efficientdet_lite0.tflite
├── data/
│   └── works.json
├── tools/
│   └── extract-masks.py
└── src/
    ├── main.js
    ├── config.js                  # DEMO_MODE 토글
    ├── state.js                   # FSM
    ├── views/
    │   ├── intro.js
    │   ├── grid.js
    │   └── card.js
    ├── components/
    │   └── filterPanel.js         # 펼치는 필터 7개 메뉴
    ├── detector.js                # MediaPipe 래퍼
    ├── compositor.js              # 마스크 합성 + wave-front reveal
    ├── filters/
    │   ├── index.js
    │   ├── mosaic.js
    │   ├── halftone.js
    │   ├── stipple.js
    │   ├── spike.js
    │   ├── wave.js
    │   ├── ascii.js
    │   └── glitch.js
    └── animations/
        └── latent.js              # 출렁이는 cells 모션
```

---

## 4. 데이터 구조

### `data/works.json`

```json
[
  {
    "id": "work01",
    "name": "Work01",
    "team": "TEAM A",
    "loc": "1F · 8109",
    "photo": "posters/work01-photo.png",
    "mask": "posters/work01-mask.png",
    "defaultFilter": "mosaic",
    "caption": "",
    "bbox": null
  },
  {
    "id": "work02",
    "name": "Work02",
    "team": "TEAM B",
    "loc": "1F · LOBBY",
    "photo": "posters/work02-photo.png",
    "mask": "posters/work02-mask.png",
    "defaultFilter": "halftone",
    "caption": "",
    "bbox": null
  }
  // ... work06까지
]
```

- `defaultFilter`: 카드 진입 시 자동 적용. 사용자가 패널에서 변경 가능
- `bbox: null`이면 MediaPipe 실시간 감지, 값이 있으면 캐시 사용
- `caption`: 작가 의도 결정되면 채움

---

## 5. 필터 선택 UI (펼치는 메뉴)

`detected` 상태가 되면 우하단에 ⊕ 아이콘 페이드인.
탭 → 7개 필터 아이콘이 부채꼴/그리드로 펼쳐짐.

```
접힌 상태 (320×240):

   ┌──────────────────────────────┐
   │ ← BACK              DETECTED │
   │                              │
   │       [포스터 + 인식 박스]      │
   │                              │
   │                          ⊕   │
   └──────────────────────────────┘

펼친 상태:

   ┌──────────────────────────────┐
   │ ← BACK              DETECTED │
   │                              │
   │       [포스터 + 인식 박스]      │
   │                              │
   │   [pixel] [hltn] [stipl]     │
   │   [spike] [wave] [ascii]     │
   │   [glch]                 ⊗   │
   └──────────────────────────────┘
```

펼치는 애니메이션: stagger 50ms로 하나씩 등장.
선택된 필터는 강조 (테두리 + 색).

---

## 6. 단계별 작업 순서

### Phase 1: 골격 (반나절)
- [ ] Vite 프로젝트 셋업, 폴더 구조 생성
- [ ] `state.js` — FSM 직접 구현 (6개 상태 + 전이)
- [ ] `views/intro.js` — 전시 소개 화면
- [ ] `views/grid.js` — works.json 기반 2×3 그리드
- [ ] `views/card.js` — 풀스크린 + 클릭 핸들러 + 상태 라벨
- [ ] 라우팅: `/`, `/works`, `/works/:id`
- [ ] **테스트**: 인트로 → 그리드 → 카드 진입/뒤로가기

### Phase 2: 필터 7종 구현 (1.5일)
- [ ] `filters/mosaic.js` — 큰 정사각형
- [ ] `filters/halftone.js` — N×N 셀, 명도→반지름
- [ ] `filters/stipple.js` — 균일 격자, 밀도 = 1 - lum
- [ ] `filters/spike.js` — 수직 슬라이스 + zigzag
- [ ] `filters/wave.js` — sine 디스플레이스먼트
- [ ] `filters/ascii.js` — luminance ramp + monospace
- [ ] `filters/glitch.js` — 가로 슬라이스 + RGB shift
- [ ] 모두 동일 인터페이스 `apply(ctx, mask, opts)` → `{ canvas, cells }`
- [ ] **테스트**: 같은 이미지에 7개 필터 적용 비교

### Phase 3: 마스크 파이프라인 (1일)
- [ ] `tools/extract-masks.py` — SAM2 또는 MobileSAM
- [ ] `compositor.js`:
  - 원본 + 필터 + 마스크 합성
  - `globalCompositeOperation = 'destination-in'`
- [ ] **컬럼별 wave-front reveal** (이전 prototype 검증):
  ```js
  stripW = max(2, W/240)
  cols = ceil(W / stripW)
  startTimes[c] = (c/cols) * total * 0.7 + jitter(±100ms)
  alpha = clamp((t - startTimes[c]) / 350, 0, 1)
  ```
- [ ] 그린 글로우 라인이 wave front 따라 이동
- [ ] **테스트**: filter 변환 시 객체에만 적용 + wave 시각화

### Phase 4: MediaPipe 통합 (반나절)
- [ ] `detector.js` ObjectDetector 래퍼
- [ ] `runningMode: 'IMAGE'`, `efficientdet_lite0.tflite`
- [ ] 가짜 감지 애니메이션 0.6~1초 (브래킷 + 스캔라인)
- [ ] `bbox` 캐시값 있으면 detect 스킵하고 애니메이션만 재생
- [ ] **테스트**: 작품 6개 모두 객체 정확히 인식

### Phase 5: 필터 선택 패널 (반나절)
- [ ] `components/filterPanel.js`:
  - ⊕ 토글 버튼 (우하단)
  - 펼침/접힘 애니메이션 stagger 50ms
  - 7개 필터 아이콘
  - 선택 시 emit → `compositor` 재합성
- [ ] 선택 필터 강조 표시
- [ ] **테스트**: 필터 7개 모두 클릭해서 결과 보기

### Phase 6: latent 모션 (반나절)
- [ ] `animations/latent.js`:
  - 필터의 `cells` 배열을 받아서 sine wave 변위
  - 모든 필터/작품 통일 모션:
    ```js
    function tick(t) {
      for (const cell of cells) {
        const dx = Math.sin(t * 0.018 + cell.y * 0.04) * 12;
        const dy = Math.cos(t * 0.022 + cell.x * 0.04) * 14;
        drawCell(cell.x + dx, cell.y + dy, cell);
      }
    }
    ```
  - 60fps RAF
- [ ] 캡션 페이드인 (filtered 진입 1초 뒤)
- [ ] **테스트**: 7개 필터 모두에 자연스러운 모션

### Phase 7: 320×240 최적화 + Pi 배포 (반나절)
- [ ] viewport: `<meta viewport content="width=320, initial-scale=1, user-scalable=no">`
- [ ] 그리드 카드 약 95×70px
- [ ] 필터 셀 크기 320×240에 맞춰 재튜닝
- [ ] 60fps 보장 — 무거운 필터는 web worker 또는 캐시
- [ ] `vite build` → `dist/`
- [ ] Pi nginx + Chromium kiosk
- [ ] DPMS off

---

## 7. 핵심 알고리즘

### compositor.js 합성 루프

```js
async function compositeFiltered(work, filterName, photoEl, maskImageData) {
  const W = photoEl.width, H = photoEl.height;

  const base = new OffscreenCanvas(W, H);
  base.getContext('2d').drawImage(photoEl, 0, 0);

  const filterFn = filters[filterName];
  const { canvas: filtered, cells } = filterFn(
    base.getContext('2d'),
    maskImageData,
    work.filterOpts || {}
  );

  await revealByColumns(base, filtered, {
    duration: 2400,
    stripW: Math.max(2, W / 240)
  });

  return cells;  // animation 단계에서 사용
}
```

### latent 모션 알고리즘

cells 배열 매 프레임 다시 그리는 단순 구조:

```js
function setupLatent(cells) {
  cells.forEach(c => {
    c.phase = (c.x * 0.013 + c.y * 0.017) % (Math.PI * 2);
  });
  return cells;
}

function drawLatent(t, ctx, cells, baseImg) {
  ctx.drawImage(baseImg, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  // 마스크 영역 제거

  ctx.globalCompositeOperation = 'source-over';
  for (const c of cells) {
    const dx = 12 * Math.sin(t * 0.018 + c.phase + c.y * 0.03);
    const dy = 8  * Math.cos(t * 0.022 + c.phase + c.x * 0.03);
    drawCellByShape(ctx, c, dx, dy);
  }
  ctx.restore();
}

function drawCellByShape(ctx, c, dx, dy) {
  ctx.fillStyle = c.color;
  if (c.shape === 'rect')        ctx.fillRect(c.x + dx, c.y + dy, c.w, c.h);
  else if (c.shape === 'circle') { ctx.beginPath(); ctx.arc(c.x + dx, c.y + dy, c.r, 0, 6.28); ctx.fill(); }
  else if (c.shape === 'char')   ctx.fillText(c.ch, c.x + dx, c.y + dy);
  // ... 기타 shape
}
```

**같은 모션, 다른 셀 모양** — 작품/필터마다 미감은 달라도 모션은 통일.

---

## 8. 데모 모드 vs 프로덕션

```js
// src/config.js
export const DEMO_MODE = import.meta.env.DEV;
```

- `DEMO_MODE = true`: 마스크 = 비-흰색 영역 휴리스틱
- `DEMO_MODE = false`: SAM mask PNG 로드

작업 흐름:
1. photo PNG 6장 작업 → `public/posters/*-photo.png`
2. `python tools/extract-masks.py` → mask 6장 자동 생성
3. `npm run build`

---

## 9. 화면 디자인 (320×240)

### 인트로

```
 ┌────────────────────────────────────┐
 │                                    │
 │           ART & TECH               │
 │           SHOWCASE 2025            │
 │                                    │
 │           6 WORKS · 7 FILTERS      │
 │                                    │
 │              [ENTER →]             │
 │                                    │
 └────────────────────────────────────┘
```

### 그리드 (2×3)

```
 ┌────────────────────────────────────┐
 │ 2025 SHOWCASE          1F · LOBBY  │
 ├────────────────────────────────────┤
 │  ┌────┐  ┌────┐  ┌────┐            │
 │  │ 01 │  │ 02 │  │ 03 │            │
 │  └────┘  └────┘  └────┘            │
 │  ┌────┐  ┌────┐  ┌────┐            │
 │  │ 04 │  │ 05 │  │ 06 │            │
 │  └────┘  └────┘  └────┘            │
 ├────────────────────────────────────┤
 │  TAP A WORK                        │
 └────────────────────────────────────┘
```

---

## 10. 우선 작업 순서 (Claude Code 첫 세션)

1. Vite 프로젝트 초기화 + 폴더 구조
2. `data/works.json` placeholder 6개 (포스터는 임시 색상 박스 PNG)
3. `state.js` FSM
4. `views/intro.js` + `views/grid.js` + `views/card.js`
5. **`filters/mosaic.js` 1개만** — 인터페이스 검증
6. `compositor.js` + 마스크 합성 + wave-front reveal
7. 작동 확인되면 나머지 필터 6종 + filterPanel + 모션

---

## 부록: 빌드/실행

```bash
# 개발
npm install
npm run dev          # http://localhost:5173

# 마스크 추출
pip install segment-anything-2 pillow torch
python tools/extract-masks.py

# 프로덕션 빌드
npm run build

# Pi 배포
rsync -avz dist/ pi@raspberry.local:/var/www/showcase/
```

---

## 참고 레퍼런스

- Yuni Yoshida — uniform experiment (꽃잎 + 종이 픽셀)
- Toshiba 1980s — 색연필 cherry 광고
- @obtainer / "latent space" — 출렁이는 컬러 스캔라인
- Felipe Pantone — 그라데이션 + 디지털 글리치

---

## 결정 대기 사항

- 작품 이름 6개 (지금 placeholder)
- 작품별 캡션 (작가 의도)
- 작품별 객체 종류 (꽃/사물/동물 — 인식 정확도에 영향)
- 모션 속도/진폭 파라미터 (전시 분위기에 따라)
