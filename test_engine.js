"use strict";

const M = require("./engine.js");

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  }
}

function glosses(word) {
  return M.analyze(word).analyses.map(function (a) { return a.gloss; }).sort();
}

function expectSet(word, list) {
  const got = glosses(word);
  const want = list.slice().sort();
  assert(JSON.stringify(got) === JSON.stringify(want), word + " => [" + got.join(", ") + "] wanted [" + want.join(", ") + "]");
}

expectSet("cats", ["cat/N +PL"]);
expectSet("hopping", ["hop/V +PROG"]);
expectSet("hoping", ["hope/V +PROG"]);
expectSet("hoped", ["hope/V +PAST", "hope/V +PP"]);
expectSet("leaves", ["leaf/N +PL", "leave/V +3SG"]);
expectSet("flies", ["fly/N +PL", "fly/V +3SG"]);
expectSet("books", ["book/N +PL", "book/V +3SG"]);
expectSet("walked", ["walk/V +PAST", "walk/V +PP"]);
expectSet("cities", ["city/N +PL"]);
expectSet("babies", ["baby/N +PL"]);
expectSet("foxes", ["fox/N +PL"]);
expectSet("buses", ["bus/N +PL"]);
expectSet("boxes", ["box/N +PL"]);
expectSet("churches", ["church/N +PL"]);
expectSet("kisses", ["kiss/N +PL"]);
expectSet("happier", ["happy/ADJ +COMP"]);
expectSet("happiest", ["happy/ADJ +SUPER"]);
expectSet("easiest", ["easy/ADJ +SUPER"]);
expectSet("bigger", ["big/ADJ +COMP"]);
expectSet("biggest", ["big/ADJ +SUPER"]);
expectSet("hotter", ["hot/ADJ +COMP"]);
expectSet("hottest", ["hot/ADJ +SUPER"]);
expectSet("redder", ["red/ADJ +COMP"]);
expectSet("taller", ["tall/ADJ +COMP"]);
expectSet("later", ["late/ADJ +COMP"]);
expectSet("latest", ["late/ADJ +SUPER"]);
expectSet("running", ["run/V +PROG"]);
expectSet("studies", ["study/V +3SG"]);
expectSet("studied", ["study/V +PAST", "study/V +PP"]);
expectSet("studying", ["study/V +PROG"]);
expectSet("tried", ["try/V +PAST", "try/V +PP"]);
expectSet("trying", ["try/V +PROG"]);
expectSet("loving", ["love/V +PROG"]);
expectSet("loved", ["love/V +PAST", "love/V +PP"]);
expectSet("loves", ["love/V +3SG"]);
expectSet("leaving", ["leave/V +PROG"]);
expectSet("children", ["child/N +PL"]);
expectSet("went", ["go/V +PAST"]);
expectSet("gone", ["go/V +PP"]);
expectSet("goes", ["go/V +3SG"]);
expectSet("going", ["go/V +PROG"]);
expectSet("ran", ["run/V +PAST"]);
expectSet("left", ["leave/V +PAST", "leave/V +PP"]);
expectSet("flew", ["fly/V +PAST"]);
expectSet("flown", ["fly/V +PP"]);
expectSet("is", ["be/V +3SG"]);
expectSet("was", ["be/V +PAST"]);
expectSet("been", ["be/V +PP"]);
expectSet("being", ["be/V +PROG"]);
expectSet("has", ["have/V +3SG"]);
expectSet("had", ["have/V +PAST", "have/V +PP"]);
expectSet("having", ["have/V +PROG"]);
expectSet("this", []);
expectSet("gos", []);
expectSet("goed", []);
expectSet("leaved", []);
expectSet("leafs", []);
expectSet("flied", []);
expectSet("runned", []);
expectSet("cax", []);

assert(glosses("run").indexOf("run/V +VB") !== -1 && glosses("run").indexOf("run/V +PP") !== -1, "run syncretism");
assert(M.analyze("leaves").ambiguity.indexOf("Two lemmas") === 0, "leaves kind");
assert(M.analyze("flies").ambiguity.indexOf("two parts") !== -1, "flies kind");
assert(M.analyze("walked").ambiguity.indexOf("feature") !== -1, "walked kind");

function verdict(word, stem, suffix) {
  const cut = M.analyze(word).cuts.filter(function (c) { return c.stem === stem && c.suffix === suffix; })[0];
  return cut ? cut.verdict : "missing";
}

assert(verdict("hoping", "hope", "ing") === "match", "hope+ing");
assert(verdict("hoping", "hop", "ing") === "listed", "hop+ing false friend");
assert(verdict("buses", "bus", "es") === "match", "bus+es");
assert(verdict("buses", "buse", "s") === "unknown", "buse");
assert(verdict("this", "thi", "s") === "unknown", "thi");
assert(verdict("went", "went", "ε") === "unknown", "went not a stem");
assert(M.analyze("flies").cuts.filter(function (c) { return c.stem === "fly" && c.suffix === "s"; })[0].paths === 2, "fly covers two paths");

const fsa = M.buildLexiconFsa(M.fragment);
assert(M.walkLexicon(fsa, "cat").accept, "cat");
assert(M.walkLexicon(fsa, "hop").accept && M.walkLexicon(fsa, "hop").continues.indexOf("hope") !== -1, "hop continues");
assert(M.walkLexicon(fsa, "hope").accept, "hope");
assert(!M.walkLexicon(fsa, "lea").accept, "lea prefix");
assert(M.walkLexicon(fsa, "cax").dead && M.walkLexicon(fsa, "cax").fail === "x", "cax");
M.fragment.forEach(function (word) {
  assert(M.walkLexicon(fsa, word).accept, word);
});

const tokens = M.tokenize("Mr. Smith's children aren't leaving. Dr. Lee's flies love running.");
const texts = tokens.tokens.map(function (t) { return t.text; });
assert(texts[0] === "Mr." && texts.indexOf("aren") === -1, "Mr. and aren't split, got " + texts.join(" "));
assert(texts.indexOf("are") !== -1 && texts.indexOf("n't") !== -1, "aren't");
assert(tokens.sentences.length === 2, "two sentences");
assert(tokens.tokens.filter(function (t) { return t.text === "'s" && t.ambiguous; }).length === 2, "two ambiguous clitics");

const kids = M.tokenize("The children's books aren't on the 6.30 bus.");
assert(kids.tokens.some(function (t) { return t.text === "children"; }), "children host");
assert(kids.tokens.some(function (t) { return t.text === "6.30" && t.type === "number"; }), "decimal");
assert(kids.sentences.length === 1, "decimal is not a sentence boundary");

const wont = M.tokenize("They won't go.");
assert(wont.tokens.some(function (t) { return t.text === "will"; }) && wont.tokens.some(function (t) { return t.text === "n't"; }), "won't");

if (!process.exitCode) {
  console.log("ok");
  console.log("lemmas", new Set(M.lexicon.map(function (e) { return e.lemma; })).size, "entries", M.lexicon.length);
  console.log("states", fsa.states, "letters", fsa.letters);
}
