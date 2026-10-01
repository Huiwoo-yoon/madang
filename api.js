// ===== 계정·저장소 (모든 게임이 같이 쓴다) =====
// CONFIG에 Supabase 정보가 있으면 온라인 DB, 없으면 이 브라우저(localStorage)에 저장한다.
// 두 모드 모두 같은 함수를 제공한다: restore, signUp, signIn, signOut, loadGame, save, leaderboard
// profile = { id, username, nickname, points, character, chars }   ← 모든 게임 공용
// 게임 저장 = { trophies, level, data }                            ← 게임마다 따로
const API = (() => {
  const online = !!(window.CONFIG && CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase);
  const ID_RE = /^[a-z0-9_]{3,16}$/;

  function check(username, password, nickname) {
    if (!ID_RE.test(username)) throw new Error('아이디는 영어 소문자·숫자·_ 로 3~16자예요.');
    if (password.length < 6) throw new Error('비밀번호는 6자 이상이에요.');
    if (nickname !== undefined && !(nickname.length >= 1 && nickname.length <= 10)) throw new Error('닉네임은 1~10자예요.');
  }

  if (online) {
    const sb = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    const email = (u) => `${u}@madang.game`; // 아이디를 Supabase 로그인용 이메일 모양으로 바꿈 (메일은 보내지 않음)
    const COLS = 'id, username, nickname, points, character, chars';
    let uid = null;

    async function loadProfile() {
      const { data, error } = await sb.from('madang_profiles').select(COLS).eq('id', uid).maybeSingle();
      if (error) throw error;
      return data;
    }
    return {
      online,
      async restore() {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return null;
        uid = session.user.id;
        return loadProfile();
      },
      async signUp(username, password, nickname) {
        check(username, password, nickname);
        const { data: res, error } = await sb.auth.signUp({ email: email(username), password });
        if (error) throw new Error(/registered|exists/i.test(error.message) ? '이미 있는 아이디예요. 다른 아이디를 골라요.' : error.message);
        if (!res.session) throw new Error('Supabase에서 "Confirm email"을 꺼야 해요 (README 참고).');
        uid = res.user.id;
        const { data: row, error: e2 } = await sb.from('madang_profiles')
          .insert({ id: uid, username, nickname }).select(COLS).single();
        if (e2) throw e2;
        return row;
      },
      async signIn(username, password) {
        const { data: res, error } = await sb.auth.signInWithPassword({ email: email(username), password });
        if (error) throw new Error('아이디나 비밀번호가 틀렸어요.');
        uid = res.user.id;
        const p = await loadProfile();
        if (!p) throw new Error('이 아이디의 저장 데이터가 없어요.');
        return p;
      },
      async signOut() { uid = null; await sb.auth.signOut(); },
      // 이 게임을 처음 하면 빈 저장을 만든다
      async loadGame(game) {
        const { data, error } = await sb.from('madang_saves').select('trophies, level, data')
          .eq('user_id', uid).eq('game', game).maybeSingle();
        if (error) throw error;
        if (data) return data;
        const { data: row, error: e2 } = await sb.from('madang_saves')
          .insert({ user_id: uid, game }).select('trophies, level, data').single();
        if (e2) throw e2;
        return row;
      },
      // 서버가 트로피·레벨을 고쳐서 저장할 수 있으므로(조작 방지) 저장된 값을 돌려준다
      async save(game, s) {
        const [prof, row] = await Promise.all([
          sb.from('madang_profiles').update({ points: s.points, character: s.character, chars: s.chars }).eq('id', uid),
          sb.from('madang_saves').update({ trophies: s.trophies, level: s.level, data: s.data })
            .eq('user_id', uid).eq('game', game).select('trophies, level').single(),
        ]);
        if (prof.error) throw prof.error;
        if (row.error) throw row.error;
        return row.data;
      },
      // game을 주면 그 게임 순위(트로피 → 레벨 순), 안 주면 모든 게임의 줄을 돌려준다
      async leaderboard(game) {
        let q = sb.from('madang_leaderboard').select('id, nickname, character, game, trophies, level');
        if (game) q = q.eq('game', game).order('trophies', { ascending: false }).order('level', { ascending: false }).limit(100);
        const { data, error } = await q;
        if (error) throw error;
        return data;
      },
      myId: () => uid,
    };
  }

  // ----- 이 컴퓨터 전용 모드 (config.js가 비었을 때) -----
  const KEY = 'madang.local';
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || null; } catch { db = null; }
  db = db || { users: {}, current: null };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  async function hash(username, pw) {
    const text = `madang:${username}:${pw}`;
    if (window.crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; // file:// 등 보안 컨텍스트가 아닐 때
    return 'x' + h;
  }
  const cur = () => db.users[db.current];
  const pub = (u) => ({ id: u.id, username: u.username, nickname: u.nickname, points: u.points, character: u.character, chars: u.chars });
  return {
    online,
    async restore() { return cur() ? pub(cur()) : null; },
    async signUp(username, password, nickname) {
      check(username, password, nickname);
      if (db.users[username]) throw new Error('이미 있는 아이디예요. 다른 아이디를 골라요.');
      db.users[username] = { id: 'local-' + username, username, nickname, points: 0, character: 'kid', chars: { kid: true }, saves: {}, pw: await hash(username, password) };
      db.current = username; persist();
      return pub(cur());
    },
    async signIn(username, password) {
      const u = db.users[username];
      if (!u || u.pw !== await hash(username, password)) throw new Error('아이디나 비밀번호가 틀렸어요.');
      db.current = username; persist();
      return pub(u);
    },
    async signOut() { db.current = null; persist(); },
    async loadGame(game) {
      const saves = cur().saves;
      if (!saves[game]) { saves[game] = { trophies: 0, level: 1, data: {} }; persist(); }
      return saves[game];
    },
    async save(game, s) {
      Object.assign(cur(), { points: s.points, character: s.character, chars: s.chars });
      cur().saves[game] = { trophies: s.trophies, level: s.level, data: s.data };
      persist();
      return { trophies: s.trophies, level: s.level };
    },
    async leaderboard(game) {
      const rows = Object.values(db.users).flatMap((u) => Object.entries(u.saves).map(([g, s]) =>
        ({ id: u.id, nickname: u.nickname, character: u.character, game: g, trophies: s.trophies, level: s.level })));
      if (!game) return rows;
      return rows.filter((r) => r.game === game).sort((a, b) => b.trophies - a.trophies || b.level - a.level);
    },
    myId: () => cur()?.id,
  };
})();
