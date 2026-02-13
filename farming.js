// ---- 무기 카테고리(무기별 파밍지 필터) ----
const WEAPON_CATEGORY = {
  "한손검": new Set([
    "강철의 여운","불사의 성주","린수를 찾아서 3.0","십이문","O.B.J. 엣지 오브 라이트","숭배의 시선",
    "장대한 염원","끝없는 방랑","용조의 불꽃","암흑의 횃불","부요","테르밋 커터","위대한 이름","백야의 별"
  ]),
  "양손검": new Set([
    "검은 추적자","고대의 강줄기","최후의 메아리","O.B.J. 헤비 버든","천둥의 흔적","헤라펜거","모범","과거의 일품","분쇄의 군주"
  ]),
  "장병기": new Set([
    "키메라의 정의","O.B.J. 스파이크","중심력","산의 지배자","용사","J.E.T."
  ]),
  "권총": new Set([
    "작품: 중생","O.B.J. 벨로시투스","이성적인 작별","예술의 폭군","항로의 개척자","쐐기","클래니벌"
  ]),
  "아츠 유닛": new Set([
    "망자의 노래","무가내하","황무지의 방랑자","선교의 자유","O.B.J. 아츠 아이덴티티","사명의 길","바다와 별의 꿈",
    "작품: 침식 흔적","폭발 유닛","망각","기사도 정신"
  ])
};

function initFarmingUI({ WEAPONS_6, WEAPONS_5, STATE, updateFarmingResults }) {
  const g6 = document.getElementById('grid-6star');
  const g5 = document.getElementById('grid-5star');
  if (!g6 || !g5) return;

  // ---- 기본 상태(없으면 생성) ----
  if (typeof STATE.show5Star !== 'boolean') STATE.show5Star = false;     // 5성 표시
  if (!STATE.activeCategories) STATE.activeCategories = new Set(["전체"]);
  if (!STATE.excludedCategories) STATE.excludedCategories = new Set(); // 카테고리 필터
  if (typeof STATE.hideOwned !== 'boolean') STATE.hideOwned = true;      // 종결(보유) 숨김 (기본: 숨김 ON)

  const categories = ["전체", "한손검", "양손검", "장병기", "권총", "아츠 유닛"];

  const makeToggleBtn = (label) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.padding = '6px 10px';
    b.style.fontSize = '0.9em';
    b.style.borderRadius = '8px';
    return b;
  };

  // ---- 상단 컨트롤 바(카테고리 + 토글들) ----
  const topBar = document.createElement('div');
  topBar.style.display = 'flex';
  topBar.style.width = '100%';
  topBar.style.justifyContent = 'space-between';
  topBar.style.alignItems = 'center';
  topBar.style.gap = '10px';
  topBar.style.marginBottom = '12px';

  // 1) 카테고리 버튼 바
  const catBar = document.createElement('div');
  catBar.style.display = 'flex';
  catBar.style.flexWrap = 'wrap';
  catBar.style.gap = '6px';

  const setBtnColor = (btn, on) => {
    btn.style.background = on ? 'var(--green)' : 'var(--red)';
    btn.style.color = '#fff';
  };

  const categoryButtons = new Map();

  const refreshCategoryButtons = () => {
    const allOn = STATE.activeCategories.has("전체");
    for (const [cat, btn] of categoryButtons.entries()) {
      let on = false;
      if (cat === "전체") {
        on = allOn;
      } else if (allOn) {
        // 전체 ON일 때: 해당 카테고리를 '제외'하면 OFF(빨강), 아니면 ON(초록)
        if (!STATE.excludedCategories) STATE.excludedCategories = new Set();
        on = !STATE.excludedCategories.has(cat);
      } else {
        on = STATE.activeCategories.has(cat);
      }
      setBtnColor(btn, on);
    }
  };

  categories.forEach(cat => {
    const btn = makeToggleBtn(cat);
    categoryButtons.set(cat, btn);

    btn.onclick = () => {
      const allOn = STATE.activeCategories.has("전체");
      if (cat === "전체") {
        // 전체 토글: ON이면 '전체(포함)' 모드, OFF이면 개별 선택 모드
        if (allOn) {
          STATE.activeCategories.delete("전체");
        } else {
          STATE.activeCategories = new Set(["전체"]);
          if (!STATE.excludedCategories) STATE.excludedCategories = new Set();
          STATE.excludedCategories.clear();
        }
      } else {
        if (allOn) {
          // 전체 ON일 때: 누른 카테고리를 '제외' 토글(나머지는 그대로 포함)
          if (!STATE.excludedCategories) STATE.excludedCategories = new Set();
          if (STATE.excludedCategories.has(cat)) STATE.excludedCategories.delete(cat);
          else STATE.excludedCategories.add(cat);
        } else {
          // 전체 OFF일 때: 개별 포함 토글
          if (STATE.activeCategories.has(cat)) STATE.activeCategories.delete(cat);
          else STATE.activeCategories.add(cat);

          // 모든 카테고리가 켜졌으면 전체 ON으로 전환
          const othersOn = categories.slice(1).every(c => STATE.activeCategories.has(c));
          if (othersOn) {
            STATE.activeCategories = new Set(["전체"]);
            if (!STATE.excludedCategories) STATE.excludedCategories = new Set();
            STATE.excludedCategories.clear();
          }
        }
      }

      refreshCategoryButtons();
      filterWeapons();
    };

    catBar.appendChild(btn);
  });

  // 초기 상태 반영
  refreshCategoryButtons();

  // 2) 5성 토글 (기본: 숨김)
  const toggle5 = makeToggleBtn("5성 숨김");

  // 3) 종결(보유) 토글 (기본: 숨김)
  const toggleOwned = makeToggleBtn("종결 숨김");

  const applyWeaponToggles = () => {
    // 5성: true=표시(초록) / false=숨김(빨강)
    toggle5.textContent = STATE.show5Star ? "5성 표시" : "5성 숨김";
    setBtnColor(toggle5, STATE.show5Star);

    // 종결(보유): true=숨김(빨강) / false=표시(초록)
    toggleOwned.textContent = STATE.hideOwned ? "종결 숨김" : "종결 표시";
    setBtnColor(toggleOwned, !STATE.hideOwned);
  };

  toggle5.onclick = () => {
    STATE.show5Star = !STATE.show5Star;
    g5.style.display = STATE.show5Star ? "grid" : "none";
    applyWeaponToggles();
    filterWeapons();
  };

  toggleOwned.onclick = () => {
    STATE.hideOwned = !STATE.hideOwned;
    applyWeaponToggles();
    filterWeapons();
    updateFarmingResults(); // 선택 무기/추천 결과도 같이 갱신
  };

  // 최초 상태 반영
  applyWeaponToggles();

  // 2열 배치: 왼쪽(카테고리) / 오른쪽(5성, 종결)
  const rightBar = document.createElement('div');
  rightBar.style.display = 'flex';
  rightBar.style.gap = '8px';
  rightBar.style.alignItems = 'center';

  topBar.appendChild(catBar);
  rightBar.appendChild(toggle5);
  rightBar.appendChild(toggleOwned);
  topBar.appendChild(rightBar);

  // topBar를 6성 그리드 위에 삽입
  if (!document.getElementById('weapon-filter-topbar')) {
    topBar.id = 'weapon-filter-topbar';
    // '6성 무기' 타이틀(h3) 위로 올리기
    const titleEl = g6.previousElementSibling;
    if (titleEl) g6.parentNode.insertBefore(topBar, titleEl);
    else g6.before(topBar);
  }

  const createCard = (w, path, starPrefix) => {
    const div = document.createElement('div');
    div.className = `weapon-card ${STATE.ownedWeapons.has(w.name) ? 'owned' : ''}`;
    div.dataset.name = w.name;

    div.onclick = () => {
      // 숨김 상태에서는 클릭 자체가 불가능(보이는 카드만 클릭 가능)
      if (STATE.selectedWeapons.has(w)) {
        STATE.selectedWeapons.delete(w);
        div.classList.remove('selected');
      } else {
        STATE.selectedWeapons.add(w);
        div.classList.add('selected');
      }
      updateFarmingResults();
    };

    div.innerHTML = `
      <div class="weapon-img-container">
        <img src="배경.png" class="layer bg-layer">
        <img src="${path}/${w.name.replace(/:/g,'')}.png" class="layer weapon-layer" onerror="this.src='https://via.placeholder.com/240?text=No+Img'">
        <img src="${path}/${starPrefix} 하단.png" class="layer bottom-layer">
      </div>
      <div>${w.name}</div>
    `;
    return div;
  };

  // 렌더
  g6.innerHTML = '';
  g5.innerHTML = '';
  WEAPONS_6.forEach(w => g6.appendChild(createCard(w, '6성 무기', '6성')));
  WEAPONS_5.forEach(w => g5.appendChild(createCard(w, '5성 무기', '5성')));

  // 기본: 5성 숨김
  g5.style.display = STATE.show5Star ? 'grid' : 'none';

  // ---- 필터링 로직(카테고리 + 종결숨김 + 5성 표시) ----
  const deselectByName = (name) => {
    // STATE.selectedWeapons(Set<object>) 에서 name 일치 제거
    for (const w of Array.from(STATE.selectedWeapons)) {
      if (w && w.name === name) STATE.selectedWeapons.delete(w);
    }
  };

  function filterWeapons() {
    const allCards = document.querySelectorAll('#grid-6star .weapon-card, #grid-5star .weapon-card');

    allCards.forEach(card => {
      const name = card.dataset.name;

      // 1) 종결(보유) 숨김
      if (STATE.hideOwned && STATE.ownedWeapons.has(name)) {
        card.style.display = 'none';
        return;
      }

      // 2) 카테고리 필터
      let visible = false;

      if (STATE.activeCategories.has("전체")) {
        visible = true;
        // 전체 ON일 때: 제외된 카테고리에 속한 무기는 숨김
        if (!STATE.excludedCategories) STATE.excludedCategories = new Set();
        for (const cat of categories.slice(1)) {
          if (!STATE.excludedCategories.has(cat)) continue;
          const set = WEAPON_CATEGORY[cat];
          if (set && set.has(name)) { visible = false; break; }
        }
      } else {
        for (const cat of categories.slice(1)) {
          if (!STATE.activeCategories.has(cat)) continue;
          const set = WEAPON_CATEGORY[cat];
          if (set && set.has(name)) { visible = true; break; }
        }
      }
      card.style.display = visible ? '' : 'none';
    });

    updateFarmingResults();
  }

  // 외부에서(보유 현황 변경 등) 필터 재적용 가능하도록 노출
  window.Endfield = window.Endfield || {};
  Endfield.applyFarmingFilters = () => filterWeapons();

  // ---- 보유 현황(ownedWeapons) 변경 시 자동 반영(무기별/지역별) ----
  const installOwnedWeaponsHook = () => {
    if (!STATE.ownedWeapons || typeof STATE.ownedWeapons.add !== 'function') return;
    if (STATE.__ownedWeaponsHooked) return;
    STATE.__ownedWeaponsHooked = true;

    const owned = STATE.ownedWeapons;
    const origAdd = owned.add.bind(owned);
    const origDel = owned.delete.bind(owned);
    const origClear = owned.clear.bind(owned);

    const refreshAll = () => {
      try { filterWeapons(); } catch (e) {}
      try { updateFarmingResults(); } catch (e) {}

      // 지역별 파밍지(선택된 지역이 있으면 요약/리스트 갱신)
      try {
        if (typeof STATE.__refreshRegionUI === 'function') STATE.__refreshRegionUI();
        else if (typeof STATE.__updateRegionResults === 'function') STATE.__updateRegionResults();
      } catch (e) {}
    };

    owned.add = (v) => { const r = origAdd(v); refreshAll(); return r; };
    owned.delete = (v) => { const r = origDel(v); refreshAll(); return r; };
    owned.clear = () => { origClear(); refreshAll(); };

    // 외부에서 강제로 갱신하고 싶을 때 사용
    Endfield.notifyOwnedWeaponsUpdated = refreshAll;
  };
  installOwnedWeaponsHook();


  // 초기 필터 적용
  filterWeapons();
}


function updateFarmingResults({ PLACES, STATE }) {
  // 추천 파밍지 탭의 무기 카드 owned 상태 갱신
  document.querySelectorAll('#grid-6star .weapon-card, #grid-5star .weapon-card').forEach(card => {
    const name = card.dataset.name;
    if (STATE.ownedWeapons.has(name)) card.classList.add('owned');
    else card.classList.remove('owned');
  });

  const selectedListContainer = document.getElementById('total-target-opts');
  const resultContainer = document.getElementById('farming-results-container');
  if (!selectedListContainer || !resultContainer) return;

  if (STATE.selectedWeapons.size === 0) {
    selectedListContainer.innerHTML = `<span style="color:#666; font-size:0.85em;">무기를 선택하면 상세 정보가 표시됩니다.</span>`;
    resultContainer.innerHTML = `<div style="text-align:center; padding: 40px; color:#666;">선택된 무기가 없습니다.</div>`;
    return;
  }

  selectedListContainer.innerHTML = Array.from(STATE.selectedWeapons).map(w => `
    <div style="background: rgba(255,255,255,0.05); padding:10px 12px; border-radius:6px; margin-bottom:6px; border-left:3px solid var(--gold);">
      <div style="font-weight:bold; font-size:0.9em; color:var(--gold);">${w.name} ${STATE.ownedWeapons.has(w.name) ? '<span style="color:var(--green)">(✔)</span>' : ''}</div>
      <div style="font-size:0.8em; color:#bbb; margin-top:2px;">필요: ${w.opts.join(', ')}</div>
    </div>
  `).join('');

  const results = PLACES.map(p => {
    const matchedWeapons = Array.from(STATE.selectedWeapons).filter(w => w.opts.every(opt => p.opts.includes(opt)));
    const optCountMap = {};
    matchedWeapons.forEach(w => w.opts.forEach(o => { optCountMap[o] = (optCountMap[o] || 0) + 1; }));
    return {
      name: p.name,
      matchedCount: matchedWeapons.length,
      weaponNames: matchedWeapons.map(w => w.name),
      optDetails: Object.entries(optCountMap).map(([name, count]) => ({ name, isDuplicate: count > 1 }))
    };
  }).sort((a,b) => b.matchedCount - a.matchedCount);

  resultContainer.innerHTML = results.map(r => `
    <div class="result-region-card ${r.matchedCount > 0 ? 'best' : ''}" style="flex-direction: column; align-items: flex-start; gap: 10px; padding: 15px;">
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center;">
        <strong style="font-size:1.1em; color:${r.matchedCount > 0 ? 'var(--primary)' : '#888'}">${r.name}</strong>
        <span style="background:var(--gold); color:#000; padding:2px 8px; border-radius:10px; font-size:0.75em; font-weight:bold;">${r.matchedCount}개 종결 가능</span>
      </div>
      ${r.matchedCount > 0 ? `
        <div style="width:100%; background:rgba(255,255,255,0.03); padding:10px; border-radius:6px; border: 1px solid #333;">
          <div style="font-size:0.75em; color:#aaa; margin-bottom:8px; font-weight:bold;">🎯 추천 파밍 옵션 (초록색: 겹침)</div>
          <div style="display:flex; flex-wrap:wrap; gap:5px;">
            ${r.optDetails.map(opt => `<span style="font-size:0.8em; padding:2px 8px; border-radius:4px; border:1px solid ${opt.isDuplicate ? '#28a745' : '#555'}; background:${opt.isDuplicate ? 'rgba(40, 167, 69, 0.2)' : '#222'}; color:${opt.isDuplicate ? '#2ecc71' : '#eee'};">${opt.name}</span>`).join('')}
          </div>
        </div>
        <div style="width:100%; font-size:0.85em; color:#ccc; line-height:1.4;"><span style="color:var(--primary); font-weight:bold;">📦 가능 무기:</span> ${r.weaponNames.join(', ')}</div>
      ` : `<div style="font-size:0.85em; color:#555; text-align:center; width:100%;">파밍 불가능</div>`}
    </div>
  `).join('');
}

function resetWeaponSelection({ STATE }, updateFarmingResultsFn) {
  document.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
  STATE.selectedWeapons.clear();
  updateFarmingResultsFn();
}

// -------- 지역별 파밍지 --------

function initRegionUI({ PLACES, selectRegion }) {
  const btnBox = document.getElementById('region-btns');
  if (!btnBox) return;
  btnBox.innerHTML = '';
  PLACES.forEach(p => {
    const btn = document.createElement('div');
    btn.className = 'region-btn';
    btn.textContent = p.name;
    btn.onclick = () => selectRegion(p);
    btnBox.appendChild(btn);
  });
}

function renderRegionSummary({ place, PRIMARY_STATS, WEAPONS_6, WEAPONS_5, STATE }) {
  // ---- 기본 상태(없으면 생성) ----
  if (typeof STATE.regionShow5Star !== 'boolean') STATE.regionShow5Star = false;  // 5성 표시(기본: 숨김)
  if (typeof STATE.regionHideOwned !== 'boolean') STATE.regionHideOwned = true;   // 종결(보유) 숨김(기본: 숨김 ON)

  // 5성 표시 여부에 따라 후보 무기 구성
  const candidates = STATE.regionShow5Star ? [...WEAPONS_6, ...WEAPONS_5] : [...WEAPONS_6];

  // 해당 지역에서 파밍 가능한 무기(지역 옵션 포함)만
  const regionWeapons = candidates.filter(w => w.opts.every(o => place.opts.includes(o)));

  // 미종결(보유 안함) 무기만 기준으로 추천 속성 산정
  const unfinished = regionWeapons.filter(w => !STATE.ownedWeapons.has(w.name));

  // ---- 추천 속성 산정(미종결 기준) ----
  const countMap = {};
  unfinished.forEach(w => w.opts.forEach(opt => { countMap[opt] = (countMap[opt] || 0) + 1; }));

  const baseRecs = Object.entries(countMap)
    .filter(([opt]) => PRIMARY_STATS.includes(opt))
    .sort((a,b) => b[1] - a[1])
    .slice(0,3)
    .map(v => v[0]);

  const extraRec = Object.entries(countMap)
    .filter(([opt]) => !PRIMARY_STATS.includes(opt))
    .sort((a,b) => b[1] - a[1])[0];

  // ---- "추천 속성 종결 기질 N개" = (추천 속성: 기본3+심화1) 기준으로 2개 이상 일치하는 '미종결' 무기 개수 ----
  const recFilter = [...baseRecs];
  if (extraRec && extraRec[0]) recFilter.push(extraRec[0]);

  const recFinishable = recFilter.length === 0
    ? []
    : unfinished.filter(w => w.opts.filter(o => recFilter.includes(o)).length >= 2);

  // 표시용 문구
  const baseTxt = baseRecs.join(', ') || '-';
  const extraTxt = extraRec ? extraRec[0] : '-';

  // 버튼 텍스트/색상은 selectRegionFactory에서 이벤트 바인딩하며 갱신
  return `
    <div style="margin-top:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid #333;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <div style="font-weight:bold; color:var(--primary);">📊 ${place.name} 요약</div>
        <div style="display:flex; gap:8px;">
          <button class="toggle-btn region-toggle-5star"></button>
          <button class="toggle-btn region-toggle-owned"></button>
        </div>
      </div>

      <div style="margin-top:6px;">
        미종결 <span style="color:var(--red); font-weight:bold;">${unfinished.length}</span>개 /
        추천 속성 종결 기질 <span style="color:var(--green); font-weight:bold;">${recFinishable.length}</span>개
      </div>

      <div style="margin-top:6px; font-size:0.9em;">
        추천 속성 (기본 <span style="color:var(--gold);">${baseTxt}</span> / 심화 <span style="color:var(--purple);">${extraTxt}</span>)
      </div>
    </div>
  `;
}


function selectRegionFactory(deps) {
  const { STATE, PRIMARY_STATS, EXTRA_STATS, renderRegionSummaryFn, updateRegionResultsFn } = deps;
  return function selectRegion(place) {
    STATE.selectedRegion = place;
    STATE.regionBases.clear();
    STATE.regionExtra = null;

    document.querySelectorAll('.region-btn').forEach(b => b.classList.toggle('active', b.textContent === place.name));

    const btnBox = document.getElementById('region-btns');
    const optionArea = document.getElementById('region-option-area');
    if (!btnBox || !optionArea) return;

    const oldSummary = document.getElementById('region-summary-box');
    if (oldSummary) oldSummary.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'region-summary-box';
    wrapper.innerHTML = renderRegionSummaryFn(place);

    // ---- 지역 요약 버튼(5성/종결) 바인딩 + 외부 갱신용 훅 저장 ----
    const bindRegionToggles = () => {
      const box = document.getElementById('region-summary-box');
      if (!box) return;

      const btn5 = box.querySelector('.region-toggle-5star');
      const btnOwned = box.querySelector('.region-toggle-owned');

      const applyBtnState = () => {
        if (btn5) {
          btn5.textContent = STATE.regionShow5Star ? '5성 표시' : '5성 숨김';
          btn5.style.background = STATE.regionShow5Star ? 'var(--green)' : 'var(--red)';
        }
        if (btnOwned) {
          btnOwned.textContent = STATE.regionHideOwned ? '종결 숨김' : '종결 표시';
          btnOwned.style.background = STATE.regionHideOwned ? 'var(--red)' : 'var(--green)';
        }
      };

      if (btn5) {
        btn5.onclick = () => {
          STATE.regionShow5Star = !STATE.regionShow5Star;
          refreshRegionUI();
        };
      }
      if (btnOwned) {
        btnOwned.onclick = () => {
          STATE.regionHideOwned = !STATE.regionHideOwned;
          refreshRegionUI();
        };
      }

      applyBtnState();
    };

    const refreshRegionUI = () => {
      // 요약/버튼 재렌더
      const box = document.getElementById('region-summary-box');
      if (box) box.innerHTML = renderRegionSummaryFn(place);

      // 버튼 다시 바인딩
      bindRegionToggles();

      // 결과 재계산
      updateRegionResultsFn();
    };

    // 외부(보유 현황 변경 등)에서 호출할 수 있도록 저장
    STATE.__refreshRegionUI = refreshRegionUI;
    STATE.__updateRegionResults = updateRegionResultsFn;

    // 먼저 DOM에 삽입한 뒤 버튼을 바인딩해야 최초 진입에서도 텍스트/색이 정상 적용됨
    btnBox.after(wrapper);
    bindRegionToggles();


    optionArea.style.display = 'block';
    optionArea.innerHTML = `
      <div class="option-filter-group">
        <div style="font-weight:bold; color:var(--primary);">기초 속성 (최대 3개)</div>
        <div id="base-opt-grid" class="opt-btn-grid"></div>
      </div>
      <div class="option-filter-group">
        <div style="font-weight:bold; color:var(--gold);">심화 속성 (추가/스킬 중 택 1)</div>
        <div style="font-size:0.8em; color:#888; margin-top:10px;">■ 추가 속성</div>
        <div id="extra-opt-grid" class="opt-btn-grid"></div>
        <div style="font-size:0.8em; color:#888; margin-top:10px;">■ 스킬 속성</div>
        <div id="skill-opt-grid" class="opt-btn-grid"></div>
      </div>
    `;

    const baseGrid = document.getElementById('base-opt-grid');
    const extraGrid = document.getElementById('extra-opt-grid');
    const skillGrid = document.getElementById('skill-opt-grid');

    place.opts.forEach(opt => {
      const btn = document.createElement('div');
      btn.className = 'opt-select-btn';
      btn.textContent = opt;

      if (PRIMARY_STATS.includes(opt)) {
        btn.onclick = () => {
          if (STATE.regionBases.has(opt)) STATE.regionBases.delete(opt);
          else if (STATE.regionBases.size < 3) STATE.regionBases.add(opt);
          btn.classList.toggle('active', STATE.regionBases.has(opt));
          updateRegionResultsFn();
        };
        baseGrid.appendChild(btn);
      } else {
        btn.onclick = () => {
          STATE.regionExtra = (STATE.regionExtra === opt) ? null : opt;
          document.querySelectorAll('#extra-opt-grid .opt-select-btn, #skill-opt-grid .opt-select-btn').forEach(b => b.classList.remove('active'));
          if (STATE.regionExtra) btn.classList.add('active');
          updateRegionResultsFn();
        };
        if (EXTRA_STATS.includes(opt)) extraGrid.appendChild(btn);
        else skillGrid.appendChild(btn);
      }
    });

    updateRegionResultsFn();
  };
}

function updateRegionResultsFactory(deps) {
  const { STATE, WEAPONS_6, WEAPONS_5, PRIMARY_STATS } = deps;

  return function updateRegionResults() {
    const resDiv = document.getElementById('region-results');
    if (!resDiv || !STATE.selectedRegion) return;

    const selectedRegion = STATE.selectedRegion;
    const filter = [...STATE.regionBases];
    if (STATE.regionExtra) filter.push(STATE.regionExtra);

    const matches = [...WEAPONS_6, ...(STATE.regionShow5Star ? WEAPONS_5 : [])]
      .filter(w => w.opts.every(o => selectedRegion.opts.includes(o)) && w.opts.some(o => filter.includes(o)) && !(STATE.hideOwned && STATE.ownedWeapons.has(w.name)))
      .map(w => {
        const is6 = WEAPONS_6.some(s => s.name === w.name);
        return {
          ...w,
          matchCount: w.opts.filter(o => filter.includes(o)).length,
          path: is6 ? '6성 무기' : '5성 무기',
          color: is6 ? 'var(--gold)' : 'var(--purple)',
          isOwned: STATE.ownedWeapons.has(w.name)
        };
      })
      .filter(m => !STATE.regionHideOwned || !m.isOwned)
      .sort((a,b) => {
        if (a.isOwned !== b.isOwned) return a.isOwned ? 1 : -1;
        return b.matchCount - a.matchCount;
      });

    if (matches.length === 0) {
      resDiv.innerHTML = "조건에 맞는 무기가 없습니다.";
      return;
    }

    resDiv.innerHTML = matches.map(m => {
      const starPrefix = m.path.includes('6성') ? '6성' : '5성';
      return `
        <div class="result-region-card ${m.matchCount === 3 ? 'best' : ''}" style="position:relative;">
          ${m.isOwned ? `<div class="owned-overlay"></div>` : ''}
          <div class="weapon-img-container" style="width:60px; height:60px; flex-shrink:0;">
            <img src="배경.png" class="layer bg-layer">
            <img src="${m.path}/${m.name.replace(/:/g,'')}.png" class="layer weapon-layer">
            <img src="${m.path}/${starPrefix} 하단.png" class="layer bottom-layer">
          </div>
          <div style="flex-grow:1; margin-left:12px;">
            <div style="display:flex; justify-content:space-between;">
              <span style="font-weight:bold; color:${m.color};">${m.name}</span>
              <span class="badge ${m.isOwned ? 'badge-complete' : ''}">${m.isOwned ? '종결' : `${m.matchCount}개 일치`}</span>
            </div>
            <div style="font-size:0.85em; color:#aaa; margin-top:4px;">
              ${m.opts.map(o => `<span style="${filter.includes(o) ? 'color:var(--primary); font-weight:bold;' : ''}">${o}</span>`).join(', ')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  };
}

function resetRegionFilters({ STATE }, selectRegionFn) {
  if (STATE.selectedRegion) selectRegionFn(STATE.selectedRegion);
}

window.Endfield = window.Endfield || {};
// ---- exports (safe) ----
Endfield.initFarmingUI = initFarmingUI;
Endfield.updateFarmingResults = updateFarmingResults;
Endfield.resetWeaponSelectionImpl = resetWeaponSelection;

Endfield.initRegionUI = (typeof initRegionUI === 'function') ? initRegionUI : undefined;
Endfield.renderRegionSummary = (typeof renderRegionSummary === 'function') ? renderRegionSummary : undefined;
Endfield.selectRegionFactory = (typeof selectRegionFactory === 'function') ? selectRegionFactory : undefined;
Endfield.updateRegionResultsFactory = (typeof updateRegionResultsFactory === 'function') ? updateRegionResultsFactory : undefined;
Endfield.resetRegionFiltersImpl = (typeof resetRegionFilters === 'function') ? resetRegionFilters : undefined;