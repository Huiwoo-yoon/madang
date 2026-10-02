// ===== 미니게임 공통 (스도쿠, 워드크로스) =====
// 미니게임은 하루에 한 번만 보상을 받는다. 받은 날짜는 그 미니게임의 저장(data.day)에 적는다.
// 포인트는 다른 놀이와 같이 쓰는 공용 프로필에 더한다.
const Mini = (() => {
  const $ = (id) => document.getElementById(id);
  let game, P, row, busy = false;

  // 이 기기 시간으로 오늘 날짜 'YYYY-MM-DD'
  function today() {
    const d = new Date(), two = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
  }
  // 날마다 1씩 커지는 수 (오늘의 문제를 고를 때 쓴다)
  const dayNumber = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const doneToday = () => row.data.day === today();

  function renderHeader() {
    $('hChar').innerHTML = Pixel.img(P.character, 2, true);
    $('hName').textContent = P.nickname;
    $('hPoints').textContent = P.points;
  }

  // 로그인 확인 + 이 미니게임의 저장 불러오기. 로그인이 안 되어 있으면 마당으로 보낸다
  async function start(g) {
    game = g;
    P = await API.restore();
    if (!P) { location.href = '../index.html'; return false; }
    row = await API.loadGame(game);
    renderHeader();
    $('homeBtn').onclick = () => (location.href = '../index.html');
    return true;
  }

  // 풀던 판을 이 브라우저에 저장한다. 계정·날짜별로 따로이고, 지난 날짜 것은 지운다
  function dayStore() {
    const mine = `madang.${game}:${API.myId()}:`, p = mine + today() + ':';
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(mine) && !k.startsWith(p)).forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
    return {
      get: (k) => { try { return localStorage.getItem(p + k); } catch (e) { return null; } },
      set: (k, v) => { try { localStorage.setItem(p + k, v); } catch (e) {} },
    };
  }

  // 다 풀었을 때: 오늘 처음이면 포인트를 주고 저장한다. 저장에 실패하면 다시 받기 버튼을 보여 준다
  async function finish(points, text) {
    if (busy || doneToday()) return;
    busy = true;
    $('retryBtn').hidden = true;
    const before = { points: P.points, data: row.data };
    P.points += points;
    row.data = { ...row.data, day: today(), count: (row.data.count || 0) + 1 };
    try {
      await API.save(game, { points: P.points, character: P.character, chars: P.chars, trophies: row.trophies, level: row.level, data: row.data });
      renderHeader();
      $('message').textContent = `🎉 ${text} +${points} 포인트! 내일 또 만나요.`;
      $('cheer').innerHTML = Pixel.img(P.character, 5);
    } catch (e) {
      P.points = before.points;
      row.data = before.data;
      $('message').textContent = '⚠️ 포인트를 저장하지 못했어요. 아래 버튼을 눌러 다시 받아요.';
      $('retryBtn').hidden = false;
      $('retryBtn').onclick = () => finish(points, text);
    }
    busy = false;
  }

  return { today, dayNumber, doneToday, start, dayStore, finish };
})();
