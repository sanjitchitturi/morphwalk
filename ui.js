"use strict";

(function () {
  const M = window.MorphWalk;
  const CHIPS = [
    ["leaves", "2 lemmas", "mix"],
    ["flies", "2 categories", "mix"],
    ["books", "noun or verb", "mix"],
    ["walked", "past or participle", "mix"],
    ["cats", "-s", ""],
    ["hopping", "doubling", ""],
    ["hoping", "e-deletion", ""],
    ["cities", "y → ie", ""],
    ["foxes", "-es", ""],
    ["happier", "y → i", ""],
    ["children", "irregular", ""],
    ["went", "irregular", ""],
    ["buses", "-es", ""],
    ["this", "reject", "bad"],
  ];
  const SAMPLES = [
    ["Abbreviations and clitics", "Mr. Smith's children aren't leaving. Dr. Lee's flies love running."],
    ["Numbers and possessives", "The children's books aren't on the 6.30 bus."],
  ];
  const TOUR = [
    {
      tab: "lexicon",
      probe: "cat",
      claim: "A finite-state lexicon is a trie. A double circle means accept.",
      say: "Start at q0. Arc c, arc a, arc t. The double circle means cat is in the language. Shared prefixes are shared states — that is how a finite-state lexicon is smaller than a list of strings.",
    },
    {
      tab: "lexicon",
      probe: "cax",
      claim: "No arc means reject. The string is outside the language.",
      say: "After c-a the only continuation is t. There is no arc labeled x, so the run falls into the sink. A finite-state automaton does not guess. It accepts or it rejects.",
    },
    {
      tab: "lexicon",
      probe: "hop",
      claim: "hop already accepts, and hope is one arc further.",
      say: "A state may accept and still have outgoing arcs. hop ends on a double circle, and the arc e builds hope. leaf and leave share lea, then branch. Building a lexicon means adding states.",
    },
    {
      tab: "parse",
      word: "cats",
      mode: "lex",
      claim: "A transducer writes an output. The last arc is s : +PL.",
      say: "An automaton would only accept cats. A transducer also writes the analysis. Letters of the stem are copied. The caret is the morpheme boundary. The last arc reads s and writes +PL. Morphotactics allows plural on a noun. One accepting path.",
    },
    {
      tab: "parse",
      word: "hopping",
      mode: "lex",
      claim: "Spelling rules are the arcs that do not copy.",
      say: "hop is a short CVC verb, so p doubles before -ing. The extra p is epsilon on the lexical side. Undo it and the stem is hop. The next word, leaves, is the ambiguity.",
    },
    {
      tab: "parse",
      word: "leaves",
      mode: "lex",
      claim: "Ambiguity means two accepting paths for one string.",
      say: "Path one undoes f → ves and finds the noun leaf, plural. Path two copies leave and writes third-person singular. Both stems are listed and both suffixes are legal, so both paths stay. The transducer does not pick a winner.",
    },
    {
      tab: "parse",
      word: "hoping",
      mode: "free",
      claim: "Drop the spelling rules and hop looks as good as hope.",
      say: "On the right, hope + ing matches a real path. hop + ing is also a listed verb stem, but that form is spelled hopping, with two p's. A lexicon-free rewriter only peels -ing. The orthographic transducer is what keeps the minimal pair apart. flies is the cousin of this: same spelling, two categories. Click it if you want that one.",
    },
    {
      tab: "parse",
      word: "went",
      mode: "lex",
      claim: "went is one irregular arc. A suffix stripper cannot see go.",
      say: "went is not go plus an ending. The lexicon stores a single arc from the whole word to go, past tense. Every lexicon-free cut underneath is red. A stemmer and a morphological parser are different machines.",
    },
    {
      tab: "tokens",
      claim: "Tokenization is a scan, and the clitic 's is ambiguous.",
      say: "Mr. keeps its period, so it does not end the sentence. aren't splits into are and n't. 's on Smith's and Lee's can be possessive, is, or has. The scanner emits the clitic and leaves the choice. The period after leaving is the sentence boundary. Click flies to jump back to the transducer — that word has two paths.",
    },
  ];

  const MORPHO = [
    {
      pos: "N",
      stem: "Noun",
      arcs: [
        { feat: "SG", arc: "ε", name: "+SG" },
        { feat: "PL", arc: "+s", name: "+PL" },
      ],
    },
    {
      pos: "V",
      stem: "Verb",
      arcs: [
        { feat: "VB", arc: "ε", name: "+VB" },
        { feat: "3SG", arc: "+s", name: "+3SG" },
        { feat: "PAST", arc: "+ed", name: "+PAST" },
        { feat: "PP", arc: "+ed", name: "+PP" },
        { feat: "PROG", arc: "+ing", name: "+PROG" },
      ],
    },
    {
      pos: "ADJ",
      stem: "Adj",
      arcs: [
        { feat: "POS", arc: "ε", name: "+POS" },
        { feat: "COMP", arc: "+er", name: "+COMP" },
        { feat: "SUPER", arc: "+est", name: "+SUPER" },
      ],
    },
  ];

  const state = {
    tab: "parse",
    word: "leaves",
    selected: 0,
    head: 999,
    mode: "lex",
    timer: null,
    tour: -1,
    showSay: false,
    probe: "hop",
    fsa: M.buildLexiconFsa(M.fragment),
  };
  let parsed = M.analyze(state.word);

  const els = {};
  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function stopPlay() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function syncParse() {
    parsed = M.analyze(state.word);
    if (state.selected >= parsed.analyses.length) state.selected = 0;
  }

  function selectedAnalysis() {
    return parsed.analyses[state.selected] || null;
  }

  function showTab(tab) {
    state.tab = tab;
    ["parse", "lexicon", "tokens"].forEach(function (name) {
      const on = name === tab;
      $("panel-" + name).hidden = !on;
      const button = $("tab-" + name);
      button.classList.toggle("on", on);
      button.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (location.hash !== "#" + tab) history.replaceState(null, "", "#" + tab);
  }

  function renderPlayhead() {
    const analysis = selectedAnalysis();
    const host = $("playhead");
    if (!analysis) {
      host.textContent = "";
      return;
    }
    const n = analysis.columns.length;
    if (state.head < 0) host.textContent = "At q0";
    else if (state.head >= n) host.textContent = "Full path";
    else host.textContent = "Symbol " + (state.head + 1) + " of " + n;
  }

  function markChips(root, attr, value) {
    root.querySelectorAll(".chip").forEach(function (button) {
      if (!button.hasAttribute(attr)) return;
      button.classList.toggle("on", button.getAttribute(attr) === value);
    });
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

  function markFor(index, head, active) {
    if (!active || head > 800) return "";
    if (index === head) return "now";
    if (index > head) return "ahead";
    return "seen";
  }

  function renderTape() {
    const host = $("tape");
    if (!parsed.analyses.length) {
      host.innerHTML = '<p class="steptext">No columns. Nothing in the lexicon generates this string.</p>';
      return;
    }
    host.innerHTML = parsed.analyses
      .map(function (analysis, index) {
        const active = index === state.selected;
        const head = active ? state.head : 999;
        const surface = analysis.columns
          .map(function (column, i) {
            return '<span class="' + tileClass(column, markFor(i, head, active)) + '">' + esc(column.s) + "</span>";
          })
          .join("");
        const lexical = analysis.columns
          .map(function (column, i) {
            return '<span class="' + tileClass(column, markFor(i, head, active)) + '">' + esc(column.l) + "</span>";
          })
          .join("");
        const arcs = analysis.columns
          .map(function (column, i) {
            const cls = "arc" + (column.changed ? " changed" : "") + (markFor(i, head, active) === "now" ? " now" : "");
            return '<span class="' + cls + '">' + esc(column.s + ":" + column.l) + "</span>";
          })
          .join("");
        return (
          '<div class="align' + (active ? " on" : "") + '" data-index="' + index + '">' +
          '<div class="align-title">Path ' + (index + 1) + " · " + esc(analysis.gloss) + "</div>" +
          '<div class="tape-row"><span class="row-label">surface</span>' + surface + "</div>" +
          '<div class="tape-row"><span class="row-label">lexical</span>' + lexical + "</div>" +
          (active ? '<div class="arcs">' + arcs + "</div>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  function stepSentence() {
    const analysis = selectedAnalysis();
    if (!analysis) {
      if (parsed.input && !/^[a-z]+$/.test(parsed.input)) {
        return "The transducer reads one word of letters. Use Tokenize for spaces and punctuation.";
      }
      return parsed.input
        ? "No accepting path. Checked " + parsed.candidates + " lexical candidates."
        : "Type a word.";
    }
    const n = analysis.columns.length;
    if (state.head < 0) return "Start at q0. The tape holds the surface string.";
    if (state.head < n) return columnSentence(analysis, state.head);
    const which = parsed.analyses.length > 1 ? "Path " + (state.selected + 1) + " of " + parsed.analyses.length + ". " : "";
    return which + analysis.ruleExplain;
  }

  function columnSentence(analysis, index) {
    const column = analysis.columns[index];
    if (column.boundary) return "Morpheme boundary. The stem is done; a suffix may follow.";
    if (column.s.length > 1) return "One arc reads “" + column.s + "” and writes " + column.l + ". Irregular forms skip the letter rules.";
    if (column.s === "ε") return "Nothing on the surface; the lexicon still has “" + column.l + "”. " + analysis.ruleTitle + ".";
    if (column.l === "ε") return "Read “" + column.s + "” and write epsilon. " + analysis.ruleTitle + ".";
    if (column.l.charAt(0) === "+") return "Read “" + column.s + "” and write " + column.l + ".";
    if (column.s !== column.l) return "Read “" + column.s + "”, write “" + column.l + "”. " + analysis.ruleTitle + ".";
    return "Read “" + column.s + "” and copy it to the output.";
  }

  function renderMorpho() {
    const analysis = selectedAnalysis();
    const finished = Boolean(analysis) && state.head >= analysis.columns.length;
    const others = parsed.analyses.filter(function (_, i) { return i !== state.selected; });
    function klass(pos, feat) {
      const bits = ["state"];
      if (feat) bits.push("yes");
      if (!finished) return bits.join(" ");
      if (pos === "q0") {
        bits.push(analysis ? "hot" : "also");
        return bits.join(" ");
      }
      const hot = analysis && analysis.pos === pos && (!feat || analysis.feat === feat);
      const also = others.some(function (item) {
        return item.pos === pos && (!feat || item.feat === feat);
      });
      if (hot) bits.push("hot");
      else if (also) bits.push("also");
      return bits.join(" ");
    }
    const rows = MORPHO.map(function (row) {
      const arcs = row.arcs
        .map(function (arc) {
          return '<span class="arrow">' + esc(arc.arc) + '</span><span class="' + klass(row.pos, arc.feat) + '">' + esc(arc.name) + "</span>";
        })
        .join("");
      return (
        '<div class="morpho-row">' +
        '<span class="' + klass("q0") + '">q0</span>' +
        '<span class="arrow">stem</span>' +
        '<span class="' + klass(row.pos) + '">' + esc(row.stem) + "</span>" +
        arcs +
        "</div>"
      );
    }).join("");
    $("morpho").innerHTML = rows;
  }

  function renderCards() {
    const host = $("cards");
    if (!parsed.analyses.length) {
      host.innerHTML = '<div class="card"><div class="gloss">reject</div><p class="plain">This string is not in the language of the transducer.</p></div>';
      return;
    }
    host.innerHTML = parsed.analyses
      .map(function (analysis, index) {
        return (
          '<button type="button" class="card' + (index === state.selected ? " on" : "") + '" data-index="' + index + '">' +
          '<div class="gloss">' + esc(analysis.gloss) + "</div>" +
          '<div class="plain">' + esc(analysis.posName) + " · " + esc(analysis.featPlain) + "</div>" +
          '<div class="rule">' + esc(analysis.ruleTitle) + "</div>" +
          "</button>"
        );
      })
      .join("");
  }

  function cutLabel(verdict, paths) {
    if (verdict === "match" && paths > 1) return "matches " + paths + " paths";
    if (verdict === "match") return "matches a path";
    if (verdict === "listed") return "stem listed, wrong shape";
    return "stem not listed";
  }

  function renderFree() {
    const cuts = parsed.cuts.slice(0, 6);
    if (!cuts.length) {
      $("free").innerHTML = "<p class=\"hint\">No cuts.</p>";
      return;
    }
    $("free").innerHTML = cuts
      .map(function (cut) {
        const suffix = cut.suffix === "ε" ? "ε" : "+" + cut.suffix;
        return (
          '<div class="cut ' + cut.verdict + '">' +
          "<strong>" + esc(cut.stem) + " " + esc(suffix) + "</strong>" +
          '<em class="mark">' + esc(cutLabel(cut.verdict, cut.paths)) + "</em>" +
          "<span>" + esc(cut.rule) + "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderBanner() {
    const banner = $("banner");
    banner.className = "banner";
    if (!parsed.input) {
      banner.textContent = "Type a word.";
      return;
    }
    const n = parsed.analyses.length;
    if (!n) {
      banner.classList.add("bad");
      banner.textContent = "Reject. No accepting path.";
      return;
    }
    if (n === 1) {
      banner.classList.add("good");
      banner.textContent = "One accepting path. " + parsed.analyses[0].gloss + ".";
      return;
    }
    banner.classList.add("mix");
    banner.textContent = n + " accepting paths. " + parsed.ambiguity;
  }

  function renderStatus() {
    const lemmas = new Set(M.lexicon.map(function (entry) { return entry.lemma; }));
    $("status").textContent =
      "Lexicon of " + lemmas.size + " lemmas, " + M.lexicon.length + " entries. Checked " +
      parsed.candidates + " paths, " + parsed.analyses.length + " accept.";
  }

  function renderDynamic() {
    $("panel-parse").classList.toggle("free-on", state.mode === "free");
    $("mode-lex").classList.toggle("on", state.mode === "lex");
    $("mode-free").classList.toggle("on", state.mode === "free");
    $("mode-lex").setAttribute("aria-pressed", state.mode === "lex" ? "true" : "false");
    $("mode-free").setAttribute("aria-pressed", state.mode === "free" ? "true" : "false");
    const disabled = !parsed.analyses.length;
    $("replay").disabled = disabled;
    $("step").disabled = disabled;
    renderPlayhead();
    markChips($("chips"), "data-word", state.word);
    renderBanner();
    renderStatus();
    renderTape();
    $("steptext").textContent = stepSentence();
    renderMorpho();
    renderCards();
    renderFree();
  }

  function shorten(x1, y1, x2, y2, r1, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    return [x1 + (dx / len) * r1, y1 + (dy / len) * r1, x2 - (dx / len) * r2, y2 - (dy / len) * r2];
  }

  function renderLexicon() {
    const fsa = state.fsa;
    const walk = M.walkLexicon(fsa, state.probe);
    const onNode = new Set(walk.nodes.map(function (node) { return node.id; }));
    const onEdge = new Set(walk.edges.map(function (edge) { return edge.from + ">" + edge.to; }));
    const byId = new Map(fsa.nodes.map(function (node) { return [node.id, node]; }));
    const extra = walk.dead ? 120 : 20;
    const edges = fsa.edges
      .map(function (edge) {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        const hot = onEdge.has(edge.from + ">" + edge.to);
        const r1 = a.accept ? 15 : a.depth === 0 ? 16 : 14;
        const r2 = b.accept ? 15 : 14;
        const line = shorten(a.x, a.y, b.x, b.y, r1, r2);
        const mx = (line[0] + line[2]) / 2;
        const my = (line[1] + line[3]) / 2 - 8;
        return (
          '<line x1="' + line[0] + '" y1="' + line[1] + '" x2="' + line[2] + '" y2="' + line[3] +
          '" stroke="' + (hot ? "#b85a0b" : "#1c1916") + '" stroke-width="' + (hot ? 3 : 1.5) + '" marker-end="url(#arrow)" />' +
          '<text x="' + mx + '" y="' + my + '" text-anchor="middle" font-size="13" fill="#5e574c">' + esc(edge.ch) + "</text>"
        );
      })
      .join("");
    const circles = fsa.nodes
      .map(function (node) {
        const hot = onNode.has(node.id);
        const r = node.depth === 0 ? 16 : 14;
        const fill = hot ? "#ffe8d2" : "#fffaf3";
        const stroke = node.accept ? "#1d6b45" : "#1c1916";
        const label = node.depth === 0 ? "q0" : node.ch;
        const ring = node.accept
          ? '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + (r + 4) + '" fill="none" stroke="' + stroke + '" stroke-width="1.5" />'
          : "";
        const tip = node.lemmas.length ? "<title>" + esc(node.lemmas.join(", ")) + "</title>" : "";
        return (
          ring +
          "<g>" + tip +
          '<circle cx="' + node.x + '" cy="' + node.y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" />' +
          '<text x="' + node.x + '" y="' + (node.y + 4) + '" text-anchor="middle" font-size="13" font-family="ui-monospace, monospace" fill="#1c1916">' + esc(label) + "</text>" +
          "</g>"
        );
      })
      .join("");
    let sink = "";
    if (walk.dead) {
      const last = walk.nodes[walk.nodes.length - 1];
      const x2 = last.x + 92;
      const y2 = last.y;
      const line = shorten(last.x, last.y, x2, y2, last.depth === 0 ? 16 : 14, 16);
      sink =
        '<line x1="' + line[0] + '" y1="' + line[1] + '" x2="' + line[2] + '" y2="' + line[3] + '" stroke="#9d2c2c" stroke-width="3" marker-end="url(#arrow-red)" />' +
        '<text x="' + ((line[0] + line[2]) / 2) + '" y="' + ((line[1] + line[3]) / 2 - 8) + '" text-anchor="middle" font-size="13" fill="#9d2c2c">' + esc(walk.fail) + "</text>" +
        '<circle cx="' + x2 + '" cy="' + y2 + '" r="16" fill="#fde8e4" stroke="#9d2c2c" stroke-width="2" />' +
        '<text x="' + x2 + '" y="' + (y2 + 4) + '" text-anchor="middle" font-size="14" fill="#9d2c2c">∅</text>';
    }
    $("trie").innerHTML =
      '<svg viewBox="0 0 ' + (fsa.width + extra) + " " + fsa.height + '" role="img">' +
      "<defs>" +
      '<marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#1c1916"/></marker>' +
      '<marker id="arrow-red" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="#9d2c2c"/></marker>' +
      "</defs>" +
      edges + circles + sink +
      "</svg>";

    const banner = $("probe-status");
    banner.className = "banner";
    if (!walk.word) {
      banner.textContent = "Type a stem from the fragment.";
    } else if (walk.dead) {
      banner.classList.add("bad");
      banner.textContent = "Reject at “" + walk.fail + "”. No arc is labeled " + walk.fail + ". " + walk.word + " is not in the language.";
    } else if (walk.accept && walk.continues.length) {
      banner.classList.add("good");
      banner.textContent = "Accept “" + walk.lemmas.join(", ") + "”. This state also continues to " + walk.continues.join(", ") + ".";
    } else if (walk.accept) {
      banner.classList.add("good");
      banner.textContent = "Accept “" + walk.lemmas.join(", ") + "”. The run ended on a double circle.";
    } else {
      banner.classList.add("bad");
      banner.textContent = "“" + walk.word + "” is only a prefix. The state it reached is not an accept state.";
    }
    $("fsa-stats").textContent =
      M.fragment.length + " stems contain " + fsa.letters + " letters and compile to " + fsa.states +
      " states, including the start state. Shared prefixes share states.";
    markChips($("fragment-chips"), "data-probe", state.probe);
  }

  function renderTokens() {
    const text = $("source").value;
    const result = M.tokenize(text);
    $("token-status").textContent = result.sentences.length + " sentences · " + result.tokens.length + " tokens.";
    $("token-view").innerHTML = result.sentences.length
      ? result.sentences
          .map(function (sentence, index) {
            const pills = sentence
              .map(function (token) {
                const cls = "pill " + token.type + (token.ambiguous ? " ambiguous" : "");
                if (token.type === "word") {
                  return '<button type="button" class="' + cls + '" data-type="word" data-text="' + esc(token.text) + '">' + esc(token.text) + "</button>";
                }
                return '<span class="' + cls + '">' + esc(token.text) + "</span>";
              })
              .join("");
            const notes = [];
            sentence.forEach(function (token) {
              if (token.note && notes.indexOf(token.note) === -1 && (token.ambiguous || token.type === "abbrev" || token.type === "end" || token.type === "clitic")) {
                notes.push(token.note);
              }
            });
            const note = notes.length ? '<p class="note">' + esc(notes.join(" · ")) + "</p>" : "";
            return '<section class="sentence"><h3>Sentence ' + (index + 1) + '</h3><div class="pills">' + pills + "</div>" + note + "</section>";
          })
          .join("")
      : '<p class="hint">Nothing to scan.</p>';
  }

  function renderTour() {
    const bar = $("tourbar");
    const running = state.tour >= 0;
    bar.hidden = !running;
    $("tour-btn").textContent = running ? "Exit tour" : "Start class tour";
    if (!running) return;
    const step = TOUR[state.tour];
    $("tour-kicker").textContent = "Step " + (state.tour + 1) + " of " + TOUR.length;
    $("tour-claim").textContent = step.claim;
    $("tour-say").textContent = step.say;
    $("tour-say").hidden = !state.showSay;
    $("say-btn").setAttribute("aria-expanded", state.showSay ? "true" : "false");
    $("say-btn").textContent = state.showSay ? "Hide script" : "What to say";
    $("tour-next").textContent = state.tour === TOUR.length - 1 ? "Finish" : "Next";
    $("tour-prev").disabled = state.tour === 0;
  }

  function render() {
    if (state.tab === "parse") renderDynamic();
    else if (state.tab === "lexicon") renderLexicon();
    else renderTokens();
    renderTour();
  }

  function applyTour() {
    const step = TOUR[state.tour];
    stopPlay();
    showTab(step.tab);
    if (step.word) {
      state.word = step.word;
      state.mode = step.mode || "lex";
      state.selected = 0;
      state.head = 999;
      $("word").value = step.word;
      syncParse();
    }
    if (step.probe) {
      state.probe = step.probe;
      $("probe").value = step.probe;
    }
    render();
  }

  function setWord(word) {
    stopPlay();
    state.word = word.trim().toLowerCase();
    state.selected = 0;
    state.head = 999;
    $("word").value = state.word;
    syncParse();
    showTab("parse");
    render();
  }

  function bind() {
    $("chips").innerHTML = CHIPS.map(function (chip) {
      return '<button type="button" class="chip ' + chip[2] + '" data-word="' + esc(chip[0]) + '">' + esc(chip[0]) + "<em>" + esc(chip[1]) + "</em></button>";
    }).join("");
    $("fragment-chips").innerHTML = M.fragment
      .map(function (word) {
        return '<button type="button" class="chip" data-probe="' + esc(word) + '">' + esc(word) + "</button>";
      })
      .join("") + '<button type="button" class="chip bad" data-probe="cax">cax<em>reject</em></button>';
    $("sample-chips").innerHTML = SAMPLES.map(function (sample, index) {
      return '<button type="button" class="chip" data-sample="' + index + '">' + esc(sample[0]) + "</button>";
    }).join("");

    $("chips").addEventListener("click", function (event) {
      const button = event.target.closest("[data-word]");
      if (!button) return;
      setWord(button.getAttribute("data-word"));
    });
    $("parse-form").addEventListener("submit", function (event) {
      event.preventDefault();
      setWord($("word").value);
    });
    $("mode-lex").addEventListener("click", function () {
      state.mode = "lex";
      renderDynamic();
    });
    $("mode-free").addEventListener("click", function () {
      state.mode = "free";
      renderDynamic();
      renderTour();
    });
    $("replay").addEventListener("click", function () {
      const analysis = selectedAnalysis();
      if (!analysis) return;
      stopPlay();
      state.head = -1;
      renderDynamic();
      state.timer = setInterval(function () {
        state.head += 1;
        renderTape();
        renderPlayhead();
        $("steptext").textContent = stepSentence();
        renderMorpho();
        if (state.head >= analysis.columns.length) stopPlay();
      }, 700);
    });
    $("step").addEventListener("click", function () {
      const analysis = selectedAnalysis();
      if (!analysis) return;
      stopPlay();
      if (state.head >= analysis.columns.length) state.head = -1;
      state.head += 1;
      renderTape();
      renderPlayhead();
      $("steptext").textContent = stepSentence();
      renderMorpho();
    });
    $("tape").addEventListener("click", function (event) {
      const align = event.target.closest(".align");
      if (!align) return;
      stopPlay();
      state.selected = Number(align.getAttribute("data-index"));
      state.head = 999;
      renderDynamic();
    });
    $("cards").addEventListener("click", function (event) {
      const card = event.target.closest(".card");
      if (!card || !card.hasAttribute("data-index")) return;
      stopPlay();
      state.selected = Number(card.getAttribute("data-index"));
      state.head = 999;
      renderDynamic();
    });

    $("tab-parse").addEventListener("click", function () { showTab("parse"); render(); });
    $("tab-lexicon").addEventListener("click", function () { showTab("lexicon"); render(); });
    $("tab-tokens").addEventListener("click", function () { showTab("tokens"); render(); });

    $("probe-form").addEventListener("submit", function (event) {
      event.preventDefault();
      state.probe = $("probe").value.trim().toLowerCase();
      $("probe").value = state.probe;
      renderLexicon();
    });
    $("fragment-chips").addEventListener("click", function (event) {
      const button = event.target.closest("[data-probe]");
      if (!button) return;
      state.probe = button.getAttribute("data-probe");
      $("probe").value = state.probe;
      showTab("lexicon");
      render();
    });

    $("source").addEventListener("input", renderTokens);
    $("sample-chips").addEventListener("click", function (event) {
      const button = event.target.closest("[data-sample]");
      if (!button) return;
      $("source").value = SAMPLES[Number(button.getAttribute("data-sample"))][1];
      renderTokens();
    });
    $("token-view").addEventListener("click", function (event) {
      const button = event.target.closest("button.pill");
      if (!button) return;
      setWord(button.getAttribute("data-text"));
    });

    $("tour-btn").addEventListener("click", function () {
      if (state.tour >= 0) {
        state.tour = -1;
        renderTour();
        return;
      }
      state.tour = 0;
      state.showSay = false;
      applyTour();
    });
    $("tour-next").addEventListener("click", function () {
      if (state.tour >= TOUR.length - 1) {
        state.tour = -1;
        renderTour();
        return;
      }
      state.tour += 1;
      applyTour();
    });
    $("tour-prev").addEventListener("click", function () {
      if (state.tour <= 0) return;
      state.tour -= 1;
      applyTour();
    });
    $("say-btn").addEventListener("click", function () {
      state.showSay = !state.showSay;
      renderTour();
    });
    document.addEventListener("keydown", function (event) {
      if (state.tour < 0) return;
      const tag = event.target && event.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        $("tour-next").click();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        $("tour-prev").click();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bind();
    const fromHash = location.hash.replace("#", "");
    if (fromHash === "lexicon" || fromHash === "tokens" || fromHash === "parse") showTab(fromHash);
    syncParse();
    render();
  });
})();
