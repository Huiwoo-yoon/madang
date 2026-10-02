// ===== 무서운 수학 (한밤의 문제집) =====
// 전통놀이(딱지치기, 투호)를 5분쯤 하면 귀신이 나타나 문제를 낸다. 맞힐 때까지 놀이로 돌아갈 수 없다.
// 놀이한 시간과 지금 걸린 문제는 계정별로 이 브라우저에 적어 두어서, 새로고침해도 풀리지 않는다.
// 쓰는 법: 놀이가 시작될 때 Scary.start(() => 지금 보스전인가)
const Scary = (() => {
  const PERIOD = 300; // 놀이를 이만큼(초) 하면 문제가 나온다
  const SWAP_AFTER = 3; // 이만큼 틀리면 '다른 문제로 바꾸기'가 나온다
  const GHOSTS = ['gwishin', 'dokkaebi', 'saja', 'skull', 'egg', 'gumiho']; // pixel.js의 귀신 그림
  const DATA = window.SCARY_DATA;

  // 주관식 정답 확인. 보통은 '답에 든 숫자가 차례대로 같으면' 정답이다 (예: "30개" ← "30").
  // 숫자만으로 안 되는 문제는 여기에 따로 적는다. t: 띄어쓰기를 없앤 소문자 글, n: 글 속의 숫자들, ph: 입력 칸 안내
  const sorted = (n) => [...n].sort((a, b) => a - b);
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const RULES = {
    q15: { ok: (t, n) => /^(5천|오천)/.test(t) || same(n, [5000]), ph: '예: 3천 원' },
    q21: { ok: (t) => t.includes('민아'), ph: '이름을 써요' },
    q30: { ok: (t) => /a사람b유령|b유령a사람/.test(t.replace(/[는은가이,.:=]/g, '')), ph: '예: A 유령, B 유령' },
    q31: { ok: (t) => t.includes('오른') && !t.includes('왼'), ph: '어느 쪽 문?' },
    q33: { ok: (t, n) => (/바[꾸꾼꿔꿀꿈]/.test(t) || n[0] === 2) && !/그대로|안바/.test(t), ph: '예: 그대로 1번 / 2번으로 바꾼다' },
    q35: { ok: (t) => t.includes('다윤'), ph: '이름을 써요' },
    q42: { ok: (t, n) => same(sorted(n), [2, 2, 9]), ph: '예: 1살, 4살, 9살' },
    q48: { ok: (t) => t.includes('섞'), ph: '어느 라벨이 붙은 상자?' },
    q50: { ok: (t, n) => same(sorted(n), [3, 4, 9, 10]), ph: '예: 1과 2 사이, 7과 8 사이' },
  };
  const nums = (s) => (s.replace(/(\d),(?=\d{3})/g, '$1').match(/\d+(\.\d+)?/g) || []).map(Number);
  function correct(p, text) {
    const t = text.replace(/\s/g, '').toLowerCase();
    return RULES[p.id] ? RULES[p.id].ok(t, nums(t)) : same(nums(t), nums(p.answer));
  }

  let key, st, inBoss, el = null, prob, tries;
  const save = () => { try { localStorage.setItem(key, JSON.stringify(st)); } catch (e) {} };

  function start(isBoss) {
    inBoss = isBoss;
    key = 'madang.scary:' + API.myId();
    try { st = JSON.parse(localStorage.getItem(key)); } catch (e) {}
    st = st || { t: 0, q: null }; // t: 놀이한 시간(초), q: 지금 걸려 있는 문제
    const locked = DATA.problems.find((p) => p.id === st.q);
    if (locked) open(locked);
    setInterval(tick, 1000);
    // 문제가 떠 있는 동안에는 키보드가 놀이에 닿지 않게 한다 (스페이스바로 치기 등)
    window.addEventListener('keydown', (e) => {
      if (!el) return;
      if (!el.contains(e.target)) e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  // 화면을 보고 있을 때만 시간이 간다. 문제가 떠 있는 동안에도 알바는 계속 벌기 때문에 포인트를 팝업에 보여 준다
  const showPoints = () => (el.querySelector('#scaryPoints').textContent = document.getElementById('hPoints').textContent);
  function tick() {
    if (el) return showPoints();
    if (document.hidden) return;
    st.t++;
    save();
    if (st.t >= PERIOD && !inBoss()) open(DATA.problems[Math.floor(Math.random() * DATA.problems.length)]);
  }

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); // **굵게**
  const paras = (list) => list.map((s) => `<p>${fmt(s)}</p>`).join('');
  const setInert = (on) => document.querySelectorAll('body > :not(.scary)').forEach((x) => (x.inert = on));

  function open(p) {
    prob = p;
    tries = 0;
    st.q = p.id;
    save();
    if (el) el.remove();
    const level = DATA.levels.find((l) => l.level === p.level);
    el = document.createElement('div');
    el.className = 'scary';
    el.innerHTML = `<div class="scary-box">
      <div class="scary-top" style="background-image: linear-gradient(#12061fd9, #2a0a2ecc), url(${Pixel.scene('yard')})">
        <div class="scary-ghost" id="scaryGhost">${Pixel.img(GHOSTS[p.number % GHOSTS.length], 4)}</div>
      </div>
      <div class="scary-night">🕯️ ${esc(DATA.title)} · ${esc(level.name)} · 💰 <b id="scaryPoints"></b></div>
      <h2>${esc(p.title)}</h2>
      <div class="scary-story">${paras(p.story)}</div>
      <p class="scary-q">${fmt(p.question)}</p>
      <div id="scaryBody">
        <form id="scaryForm">
          <input id="scaryInput" autocomplete="off" placeholder="${esc((RULES[p.id] || {}).ph || '답을 써요 (숫자만 써도 돼요)')}">
          <button class="btn danger">정답!</button>
        </form>
        <p id="scaryMsg" class="scary-msg">답을 맞혀야 놀이로 돌아갈 수 있어…</p>
        <p id="scaryHint" class="scary-hint" hidden>💡 ${fmt(p.hint)}</p>
        <button type="button" id="scarySwap" class="btn tiny" hidden>다른 문제로 바꾸기</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    setInert(true);
    showPoints();
    el.querySelector('#scaryForm').onsubmit = answer;
    el.querySelector('#scarySwap').onclick = () => open(DATA.problems.filter((x) => x.id !== p.id)[Math.floor(Math.random() * (DATA.problems.length - 1))]);
    el.querySelector('#scaryInput').focus();
  }

  function answer(ev) {
    ev.preventDefault();
    const input = el.querySelector('#scaryInput');
    if (!input.value.trim()) return;
    if (correct(prob, input.value)) return solved();
    tries++;
    input.value = '';
    input.focus();
    el.querySelector('#scaryMsg').textContent = `틀렸어… 귀신이 한 걸음 다가왔다. (${tries}번째)`;
    el.querySelector('#scaryHint').hidden = false;
    el.querySelector('#scarySwap').hidden = tries < SWAP_AFTER;
    el.querySelector('#scaryGhost').style.scale = Math.min(1.5, 1 + 0.15 * tries); // 틀릴수록 귀신이 가까이 온다
    const box = el.querySelector('.scary-box');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }

  function solved() {
    st = { t: 0, q: null };
    save();
    el.querySelector('#scaryGhost').style.scale = 0.7; // 귀신이 물러난다
    el.querySelector('#scaryBody').innerHTML = `
      <p class="scary-ok">⭕ 정답! ${esc(prob.answer)}</p>
      <div class="scary-explain">${paras(prob.explanation)}</div>
      <div class="scary-epilogue">${paras(prob.epilogue)}</div>
      <button type="button" id="scaryClose" class="btn primary">놀이로 돌아가기</button>`;
    el.querySelector('#scaryClose').onclick = close;
    el.querySelector('#scaryClose').focus();
  }

  function close() {
    el.remove();
    el = null;
    setInert(false);
  }

  return { start };
})();
