/*
 * 스도쿠 엔진 (DOM/디자인과 무관한 순수 로직)
 * ------------------------------------------------------------
 *  Sudoku.parse(def)        -> 판 구조 { size, boxRows, boxCols, givens, solution }
 *  Sudoku.solve(grid, ...)  -> 정답 개수 세기 / 정답 구하기 (유일해 검사용)
 *  Sudoku.rate(grid, ...)   -> 사람이 푸는 기법으로 풀어 보고 필요한 최고 기법을 알려 줌
 *  new Sudoku.Game(board)   -> 입력·메모·채점·힌트·되돌리기·저장 상태 관리
 *
 *  격자(grid)는 길이 size*size 의 숫자 배열, 빈칸은 0.
 *  지원 크기: 4x4(2x2 상자), 6x6(2x3 상자), 9x9(3x3 상자)
 */
(function (root) {
  "use strict";

  var BOX = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };

  // ---------- 판 모양(행·열·상자) ----------
  var geoCache = {};
  function geometry(size) {
    if (geoCache[size]) return geoCache[size];
    var br = BOX[size][0], bc = BOX[size][1], units = [], peers = [], unitsOf = [];
    var i, r, c;
    for (r = 0; r < size; r++) { var row = []; for (c = 0; c < size; c++) row.push(r * size + c); units.push(row); }
    for (c = 0; c < size; c++) { var col = []; for (r = 0; r < size; r++) col.push(r * size + c); units.push(col); }
    for (var b = 0; b < size; b++) {
      var r0 = Math.floor(b / (size / bc)) * br, c0 = (b % (size / bc)) * bc, box = [];
      for (r = 0; r < br; r++) for (c = 0; c < bc; c++) box.push((r0 + r) * size + c0 + c);
      units.push(box);
    }
    for (i = 0; i < size * size; i++) { unitsOf.push([]); peers.push([]); }
    units.forEach(function (u, ui) { u.forEach(function (cell) { unitsOf[cell].push(ui); }); });
    for (i = 0; i < size * size; i++) {
      var set = {};
      unitsOf[i].forEach(function (ui) { units[ui].forEach(function (p) { if (p !== i) set[p] = true; }); });
      peers[i] = Object.keys(set).map(Number);
    }
    return (geoCache[size] = { size: size, boxRows: br, boxCols: bc, units: units, unitsOf: unitsOf, peers: peers,
      // 상자 단위만 (units 의 뒤쪽 size개)
      boxOf: function (cell) { return unitsOf[cell][2]; } });
  }

  // ---------- 문자열 <-> 격자 ----------
  // 문제 파일에서는 한 줄 = 한 행, 빈칸은 "." (또는 0)
  function parseRows(rows, size) {
    var s = (Array.isArray(rows) ? rows.join("") : String(rows)).replace(/\s+/g, "");
    if (s.length !== size * size) throw new Error("칸 수가 " + size * size + "개가 아니에요 (" + s.length + "개)");
    return Array.from(s).map(function (ch) {
      if (ch === "." || ch === "0") return 0;
      var n = parseInt(ch, 10);
      if (!(n >= 1 && n <= size)) throw new Error("쓸 수 없는 글자: " + ch);
      return n;
    });
  }
  function toRows(grid, size) {
    var out = [];
    for (var r = 0; r < size; r++) out.push(grid.slice(r * size, r * size + size).map(function (n) { return n || "."; }).join(""));
    return out;
  }

  // ---------- 규칙 위반 칸 찾기 ----------
  function conflicts(grid, size) {
    var g = geometry(size), bad = {};
    g.units.forEach(function (u) {
      var seen = {};
      u.forEach(function (cell) {
        var v = grid[cell]; if (!v) return;
        if (seen[v] !== undefined) { bad[cell] = true; bad[seen[v]] = true; } else seen[v] = cell;
      });
    });
    return Object.keys(bad).map(Number);
  }

  // ---------- 컴퓨터 풀이 (유일해 검사) ----------
  // limit 개까지 정답을 찾으면 멈춤. { count, solution }
  function solve(grid, size, limit) {
    var g = geometry(size), n = size * size, a = grid.slice(), count = 0, first = null;
    limit = limit || 2;
    if (conflicts(a, size).length) return { count: 0, solution: null };
    function cands(i) {
      var used = 0;
      g.peers[i].forEach(function (p) { if (a[p]) used |= 1 << a[p]; });
      var out = [];
      for (var v = 1; v <= size; v++) if (!(used & (1 << v))) out.push(v);
      return out;
    }
    (function rec() {
      if (count >= limit) return;
      var best = -1, bestC = null;
      for (var i = 0; i < n; i++) if (!a[i]) {
        var c = cands(i);
        if (!bestC || c.length < bestC.length) { best = i; bestC = c; if (c.length < 2) break; }
      }
      if (best < 0) { count++; if (!first) first = a.slice(); return; }
      for (var k = 0; k < bestC.length && count < limit; k++) { a[best] = bestC[k]; rec(); }
      a[best] = 0;
    })();
    return { count: count, solution: first };
  }

  // ---------- 사람 방식 풀이로 난이도 재기 ----------
  // 기법 단계: 1 naked single(빈칸에 들어갈 수 있는 숫자가 하나)
  //           2 hidden single(줄/상자에서 그 숫자가 갈 곳이 하나)
  //           3 locked candidates(상자-줄 겹침으로 후보 지우기)
  //           4 naked/hidden pair(두 칸에 두 숫자)
  //           5 이 기법들로 안 풀림 (더 고급 기법이나 추론 필요)
  var TECH_NAMES = { 1: "naked single", 2: "hidden single", 3: "locked candidates", 4: "pairs", 5: "advanced" };

  function rate(grid, size) {
    var g = geometry(size), n = size * size, a = grid.slice(), cand = [], maxTech = 0, steps = 0;
    var i, v;
    for (i = 0; i < n; i++) {
      cand.push(0);
      if (!a[i]) for (v = 1; v <= size; v++) cand[i] |= 1 << v;
    }
    function bits(m) { var o = []; for (var v = 1; v <= size; v++) if (m & (1 << v)) o.push(v); return o; }
    function cnt(m) { var c = 0; while (m) { m &= m - 1; c++; } return c; }
    function place(i, v) {
      a[i] = v; cand[i] = 0; steps++;
      g.peers[i].forEach(function (p) { cand[p] &= ~(1 << v); });
    }
    for (i = 0; i < n; i++) if (a[i]) g.peers[i].forEach(function (p) { cand[p] &= ~(1 << a[i]); });

    function nakedSingle() {
      for (var i = 0; i < n; i++) if (!a[i] && cnt(cand[i]) === 1) { place(i, bits(cand[i])[0]); return true; }
      return false;
    }
    function hiddenSingle() {
      for (var u = 0; u < g.units.length; u++) for (var v = 1; v <= size; v++) {
        var spots = g.units[u].filter(function (c) { return !a[c] && (cand[c] & (1 << v)); });
        if (spots.length === 1) { place(spots[0], v); return true; }
      }
      return false;
    }
    function locked() {
      var changed = false;
      for (var u = 0; u < g.units.length; u++) for (var v = 1; v <= size; v++) {
        var spots = g.units[u].filter(function (c) { return !a[c] && (cand[c] & (1 << v)); });
        if (spots.length < 2) continue;
        // 같은 숫자 후보가 모두 다른 하나의 단위에도 함께 들어 있으면, 그 단위의 나머지에서 지움
        for (var o = 0; o < g.units.length; o++) {
          if (o === u) continue;
          var other = g.units[o];
          if (!spots.every(function (c) { return other.indexOf(c) >= 0; })) continue;
          other.forEach(function (c) {
            if (spots.indexOf(c) < 0 && (cand[c] & (1 << v))) { cand[c] &= ~(1 << v); changed = true; }
          });
        }
      }
      return changed;
    }
    function pairs() {
      var changed = false;
      g.units.forEach(function (u) {
        var empty = u.filter(function (c) { return !a[c]; });
        // naked pair
        for (var x = 0; x < empty.length; x++) for (var y = x + 1; y < empty.length; y++) {
          var m = cand[empty[x]];
          if (cnt(m) === 2 && cand[empty[y]] === m) empty.forEach(function (c) {
            if (c !== empty[x] && c !== empty[y] && (cand[c] & m)) { cand[c] &= ~m; changed = true; }
          });
        }
        // hidden pair
        var where = {};
        for (var v = 1; v <= size; v++) where[v] = empty.filter(function (c) { return cand[c] & (1 << v); });
        for (var p = 1; p <= size; p++) for (var q = p + 1; q <= size; q++) {
          if (where[p].length === 2 && where[q].length === 2 &&
              where[p][0] === where[q][0] && where[p][1] === where[q][1]) {
            var keep = (1 << p) | (1 << q);
            where[p].forEach(function (c) { if (cand[c] & ~keep) { cand[c] &= keep; changed = true; } });
          }
        }
      });
      return changed;
    }

    var techs = [nakedSingle, hiddenSingle, locked, pairs];
    while (a.indexOf(0) >= 0) {
      var done = false;
      for (var t = 0; t < techs.length; t++) {
        if (techs[t]()) { maxTech = Math.max(maxTech, t + 1); done = true; break; }
      }
      if (!done) { maxTech = 5; break; }
    }
    return { tech: maxTech, techName: TECH_NAMES[maxTech] || "-", solvedByLogic: maxTech < 5, steps: steps };
  }

  // ---------- 문제 파일 한 항목 -> 판 구조 ----------
  function parse(def) {
    var size = def.size || 9;
    if (!BOX[size]) throw new Error(def.id + ": size는 4, 6, 9 중 하나");
    var givens;
    try { givens = parseRows(def.puzzle, size); } catch (e) { throw new Error(def.id + ": " + e.message); }
    var res = solve(givens, size, 2);
    if (res.count === 0) throw new Error(def.id + ": 풀 수 없는 문제예요");
    if (res.count > 1) throw new Error(def.id + ": 정답이 여러 개예요");
    var g = geometry(size);
    return {
      id: def.id, level: def.level, title: def.title || def.id,
      size: size, boxRows: g.boxRows, boxCols: g.boxCols,
      givens: givens, solution: res.solution,
      // 화면에서 굵은 선을 그을 때: 칸(r,c)이 상자의 오른쪽/아래 끝인지
      isBoxRight: function (c) { return (c + 1) % g.boxCols === 0 && c + 1 < size; },
      isBoxBottom: function (r) { return (r + 1) % g.boxRows === 0 && r + 1 < size; }
    };
  }

  // ---------- 게임 상태 ----------
  function Game(board) {
    this.board = board;
    this.listeners = [];
    this.reset();
  }

  Game.prototype = {
    reset: function () {
      var n = this.board.size * this.board.size;
      this.values = this.board.givens.slice();
      this.notes = new Array(n).fill(0);      // 메모: 비트마스크 (1<<숫자)
      this.revealed = new Array(n).fill(false);
      this.history = [];
      this.hintCount = 0;
      this.mistakes = 0;
      this.emit("reset");
    },
    on: function (fn) { this.listeners.push(fn); return this; },
    emit: function (type, data) {
      var self = this;
      this.listeners.forEach(function (fn) { fn(type, data, self); });
    },
    idx: function (r, c) { return r * this.board.size + c; },
    isGiven: function (r, c) { return this.board.givens[this.idx(r, c)] !== 0; },
    isLocked: function (r, c) { return this.isGiven(r, c) || this.revealed[this.idx(r, c)]; },
    get: function (r, c) { return this.values[this.idx(r, c)]; },
    getNotes: function (r, c) {
      var m = this.notes[this.idx(r, c)], out = [];
      for (var v = 1; v <= this.board.size; v++) if (m & (1 << v)) out.push(v);
      return out;
    },

    _snap: function (i) { this.history.push({ i: i, v: this.values[i], n: this.notes[i] }); },

    // 숫자 넣기 (0 = 지우기). 같은 줄/상자의 메모에서 그 숫자를 자동으로 지움
    set: function (r, c, v) {
      v = +v || 0;
      if (this.isLocked(r, c) || v < 0 || v > this.board.size) return false;
      var i = this.idx(r, c);
      if (this.values[i] === v) return false;
      this._snap(i);
      this.values[i] = v;
      this.notes[i] = 0;
      if (v) {
        var self = this;
        geometry(this.board.size).peers[i].forEach(function (p) {
          if (self.notes[p] & (1 << v)) { self._snap(p); self.history[self.history.length - 1].auto = true; self.notes[p] &= ~(1 << v); }
        });
        if (v !== this.board.solution[i]) this.mistakes++;
      }
      this.emit("change", { row: r, col: c, value: v });
      if (this.isSolved()) this.emit("solved", this.stats());
      return true;
    },
    // 메모 켜고 끄기
    toggleNote: function (r, c, v) {
      var i = this.idx(r, c);
      if (this.isLocked(r, c) || this.values[i] || v < 1 || v > this.board.size) return false;
      this._snap(i);
      this.notes[i] ^= 1 << v;
      this.emit("notes", { row: r, col: c, notes: this.getNotes(r, c) });
      return true;
    },
    // 되돌리기 (자동으로 지워진 메모까지 한 번에)
    undo: function () {
      var h;
      while ((h = this.history.pop())) {
        this.values[h.i] = h.v; this.notes[h.i] = h.n;
        if (!h.auto) break;
      }
      if (h) this.emit("undo", { index: h.i });
      return !!h;
    },

    // 채점: 칸별 "given" | "empty" | "correct" | "wrong"
    check: function (r, c) {
      var i = this.idx(r, c);
      if (this.board.givens[i]) return "given";
      if (!this.values[i]) return "empty";
      return this.values[i] === this.board.solution[i] ? "correct" : "wrong";
    },
    checkAll: function () {
      var out = [], s = this.board.size;
      for (var r = 0; r < s; r++) for (var c = 0; c < s; c++) out.push({ row: r, col: c, result: this.check(r, c) });
      return out;
    },
    // 규칙(같은 줄/상자에 같은 숫자)에 어긋난 칸 — 정답을 몰라도 보이는 실수
    conflicts: function () {
      var s = this.board.size;
      return conflicts(this.values, s).map(function (i) { return { row: Math.floor(i / s), col: i % s }; });
    },
    // 메모를 자동으로 채움 (가능한 숫자 전부)
    fillNotes: function () {
      var s = this.board.size, g = geometry(s), self = this;
      for (var i = 0; i < s * s; i++) {
        if (this.values[i]) continue;
        var m = 0;
        for (var v = 1; v <= s; v++) m |= 1 << v;
        g.peers[i].forEach(function (p) { if (self.values[p]) m &= ~(1 << self.values[p]); });
        this._snap(i); this.notes[i] = m;
      }
      this.emit("notes", null);
    },
    // 힌트: 지정한 칸(없으면 사람이 지금 풀 수 있는 칸)을 공개
    hint: function (r, c) {
      var s = this.board.size, i;
      if (r === undefined) {
        var spot = this.nextEasyCell();
        if (!spot) return null;
        r = spot.row; c = spot.col;
      }
      i = this.idx(r, c);
      if (this.isGiven(r, c)) return null;
      this.hintCount++;
      var h = this.history.length;
      this.set(r, c, this.board.solution[i]);
      this.history.length = h;          // 힌트는 되돌리기 대상이 아님
      this.revealed[i] = true;
      this.emit("reveal", { row: r, col: c, value: this.board.solution[i] });
      return { row: r, col: c, value: this.board.solution[i] };
    },
    // 지금 들어갈 숫자가 하나뿐인 칸 (아이에게 "여기를 봐" 하고 알려 주기 좋음)
    nextEasyCell: function () {
      var s = this.board.size, g = geometry(s), self = this, best = null, bestN = 99;
      for (var i = 0; i < s * s; i++) {
        if (this.values[i] === this.board.solution[i]) continue;
        var used = {};
        g.peers[i].forEach(function (p) { if (self.values[p] && self.values[p] === self.board.solution[p]) used[self.values[p]] = 1; });
        var k = s - Object.keys(used).length;
        if (k < bestN) { bestN = k; best = i; }
      }
      return best === null ? null : { row: Math.floor(best / s), col: best % s };
    },
    isSolved: function () {
      for (var i = 0; i < this.values.length; i++) if (this.values[i] !== this.board.solution[i]) return false;
      return true;
    },
    // 숫자별 남은 개수 (숫자 버튼에 표시하기 좋음)
    remaining: function () {
      var s = this.board.size, out = {};
      for (var v = 1; v <= s; v++) out[v] = s;
      this.values.forEach(function (v) { if (v) out[v]--; });
      return out;
    },
    stats: function () {
      var filled = this.values.filter(Boolean).length, given = this.board.givens.filter(Boolean).length;
      return { total: this.values.length - given, filled: filled - given, hints: this.hintCount, mistakes: this.mistakes };
    },
    serialize: function () {
      return { id: this.board.id, values: this.values, notes: this.notes, revealed: this.revealed,
        hints: this.hintCount, mistakes: this.mistakes };
    },
    restore: function (d) {
      if (!d || d.id !== this.board.id || !d.values || d.values.length !== this.values.length) return false;
      this.values = d.values; this.notes = d.notes; this.revealed = d.revealed;
      this.hintCount = d.hints || 0; this.mistakes = d.mistakes || 0; this.history = [];
      this.emit("restore");
      return true;
    }
  };

  var api = {
    parse: parse, solve: solve, rate: rate, conflicts: conflicts,
    parseRows: parseRows, toRows: toRows, geometry: geometry, Game: Game, BOX: BOX
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Sudoku = api;
})(this);
