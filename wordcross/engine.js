/*
 * 워드크로스 엔진 (DOM/디자인과 무관한 순수 로직)
 * ------------------------------------------------------------
 *  WordCross.buildPuzzle(def)  -> 퍼즐 구조(격자, 번호, 단어 위치)
 *  new WordCross.Game(puzzle)  -> 입력/채점/힌트 상태 관리
 *  WordCross.normalizeInput(lang, raw) -> 한 칸에 들어갈 글자로 정리
 *  WordCross.chosung(text)     -> "사과" -> "ㅅㄱ" (한글 힌트용)
 */
(function (root) {
  "use strict";

  var DIRS = { across: [0, 1], down: [1, 0] };
  var HANGUL_RE = /^[\uAC00-\uD7A3]$/;
  var ALPHA_RE = /^[A-Z]$/;
  var CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

  // ---------- 글자 단위 ----------
  function splitUnits(answer, lang) {
    var s = String(answer).normalize("NFC").replace(/\s+/g, "");
    if (lang === "en") s = s.toUpperCase();
    var units = Array.from(s);
    var re = lang === "ko" ? HANGUL_RE : ALPHA_RE;
    units.forEach(function (u) {
      if (!re.test(u)) throw new Error('"' + answer + '"에 쓸 수 없는 글자: ' + u);
    });
    return units;
  }

  function normalizeInput(lang, raw) {
    var s = String(raw || "").normalize("NFC").replace(/\s+/g, "");
    if (lang === "en") s = s.toUpperCase();
    var units = Array.from(s);
    var re = lang === "ko" ? HANGUL_RE : ALPHA_RE;
    for (var i = units.length - 1; i >= 0; i--) if (re.test(units[i])) return units[i];
    return "";
  }

  function chosung(text) {
    return Array.from(String(text)).map(function (ch) {
      var code = ch.charCodeAt(0) - 0xac00;
      return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : ch;
    }).join("");
  }

  // ---------- 자동 배치 ----------
  function key(r, c) { return r + "," + c; }

  function autoLayout(unitsList) {
    var n = unitsList.length;
    var grid = new Map(); // key -> { ch, across: idx|null, down: idx|null }
    var pos = new Array(n);
    var at = function (r, c) { return grid.get(key(r, c)); };

    function canPlace(units, r, c, dir, first) {
      var d = DIRS[dir], len = units.length, cross = 0;
      var side = dir === "across" ? [1, 0] : [0, 1];
      if (at(r - d[0], c - d[1]) || at(r + d[0] * len, c + d[1] * len)) return false;
      for (var i = 0; i < len; i++) {
        var rr = r + d[0] * i, cc = c + d[1] * i, cell = at(rr, cc);
        if (cell) {
          if (cell.ch !== units[i] || cell[dir] !== null) return false;
          cross++;
        } else if (at(rr + side[0], cc + side[1]) || at(rr - side[0], cc - side[1])) {
          return false;
        }
      }
      if (cross === len) return false;
      return first || cross > 0;
    }

    function place(idx, r, c, dir) {
      var d = DIRS[dir], units = unitsList[idx];
      for (var i = 0; i < units.length; i++) {
        var k = key(r + d[0] * i, c + d[1] * i);
        var cell = grid.get(k) || { ch: units[i], across: null, down: null };
        cell[dir] = idx;
        grid.set(k, cell);
      }
      pos[idx] = { row: r, col: c, dir: dir };
    }

    function unplace(idx) {
      var p = pos[idx], d = DIRS[p.dir];
      for (var i = 0; i < unitsList[idx].length; i++) {
        var k = key(p.row + d[0] * i, p.col + d[1] * i), cell = grid.get(k);
        cell[p.dir] = null;
        if (cell.across === null && cell.down === null) grid.delete(k);
      }
      pos[idx] = undefined;
    }

    function bounds() {
      var minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      grid.forEach(function (_, k) {
        var p = k.split(",").map(Number);
        minR = Math.min(minR, p[0]); maxR = Math.max(maxR, p[0]);
        minC = Math.min(minC, p[1]); maxC = Math.max(maxC, p[1]);
      });
      return { minR: minR, minC: minC, rows: maxR - minR + 1, cols: maxC - minC + 1 };
    }

    function candidates(idx) {
      var units = unitsList[idx], out = [], seen = {};
      grid.forEach(function (cell, k) {
        var p = k.split(",").map(Number);
        ["across", "down"].forEach(function (dir) {
          if (cell[dir] !== null) return;
          var d = DIRS[dir];
          units.forEach(function (u, j) {
            if (u !== cell.ch) return;
            var r = p[0] - d[0] * j, c = p[1] - d[1] * j, id = r + "," + c + dir;
            if (seen[id] || !canPlace(units, r, c, dir, false)) return;
            seen[id] = true;
            place(idx, r, c, dir);
            var b = bounds();
            unplace(idx);
            out.push({ r: r, c: c, dir: dir,
              score: b.rows * b.cols * 10 + Math.abs(b.rows - b.cols) });
          });
        });
      });
      out.sort(function (a, b) {
        return a.score - b.score || a.r - b.r || a.c - b.c || (a.dir < b.dir ? -1 : 1);
      });
      return out;
    }

    var remaining = [];
    for (var i = 1; i < n; i++) remaining.push(i);
    place(0, 0, 0, "across");

    function solve() {
      if (remaining.length === 0) return true;
      for (var i = 0; i < remaining.length; i++) {
        var idx = remaining[i], cands = candidates(idx);
        for (var j = 0; j < cands.length; j++) {
          remaining.splice(i, 1);
          place(idx, cands[j].r, cands[j].c, cands[j].dir);
          if (solve()) return true;
          unplace(idx);
          remaining.splice(i, 0, idx);
        }
      }
      return false;
    }

    if (!solve()) return null;
    var b = bounds();
    return pos.map(function (p) {
      return { row: p.row - b.minR, col: p.col - b.minC, dir: p.dir };
    });
  }

  // ---------- 퍼즐 구조 만들기 ----------
  function buildPuzzle(def) {
    var lang = def.lang;
    if (lang !== "ko" && lang !== "en") throw new Error(def.id + ": lang은 ko 또는 en");
    var unitsList = def.words.map(function (w) { return splitUnits(w.answer, lang); });

    var fixed = def.words.every(function (w) {
      return Number.isInteger(w.row) && Number.isInteger(w.col) && DIRS[w.dir];
    });
    var positions = fixed
      ? def.words.map(function (w) { return { row: w.row, col: w.col, dir: w.dir }; })
      : autoLayout(unitsList);
    if (!positions) throw new Error(def.id + ": 모든 단어를 엮을 수 없어요 (공통 글자 확인)");

    var rows = 0, cols = 0;
    positions.forEach(function (p, i) {
      var d = DIRS[p.dir], len = unitsList[i].length;
      rows = Math.max(rows, p.row + d[0] * (len - 1) + 1);
      cols = Math.max(cols, p.col + d[1] * (len - 1) + 1);
    });

    var cells = [];
    for (var r = 0; r < rows; r++) { cells.push(new Array(cols).fill(null)); }

    var words = def.words.map(function (w, i) {
      var p = positions[i], d = DIRS[p.dir], units = unitsList[i], wcells = [];
      units.forEach(function (u, j) {
        var rr = p.row + d[0] * j, cc = p.col + d[1] * j;
        var cell = cells[rr][cc];
        if (!cell) cell = cells[rr][cc] = { row: rr, col: cc, solution: u, number: null, across: null, down: null };
        else if (cell.solution !== u) throw new Error(def.id + ": (" + rr + "," + cc + ") 칸 글자 충돌");
        if (cell[p.dir] !== null) throw new Error(def.id + ": 같은 방향 단어가 겹침");
        cell[p.dir] = i;
        wcells.push([rr, cc]);
      });
      return {
        index: i, number: null, dir: p.dir, row: p.row, col: p.col,
        answer: units.join(""), units: units, length: units.length,
        clue: w.clue, emoji: w.emoji || "", cells: wcells
      };
    });

    // 번호 매기기: 위→아래, 왼→오른 순서로 단어 시작 칸에 번호
    var num = 0;
    for (r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var starts = words.filter(function (w) { return w.row === r && w.col === c; });
      if (starts.length) {
        num++;
        cells[r][c].number = num;
        starts.forEach(function (w) { w.number = num; });
      }
    }

    var order = function (a, b) { return a.number - b.number; };
    return {
      id: def.id, lang: lang, title: def.title || def.id,
      rows: rows, cols: cols, cells: cells, words: words,
      clues: {
        across: words.filter(function (w) { return w.dir === "across"; }).sort(order),
        down: words.filter(function (w) { return w.dir === "down"; }).sort(order)
      }
    };
  }

  // ---------- 게임 상태 ----------
  function Game(puzzle) {
    this.puzzle = puzzle;
    this.listeners = [];
    this.reset();
  }

  Game.prototype = {
    reset: function () {
      var p = this.puzzle;
      this.entries = p.cells.map(function (row) { return row.map(function (c) { return c ? "" : null; }); });
      this.revealed = p.cells.map(function (row) { return row.map(function () { return false; }); });
      this.hintCount = 0;
      this.emit("reset");
    },
    on: function (fn) { this.listeners.push(fn); return this; },
    emit: function (type, data) {
      var self = this;
      this.listeners.forEach(function (fn) { fn(type, data, self); });
    },
    isCell: function (r, c) { return !!(this.puzzle.cells[r] && this.puzzle.cells[r][c]); },
    getCell: function (r, c) { return this.isCell(r, c) ? this.entries[r][c] : null; },

    // 칸 입력. 저장된 글자를 돌려줌("" = 지움)
    setCell: function (r, c, raw) {
      if (!this.isCell(r, c) || this.revealed[r][c]) return this.getCell(r, c);
      var v = normalizeInput(this.puzzle.lang, raw);
      this.entries[r][c] = v;
      this.emit("change", { row: r, col: c, value: v });
      for (var i = 0; i < this.puzzle.words.length; i++) {
        var w = this.puzzle.words[i];
        if (this.wordHasCell(w, r, c) && this.isWordCorrect(w.index)) this.emit("wordSolved", w);
      }
      if (this.isSolved()) this.emit("solved", this.stats());
      return v;
    },

    wordHasCell: function (w, r, c) {
      return w.cells.some(function (p) { return p[0] === r && p[1] === c; });
    },
    wordsAt: function (r, c) {
      var cell = this.isCell(r, c) ? this.puzzle.cells[r][c] : null;
      if (!cell) return [];
      var ws = this.puzzle.words;
      return [cell.across, cell.down].filter(function (i) { return i !== null; })
        .map(function (i) { return ws[i]; });
    },

    // 칸별 채점: "empty" | "correct" | "wrong"
    checkCell: function (r, c) {
      var v = this.getCell(r, c);
      if (v === null) return null;
      if (v === "") return "empty";
      return v === this.puzzle.cells[r][c].solution ? "correct" : "wrong";
    },
    checkWord: function (index) {
      var self = this;
      return this.puzzle.words[index].cells.map(function (p) {
        return { row: p[0], col: p[1], result: self.checkCell(p[0], p[1]) };
      });
    },
    checkAll: function () {
      var out = [];
      for (var r = 0; r < this.puzzle.rows; r++) for (var c = 0; c < this.puzzle.cols; c++)
        if (this.isCell(r, c)) out.push({ row: r, col: c, result: this.checkCell(r, c) });
      return out;
    },
    isWordFilled: function (index) {
      return this.checkWord(index).every(function (x) { return x.result !== "empty"; });
    },
    isWordCorrect: function (index) {
      return this.checkWord(index).every(function (x) { return x.result === "correct"; });
    },
    isSolved: function () {
      return this.checkAll().every(function (x) { return x.result === "correct"; });
    },

    // 힌트: 단어에서 아직 틀리거나 빈 첫 칸 하나 공개
    revealOne: function (index) {
      var cells = this.puzzle.words[index].cells;
      for (var i = 0; i < cells.length; i++) {
        var r = cells[i][0], c = cells[i][1];
        if (this.checkCell(r, c) !== "correct") return this.revealCell(r, c);
      }
      return null;
    },
    revealCell: function (r, c) {
      if (!this.isCell(r, c)) return null;
      var sol = this.puzzle.cells[r][c].solution;
      this.hintCount++;
      this.setCell(r, c, sol);
      this.revealed[r][c] = true;
      this.emit("reveal", { row: r, col: c, value: sol });
      return { row: r, col: c, value: sol };
    },
    // 한글 퍼즐용: 단어의 초성 힌트 (예: ㅅㄱ)
    chosungHint: function (index) { return chosung(this.puzzle.words[index].answer); },

    // 커서 이동 도우미: 단어 안 다음/이전 칸
    nextCellInWord: function (index, r, c, step) {
      var cells = this.puzzle.words[index].cells;
      for (var i = 0; i < cells.length; i++) {
        if (cells[i][0] === r && cells[i][1] === c) {
          var n = cells[i + (step || 1)];
          return n ? { row: n[0], col: n[1] } : null;
        }
      }
      return null;
    },

    stats: function () {
      var total = 0, correct = 0;
      this.checkAll().forEach(function (x) { total++; if (x.result === "correct") correct++; });
      return { total: total, correct: correct, hints: this.hintCount };
    },

    // 저장/불러오기용
    serialize: function () {
      return { id: this.puzzle.id, entries: this.entries, revealed: this.revealed, hints: this.hintCount };
    },
    restore: function (data) {
      if (!data || data.id !== this.puzzle.id) return false;
      this.entries = data.entries; this.revealed = data.revealed; this.hintCount = data.hints || 0;
      this.emit("restore");
      return true;
    }
  };

  var api = {
    buildPuzzle: buildPuzzle, Game: Game,
    normalizeInput: normalizeInput, splitUnits: splitUnits, chosung: chosung
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.WordCross = api;
})(this);
