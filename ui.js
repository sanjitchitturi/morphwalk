"use strict";

(function () {
  const M = window.MorphWalk;
  const SAMPLES = [
    ["Leaves and flies", "The flies leave the wet leaves. Happy students studied harder. The children walked to school, and their teacher loves reading."],
    ["Names and clitics", "Mr. Smith's children aren't leaving. Dr. Lee's cat loves running."],
    ["Irregular verbs", "She said the bus leaves at 6.30. They were reading a good book."],
  ];
  const CLOSED_POS = { DET: 1, PRON: 1, P: 1, CONJ: 1, ADV: 1, PART: 1, POSS: 1, C: 1, MOD: 1 };

  const state = { doc: null, sentence: 0, token: 0, path: 0, head: 999, timer: null, sample: 0, wait: 0 };

  function $(id) { return document.getElementById(id); }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function currentToken() {
    const sentence = state.doc && state.doc.sentences[state.sentence];
    return sentence ? sentence.tokens[state.token] : null;
  }

  function analysesOf(token) {
    return token && token.parsed ? token.parsed.analyses : [];
  }

  function kind(token) {
    if (!token) return "punct";
    if (token.type === "end" || token.type === "punct" || token.type === "number" || token.type === "abbrev") return token.type;
    const list = analysesOf(token);
    if (!list.length) return "oov";
    if (list.length > 1) return "amb";
    if (CLOSED_POS[list[0].pos] && list[0].rule !== "listed") return "closed";
    return "word";
  }

  function glossLines(token) {
    const list = analysesOf(token);
    if (token.type === "end" || token.type === "punct") return [];
    if (token.type === "number") return ["number"];
    if (token.type === "abbrev") return ["abbreviation"];
    if (!list.length) return ["not in lexicon"];
    return list.map(function (item) { return item.gloss; });
  }

  function pickInteresting() {
    const sentences = state.doc.sentences;
    for (let s = 0; s < sentences.length; s++) {
      for (let t = 0; t < sentences[s].tokens.length; t++) {
        if (analysesOf(sentences[s].tokens[t]).length > 1) return { sentence: s, token: t };
      }
    }
    for (let s = 0; s < sentences.length; s++) {
      for (let t = 0; t < sentences[s].tokens.length; t++) {
        if (sentences[s].tokens[t].type === "word") return { sentence: s, token: t };
      }
    }
    return { sentence: 0, token: 0 };
  }

  function stopPlay() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function tileClass(column, mark) {
    const bits = ["tile"];
    if (column.boundary) bits.push("boundary");
    if (column.changed) bits.push("changed");
    const symbol = column.s.length >= column.l.length ? column.s : column.l;
    if (symbol.length > 3) bits.push("wide");
    if (column.s === "ε" || column.l === "ε") bits.push("eps");
    if (String(column.l).indexOf("+") !== -1) bits.push("tag");
    if (mark) bits.push(mark);
    return bits.join(" ");
  }

  function markFor(index) {
    if (state.head > 800) return "";
    if (index === state.head) return "now";
    if (index > state.head) return "ahead";
    return "";
  }

  function renderTape(analysis) {
    if (!analysis) return "";
    const surface = analysis.columns.map(function (column, i) {
      return '<span class="' + tileClass(column, markFor(i)) + '">' + esc(column.s) + "</span>";
    }).join("");
    const lexical = analysis.columns.map(function (column, i) {
      return '<span class="' + tileClass(column, markFor(i)) + '">' + esc(column.l) + "</span>";
    }).join("");
    return (
      '<div class="align">' +
      '<div class="align-title">' + esc(analysis.gloss) + "</div>" +
      '<div class="tape-row"><span class="row-label">surface</span>' + surface + "</div>" +
      '<div class="tape-row"><span class="row-label">lexical</span>' + lexical + "</div>" +
      "</div>"
    );
  }

  function stepSentence(analysis) {
    if (!analysis) return "";
    const n = analysis.columns.length;
    if (state.head < 0) return "Start state. The tape holds the surface token.";
    if (state.head < n) {
      const column = analysis.columns[state.head];
      if (column.s.length > 1 || column.l.indexOf("/") !== -1) return analysis.ruleExplain;
      if (column.boundary) return "Morpheme boundary. The stem is complete.";
      if (column.s === "ε") return "Nothing on the surface. The lexicon still has “" + column.l + "”.";
      if (column.l === "ε") return "Read “" + column.s + "” and write epsilon. " + analysis.ruleTitle + ".";
      if (column.l.charAt(0) === "+") return "Read “" + column.s + "” and write " + column.l + ".";
      if (column.s !== column.l) return "Read “" + column.s + "”, write “" + column.l + "”. " + analysis.ruleTitle + ".";
      return "Read “" + column.s + "” and copy it.";
    }
    return analysis.ruleExplain;
  }

  function renderStats() {
    const stats = state.doc.stats;
    $("stats").textContent =
      stats.sentences + " sentences · " +
      stats.tokens + " tokens · " +
      stats.ambiguous + " ambiguous · " +
      stats.unknown + " unknown";
  }

  function renderDoc() {
    $("doc").innerHTML = state.doc.sentences.map(function (sentence, s) {
      const units = sentence.tokens.map(function (token, t) {
        const sort = kind(token);
        const on = s === state.sentence && t === state.token;
        const gloss = glossLines(token).map(function (line) {
          return '<span class="g">' + esc(line) + "</span>";
        }).join("");
        if (token.type === "word" || token.type === "clitic") {
          return '<button type="button" class="unit ' + sort + (on ? " on" : "") + '" data-s="' + s + '" data-t="' + t + '"><span class="w">' + esc(token.text) + "</span>" + gloss + "</button>";
        }
        return '<span class="unit ' + sort + '"><span class="w">' + esc(token.text) + "</span>" + gloss + "</span>";
      }).join("");
      return '<article class="sent"><h3>Sentence ' + (s + 1) + '</h3><div class="units">' + units + "</div></article>";
    }).join("") || '<p class="hint">Nothing to analyze.</p>';
  }

  function renderInspector() {
    const token = currentToken();
    const host = $("inspector");
    if (!token) {
      host.innerHTML = "<h2>Reading</h2><p>Analyze a text to inspect a word.</p>";
      return;
    }
    const list = analysesOf(token);
    if (token.type === "abbrev" || token.type === "number" || token.type === "end" || token.type === "punct") {
      const copy = {
        abbrev: "Abbreviation. The period stays inside this token, so it does not end the sentence.",
        number: "Number. A decimal point stays inside the token.",
        end: "Sentence boundary.",
        punct: "Punctuation, separated from the word.",
      };
      host.innerHTML = "<h2>" + esc(token.text) + "</h2><p>" + copy[token.type] + "</p>";
      return;
    }
    if (!list.length) {
      host.innerHTML =
        "<h2>" + esc(token.text) + "</h2>" +
        '<p class="banner bad">No accepting path.</p>' +
        "<p>" + esc(token.text.toLowerCase()) + " is not in the lexicon, and no inflectional rule produces it. Names are left unknown on purpose.</p>";
      return;
    }
    if (state.path >= list.length) state.path = 0;
    const analysis = list[state.path];
    const n = analysis.columns.length;
    const where = state.head < 0 ? "At the start" : state.head >= n ? "Full path" : "Symbol " + (state.head + 1) + " of " + n;
    const bannerClass = list.length > 1 ? "mix" : "good";
    const banner = list.length > 1
      ? list.length + " readings. " + (token.parsed.ambiguity || "")
      : "One reading. " + analysis.gloss;
    const cards = list.map(function (item, index) {
      return '<button type="button" class="card' + (index === state.path ? " on" : "") + '" data-path="' + index + '">' +
        '<div class="gloss">' + esc(item.gloss) + "</div>" +
        '<div class="plain">' + esc(item.posName) + (item.featPlain && item.featPlain !== item.posName ? " · " + esc(item.featPlain) : "") + "</div>" +
        '<div class="rule">' + esc(item.ruleTitle) + "</div></button>";
    }).join("");
    host.innerHTML =
      "<h2>" + esc(token.text) + "</h2>" +
      '<p class="banner ' + bannerClass + '">' + esc(banner) + "</p>" +
      cards +
      renderTape(analysis) +
      '<p class="explain">' + esc(stepSentence(analysis)) + "</p>" +
      '<div class="controls"><button type="button" id="replay">Replay</button><button type="button" id="step">Step</button><span class="playhead">' + esc(where) + "</span></div>";
    $("replay").addEventListener("click", function () {
      stopPlay();
      state.head = -1;
      renderInspector();
      state.timer = setInterval(function () {
        state.head += 1;
        renderInspector();
        if (state.head >= n) stopPlay();
      }, 650);
    });
    $("step").addEventListener("click", function () {
      stopPlay();
      if (state.head >= n) state.head = -1;
      state.head += 1;
      renderInspector();
    });
    host.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("click", function () {
        stopPlay();
        state.path = Number(card.getAttribute("data-path"));
        state.head = 999;
        renderInspector();
      });
    });
  }

  function render() {
    renderStats();
    renderDoc();
    renderInspector();
    document.querySelectorAll("#samples .chip").forEach(function (button, index) {
      button.classList.toggle("on", index === state.sample);
    });
  }

  function analyze(force) {
    stopPlay();
    state.doc = M.analyzeDocument($("source").value);
    const sentence = state.doc.sentences[state.sentence];
    const still = sentence && sentence.tokens[state.token];
    if (force || !still) {
      const pick = pickInteresting();
      state.sentence = pick.sentence;
      state.token = pick.token;
      state.path = 0;
      state.head = 999;
    }
    render();
  }

  function glossExport() {
    return state.doc.sentences.map(function (sentence, index) {
      const words = sentence.tokens.map(function (token) { return token.text; }).join(" ");
      const gloss = sentence.tokens.map(function (token) {
        if (token.type === "punct" || token.type === "end") return token.text;
        return glossLines(token).join(" | ");
      }).join("  ");
      return "Sentence " + (index + 1) + "\n" + words + "\n" + gloss;
    }).join("\n\n");
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("samples").innerHTML = SAMPLES.map(function (sample, index) {
      return '<button type="button" class="chip" data-sample="' + index + '">' + esc(sample[0]) + "</button>";
    }).join("");
    $("form").addEventListener("submit", function (event) {
      event.preventDefault();
      state.sample = -1;
      analyze(true);
    });
    $("source").addEventListener("input", function () {
      state.sample = -1;
      clearTimeout(state.wait);
      state.wait = setTimeout(function () { analyze(false); }, 200);
    });
    $("samples").addEventListener("click", function (event) {
      const button = event.target.closest("[data-sample]");
      if (!button) return;
      state.sample = Number(button.getAttribute("data-sample"));
      $("source").value = SAMPLES[state.sample][1];
      analyze(true);
    });
    $("doc").addEventListener("click", function (event) {
      const unit = event.target.closest("button.unit");
      if (!unit) return;
      stopPlay();
      state.sentence = Number(unit.getAttribute("data-s"));
      state.token = Number(unit.getAttribute("data-t"));
      state.path = 0;
      state.head = 999;
      render();
    });
    $("copy").addEventListener("click", function () {
      const text = glossExport();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          $("copy").textContent = "Copied";
          setTimeout(function () { $("copy").textContent = "Copy gloss"; }, 1200);
        });
      }
    });
    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        analyze(true);
      }
    });
    analyze(true);
  });
})();
