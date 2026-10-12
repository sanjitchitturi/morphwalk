"use strict";

/*
 * MorphWalk
 * Finite-state morphological parser for English.
 * A lexicon of stems, a morphotactics table, and spelling rules define the
 * transducer. Parsing finds every (lemma, category, feature) whose surface
 * side equals the token. Closed-class words and clitics are listed forms.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.MorphWalk = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const POS_NAME = {
    N: "noun",
    V: "verb",
    ADJ: "adjective",
    DET: "determiner",
    PRON: "pronoun",
    P: "preposition",
    CONJ: "conjunction",
    ADV: "adverb",
    PART: "particle",
    POSS: "possessive",
    C: "complementizer",
    MOD: "modal",
  };
  const FEATS = {
    N: ["SG", "PL"],
    V: ["VB", "3SG", "PAST", "PP", "PROG"],
    ADJ: ["POS", "COMP", "SUPER"],
  };
  const FEAT_PLAIN = {
    SG: "singular",
    PL: "plural",
    VB: "base form",
    "3SG": "third-person singular",
    PAST: "past tense",
    PP: "past participle",
    PROG: "progressive",
    POS: "positive",
    COMP: "comparative",
    SUPER: "superlative",
  };
  const FEAT_TAG = {
    SG: "+SG",
    PL: "+PL",
    VB: "+VB",
    "3SG": "+3SG",
    PAST: "+PAST",
    PP: "+PP",
    PROG: "+PROG",
    POS: "+POS",
    COMP: "+COMP",
    SUPER: "+SUPER",
  };
  const POS_ORDER = {
    N: 0, V: 1, ADJ: 2, DET: 3, PRON: 4, P: 5, CONJ: 6, ADV: 7, PART: 8, POSS: 9, C: 10, MOD: 11,
  };
  const FEAT_ORDER = {
    SG: 0,
    PL: 1,
    VB: 0,
    "3SG": 1,
    PAST: 2,
    PP: 3,
    PROG: 4,
    POS: 0,
    COMP: 1,
    SUPER: 2,
    PRES: 5,
    CL: 6,
  };

  const LEXICON = [
    { lemma: "cat", pos: "N" },
    { lemma: "dog", pos: "N" },
    { lemma: "fox", pos: "N" },
    { lemma: "bus", pos: "N" },
    { lemma: "box", pos: "N" },
    { lemma: "kiss", pos: "N" },
    { lemma: "church", pos: "N" },
    { lemma: "city", pos: "N" },
    { lemma: "baby", pos: "N" },
    { lemma: "leaf", pos: "N", voiceF: true },
    { lemma: "child", pos: "N", irregular: { PL: "children" } },
    { lemma: "book", pos: "N" },
    { lemma: "book", pos: "V" },
    { lemma: "walk", pos: "N" },
    { lemma: "walk", pos: "V" },
    { lemma: "fly", pos: "N" },
    { lemma: "fly", pos: "V", irregular: { PAST: "flew", PP: "flown" } },
    { lemma: "talk", pos: "V" },
    { lemma: "love", pos: "V" },
    { lemma: "hope", pos: "V" },
    { lemma: "hop", pos: "V" },
    { lemma: "run", pos: "V", irregular: { PAST: "ran", PP: "run" } },
    { lemma: "leave", pos: "V", irregular: { PAST: "left", PP: "left" } },
    { lemma: "try", pos: "V" },
    { lemma: "study", pos: "V" },
    { lemma: "go", pos: "V", irregular: { PAST: "went", PP: "gone" } },
    { lemma: "be", pos: "V", irregular: { "3SG": "is", PAST: "was", PP: "been" } },
    { lemma: "have", pos: "V", irregular: { "3SG": "has", PAST: "had", PP: "had" } },
    { lemma: "big", pos: "ADJ" },
    { lemma: "happy", pos: "ADJ" },
    { lemma: "tall", pos: "ADJ" },
    { lemma: "easy", pos: "ADJ" },
    { lemma: "late", pos: "ADJ" },
    { lemma: "red", pos: "ADJ" },
    { lemma: "hot", pos: "ADJ" },
    { lemma: "wet", pos: "ADJ" },
    { lemma: "warm", pos: "ADJ" },
    { lemma: "hard", pos: "ADJ" },
    { lemma: "small", pos: "ADJ" },
    { lemma: "young", pos: "ADJ" },
    { lemma: "old", pos: "ADJ" },
    { lemma: "new", pos: "ADJ" },
    { lemma: "long", pos: "ADJ" },
    { lemma: "great", pos: "ADJ" },
    { lemma: "high", pos: "ADJ" },
    { lemma: "early", pos: "ADJ" },
    { lemma: "good", pos: "ADJ", irregular: { COMP: "better", SUPER: "best" } },
    { lemma: "bad", pos: "ADJ", irregular: { COMP: "worse", SUPER: "worst" } },
    { lemma: "student", pos: "N" },
    { lemma: "school", pos: "N" },
    { lemma: "teacher", pos: "N" },
    { lemma: "desk", pos: "N" },
    { lemma: "house", pos: "N" },
    { lemma: "day", pos: "N" },
    { lemma: "time", pos: "N" },
    { lemma: "hand", pos: "N" },
    { lemma: "story", pos: "N" },
    { lemma: "car", pos: "N" },
    { lemma: "bird", pos: "N" },
    { lemma: "room", pos: "N" },
    { lemma: "friend", pos: "N" },
    { lemma: "family", pos: "N" },
    { lemma: "girl", pos: "N" },
    { lemma: "boy", pos: "N" },
    { lemma: "home", pos: "N" },
    { lemma: "class", pos: "N" },
    { lemma: "course", pos: "N" },
    { lemma: "paper", pos: "N" },
    { lemma: "word", pos: "N" },
    { lemma: "person", pos: "N" },
    { lemma: "world", pos: "N" },
    { lemma: "name", pos: "N" },
    { lemma: "night", pos: "N" },
    { lemma: "morning", pos: "N" },
    { lemma: "week", pos: "N" },
    { lemma: "question", pos: "N" },
    { lemma: "answer", pos: "N" },
    { lemma: "water", pos: "N" },
    { lemma: "mother", pos: "N" },
    { lemma: "father", pos: "N" },
    { lemma: "work", pos: "N" },
    { lemma: "work", pos: "V" },
    { lemma: "read", pos: "V", irregular: { PAST: "read", PP: "read" } },
    { lemma: "want", pos: "V" },
    { lemma: "look", pos: "V" },
    { lemma: "ask", pos: "V" },
    { lemma: "need", pos: "V" },
    { lemma: "call", pos: "V" },
    { lemma: "help", pos: "V" },
    { lemma: "show", pos: "V" },
    { lemma: "play", pos: "V" },
    { lemma: "live", pos: "V" },
    { lemma: "watch", pos: "V" },
    { lemma: "open", pos: "V" },
    { lemma: "start", pos: "V" },
    { lemma: "learn", pos: "V" },
    { lemma: "seem", pos: "V" },
    { lemma: "use", pos: "V" },
    { lemma: "say", pos: "V", irregular: { PAST: "said", PP: "said" } },
    { lemma: "see", pos: "V", irregular: { PAST: "saw", PP: "seen" } },
    { lemma: "come", pos: "V", irregular: { PAST: "came", PP: "come", PROG: "coming" } },
    { lemma: "make", pos: "V", irregular: { PAST: "made", PP: "made" } },
    { lemma: "take", pos: "V", irregular: { PAST: "took", PP: "taken" } },
    { lemma: "know", pos: "V", irregular: { PAST: "knew", PP: "known" } },
    { lemma: "think", pos: "V", irregular: { PAST: "thought", PP: "thought" } },
    { lemma: "get", pos: "V", irregular: { PAST: "got", PP: "got" } },
    { lemma: "give", pos: "V", irregular: { PAST: "gave", PP: "given" } },
    { lemma: "find", pos: "V", irregular: { PAST: "found", PP: "found" } },
    { lemma: "tell", pos: "V", irregular: { PAST: "told", PP: "told" } },
    { lemma: "write", pos: "V", irregular: { PAST: "wrote", PP: "written" } },
    { lemma: "teach", pos: "V", irregular: { PAST: "taught", PP: "taught" } },
    { lemma: "keep", pos: "V", irregular: { PAST: "kept", PP: "kept" } },
    { lemma: "do", pos: "V", irregular: { "3SG": "does", PAST: "did", PP: "done" } },
  ];

  function closed(lemma, pos, plain) {
    return { lemma: lemma, pos: pos, plain: plain, gloss: lemma + "/" + pos, explain: lemma + " is a closed-class " + plain + ". The lexicon stores the whole word, and no inflection is added." };
  }

  const CLOSED = {
    the: [closed("the", "DET", "determiner")],
    a: [closed("a", "DET", "determiner")],
    an: [closed("an", "DET", "determiner")],
    this: [closed("this", "DET", "determiner")],
    that: [closed("that", "DET", "determiner"), closed("that", "C", "complementizer")],
    these: [closed("these", "DET", "determiner")],
    those: [closed("those", "DET", "determiner")],
    some: [closed("some", "DET", "determiner")],
    every: [closed("every", "DET", "determiner")],
    no: [closed("no", "DET", "determiner")],
    of: [closed("of", "P", "preposition")],
    to: [closed("to", "P", "preposition")],
    in: [closed("in", "P", "preposition")],
    on: [closed("on", "P", "preposition")],
    at: [closed("at", "P", "preposition")],
    for: [closed("for", "P", "preposition")],
    with: [closed("with", "P", "preposition")],
    from: [closed("from", "P", "preposition")],
    by: [closed("by", "P", "preposition")],
    into: [closed("into", "P", "preposition")],
    over: [closed("over", "P", "preposition")],
    after: [closed("after", "P", "preposition")],
    before: [closed("before", "P", "preposition")],
    about: [closed("about", "P", "preposition")],
    and: [closed("and", "CONJ", "conjunction")],
    or: [closed("or", "CONJ", "conjunction")],
    but: [closed("but", "CONJ", "conjunction")],
    if: [closed("if", "CONJ", "conjunction")],
    i: [closed("I", "PRON", "pronoun")],
    you: [closed("you", "PRON", "pronoun")],
    he: [closed("he", "PRON", "pronoun")],
    she: [closed("she", "PRON", "pronoun")],
    it: [closed("it", "PRON", "pronoun")],
    we: [closed("we", "PRON", "pronoun")],
    they: [closed("they", "PRON", "pronoun")],
    me: [closed("me", "PRON", "pronoun")],
    him: [closed("him", "PRON", "pronoun")],
    them: [closed("them", "PRON", "pronoun")],
    my: [closed("my", "DET", "possessive determiner")],
    your: [closed("your", "DET", "possessive determiner")],
    his: [closed("his", "DET", "possessive determiner")],
    her: [closed("her", "DET", "possessive determiner"), closed("her", "PRON", "pronoun")],
    its: [closed("its", "DET", "possessive determiner")],
    our: [closed("our", "DET", "possessive determiner")],
    their: [closed("their", "DET", "possessive determiner")],
    not: [closed("not", "PART", "negation")],
    very: [closed("very", "ADV", "adverb")],
    just: [closed("just", "ADV", "adverb")],
    so: [closed("so", "ADV", "adverb")],
    then: [closed("then", "ADV", "adverb")],
    than: [closed("than", "P", "preposition")],
    as: [closed("as", "P", "preposition")],
    up: [closed("up", "P", "preposition")],
    out: [closed("out", "P", "preposition")],
  };

  const EXTRA = [
    { surface: "are", lemma: "be", pos: "V", plain: "verb", feat: "PRES", featPlain: "present", gloss: "be/V +PRES", explain: "are is a suppletive present form of be. It is stored as a whole-word arc." },
    { surface: "am", lemma: "be", pos: "V", plain: "verb", feat: "PRES", featPlain: "present, first person", gloss: "be/V +1SG", explain: "am is a suppletive present form of be." },
    { surface: "were", lemma: "be", pos: "V", plain: "verb", feat: "PAST", featPlain: "past, plural", gloss: "be/V +PAST.PL", explain: "were is the past plural of be. was is the past singular." },
  ];

  const CLITICS = {
    "n't": [{ lemma: "not", pos: "PART", plain: "negation", gloss: "not/PART", explain: "n't is the contracted form of not." }],
    "'s": [
      { lemma: "'s", pos: "POSS", plain: "possessive", gloss: "'s/POSS", explain: "'s can be the possessive clitic, as in Smith's." },
      { lemma: "be", pos: "V", plain: "verb", feat: "3SG", featPlain: "clitic of is", gloss: "be/V +3SG", explain: "'s can be a reduced form of is." },
      { lemma: "have", pos: "V", plain: "verb", feat: "3SG", featPlain: "clitic of has", gloss: "have/V +3SG", explain: "'s can be a reduced form of has." },
    ],
    "'re": [{ lemma: "be", pos: "V", plain: "verb", feat: "PRES", featPlain: "clitic of are", gloss: "be/V +PRES", explain: "'re is the clitic form of are." }],
    "'ve": [{ lemma: "have", pos: "V", plain: "verb", feat: "VB", featPlain: "clitic of have", gloss: "have/V +VB", explain: "'ve is the clitic form of have." }],
    "'ll": [{ lemma: "will", pos: "MOD", plain: "modal", gloss: "will/MOD", explain: "'ll is the clitic form of will." }],
    "'m": [{ lemma: "be", pos: "V", plain: "verb", feat: "PRES", featPlain: "clitic of am", gloss: "be/V +1SG", explain: "'m is the clitic form of am." }],
    "'d": [
      { lemma: "would", pos: "MOD", plain: "modal", gloss: "would/MOD", explain: "'d can be the modal would." },
      { lemma: "have", pos: "V", plain: "verb", feat: "PAST", featPlain: "clitic of had", gloss: "have/V +PAST", explain: "'d can be a reduced form of had." },
    ],
  };

  const FRAGMENT = [
    "big",
    "book",
    "box",
    "bus",
    "cat",
    "fly",
    "hop",
    "hope",
    "leaf",
    "leave",
    "love",
    "run",
    "walk",
  ];

  function isConsonant(ch) {
    return "bcdfghjklmnpqrstvwxyz".includes(ch);
  }

  function isVowel(ch) {
    return "aeiou".includes(ch);
  }

  function cvc(lemma) {
    if (lemma.length < 3) return false;
    const a = lemma[lemma.length - 3];
    const b = lemma[lemma.length - 2];
    const c = lemma[lemma.length - 1];
    if (!isConsonant(a) || !isVowel(b) || !isConsonant(c)) return false;
    if ("wxy".includes(c)) return false;
    if (lemma[lemma.length - 1] === lemma[lemma.length - 2]) return false;
    const groups = lemma.match(/[aeiou]+/g);
    return Boolean(groups && groups.length === 1);
  }

  function yAfterConsonant(lemma) {
    return lemma.length > 1 && lemma.endsWith("y") && isConsonant(lemma[lemma.length - 2]);
  }

  function silentE(lemma) {
    if (!lemma.endsWith("e")) return false;
    if (lemma.endsWith("ee") || lemma.endsWith("oe") || lemma.endsWith("ye")) return false;
    if (lemma === "be") return false;
    return true;
  }

  function sibilant(lemma) {
    return /(s|z|x|ch|sh)$/.test(lemma);
  }

  function col(s, l) {
    return { s: s, l: l, changed: s !== l, boundary: s === "^" && l === "^" };
  }

  function letters(word) {
    return word.split("").map(function (ch) {
      return col(ch, ch);
    });
  }

  function boundary() {
    return col("^", "^");
  }

  function surfaceOf(columns) {
    return columns
      .map(function (c) {
        if (c.boundary || c.s === "ε" || c.s === "^") return "";
        return c.s;
      })
      .join("");
  }

  function zero(lemma, feat, title, explain) {
    return {
      rule: feat === "PP" ? "syncretism" : "zero",
      ruleTitle: title,
      ruleExplain: explain,
      columns: letters(lemma).concat([boundary(), col("ε", FEAT_TAG[feat])]),
    };
  }

  function addS(lemma, feat) {
    const tag = FEAT_TAG[feat];
    const kind = feat === "PL" ? "plural" : "third-person";
    if (sibilant(lemma)) {
      return {
        rule: "epenthesis",
        ruleTitle: "Epenthetic e",
        ruleExplain:
          lemma +
          " ends in a sibilant, so the " +
          kind +
          " suffix is -es. The e is inserted; it is epsilon on the lexical side.",
        columns: letters(lemma).concat([boundary(), col("e", "ε"), col("s", tag)]),
      };
    }
    if (yAfterConsonant(lemma)) {
      return {
        rule: "y-ie",
        ruleTitle: "y → ie",
        ruleExplain:
          "The y in " +
          lemma +
          " follows a consonant, so it becomes i and an e is inserted before -s.",
        columns: letters(lemma.slice(0, -1)).concat([
          col("i", "y"),
          boundary(),
          col("e", "ε"),
          col("s", tag),
        ]),
      };
    }
    return {
      rule: "s",
      ruleTitle: "Add -s",
      ruleExplain: "The stem is copied. One arc reads s and writes " + tag + ".",
      columns: letters(lemma).concat([boundary(), col("s", tag)]),
    };
  }

  function addEd(lemma, feat) {
    const tag = FEAT_TAG[feat];
    if (yAfterConsonant(lemma)) {
      return {
        rule: "y-i",
        ruleTitle: "y → i",
        ruleExplain: "Before -ed, the y in " + lemma + " becomes i.",
        columns: letters(lemma.slice(0, -1)).concat([
          col("i", "y"),
          boundary(),
          col("e", "e"),
          col("d", tag),
        ]),
      };
    }
    if (silentE(lemma)) {
      return {
        rule: "e-already",
        ruleTitle: "Stem already ends in e",
        ruleExplain: lemma + " already ends in e, so the past suffix adds only d.",
        columns: letters(lemma).concat([boundary(), col("d", tag)]),
      };
    }
    if (cvc(lemma)) {
      const last = lemma[lemma.length - 1];
      return {
        rule: "doubling",
        ruleTitle: "Consonant doubling",
        ruleExplain:
          lemma +
          " is a short CVC syllable, so " +
          last +
          " doubles before -ed. The extra letter maps to epsilon.",
        columns: letters(lemma).concat([
          col(last, "ε"),
          boundary(),
          col("e", "e"),
          col("d", tag),
        ]),
      };
    }
    return {
      rule: "ed",
      ruleTitle: "Add -ed",
      ruleExplain: "The stem is copied and -ed is concatenated. This shape is shared by past tense and the past participle.",
      columns: letters(lemma).concat([boundary(), col("e", "e"), col("d", tag)]),
    };
  }

  function addIng(lemma) {
    const tag = "+PROG";
    if (silentE(lemma)) {
      return {
        rule: "e-deletion",
        ruleTitle: "e-deletion",
        ruleExplain:
          "The silent e of " +
          lemma +
          " is deleted before -ing. Parsing puts that e back on the lexical row.",
        columns: letters(lemma.slice(0, -1)).concat([
          col("ε", "e"),
          boundary(),
          col("i", "i"),
          col("n", "n"),
          col("g", tag),
        ]),
      };
    }
    if (cvc(lemma)) {
      const last = lemma[lemma.length - 1];
      return {
        rule: "doubling",
        ruleTitle: "Consonant doubling",
        ruleExplain:
          lemma +
          " is a short CVC verb, so " +
          last +
          " doubles before -ing. The extra letter is epsilon in the lexicon.",
        columns: letters(lemma).concat([
          col(last, "ε"),
          boundary(),
          col("i", "i"),
          col("n", "n"),
          col("g", tag),
        ]),
      };
    }
    return {
      rule: "ing",
      ruleTitle: "Add -ing",
      ruleExplain: "The stem is copied and -ing is concatenated. Morphotactics allows -ing only on a verb.",
      columns: letters(lemma).concat([
        boundary(),
        col("i", "i"),
        col("n", "n"),
        col("g", tag),
      ]),
    };
  }

  function addDegree(lemma, feat) {
    const suf = feat === "COMP" ? "er" : "est";
    const tag = FEAT_TAG[feat];
    const sufCols = suf.split("").map(function (ch, i, arr) {
      return col(ch, i === arr.length - 1 ? tag : ch);
    });
    if (yAfterConsonant(lemma)) {
      return {
        rule: "y-i",
        ruleTitle: "y → i",
        ruleExplain: "Before -" + suf + ", the y in " + lemma + " becomes i.",
        columns: letters(lemma.slice(0, -1)).concat([col("i", "y"), boundary()].concat(sufCols)),
      };
    }
    if (silentE(lemma)) {
      return {
        rule: "e-deletion",
        ruleTitle: "e-deletion",
        ruleExplain: "The silent e of " + lemma + " is deleted before -" + suf + ".",
        columns: letters(lemma.slice(0, -1)).concat([col("ε", "e"), boundary()].concat(sufCols)),
      };
    }
    if (cvc(lemma)) {
      const last = lemma[lemma.length - 1];
      return {
        rule: "doubling",
        ruleTitle: "Consonant doubling",
        ruleExplain: lemma + " doubles " + last + " before -" + suf + ".",
        columns: letters(lemma).concat([col(last, "ε"), boundary()].concat(sufCols)),
      };
    }
    return {
      rule: suf,
      ruleTitle: "Add -" + suf,
      ruleExplain: "The stem is copied and -" + suf + " is concatenated.",
      columns: letters(lemma).concat([boundary()].concat(sufCols)),
    };
  }

  function voiceF(lemma) {
    return {
      rule: "f-ves",
      ruleTitle: "f → ves",
      ruleExplain:
        lemma +
        " is marked for voicing. Final f becomes v, e is inserted, and -s is the plural.",
      columns: letters(lemma.slice(0, -1)).concat([
        col("v", "f"),
        boundary(),
        col("e", "ε"),
        col("s", "+PL"),
      ]),
    };
  }

  function supplete(surface, lemma, feat) {
    return {
      rule: "irregular",
      ruleTitle: "Irregular form",
      ruleExplain:
        surface +
        " is stored as one arc to " +
        lemma +
        FEAT_TAG[feat] +
        ". It does not go through the regular spelling rules.",
      columns: [col(surface, lemma + FEAT_TAG[feat])],
    };
  }

  function build(entry, feat) {
    const lemma = entry.lemma;
    const tag = FEAT_TAG[feat];
    if (lemma === "go" && feat === "3SG") {
      return {
        rule: "e-insert",
        ruleTitle: "Insert e",
        ruleExplain: "go plus third-person -s inserts an e. went and gone do not use this rule; they are irregular arcs.",
        columns: letters("go").concat([boundary(), col("e", "ε"), col("s", tag)]),
      };
    }
    if (entry.voiceF && feat === "PL") return voiceF(lemma);
    if (entry.irregular && entry.irregular[feat]) {
      const surface = entry.irregular[feat];
      if (surface === lemma) {
        return zero(
          lemma,
          feat,
          "Same string, different feature",
          surface +
            " is listed as the " +
            FEAT_PLAIN[feat] +
            " of " +
            lemma +
            ". The letters match the base form; only the feature changes."
        );
      }
      return supplete(surface, lemma, feat);
    }
    if (feat === "SG" || feat === "VB" || feat === "POS") {
      return zero(
        lemma,
        feat,
        "Zero morpheme",
        "Nothing is added. An epsilon arc writes " + tag + " and the stem is accepted as the " + FEAT_PLAIN[feat] + "."
      );
    }
    if (feat === "PL" || feat === "3SG") return addS(lemma, feat);
    if (feat === "PAST" || feat === "PP") return addEd(lemma, feat);
    if (feat === "PROG") return addIng(lemma);
    if (feat === "COMP" || feat === "SUPER") return addDegree(lemma, feat);
    return null;
  }

  function featAllows(suffix, feat) {
    const table = {
      "ε": ["SG", "VB", "POS", "PP"],
      s: ["PL", "3SG"],
      es: ["PL", "3SG"],
      ed: ["PAST", "PP"],
      ing: ["PROG"],
      er: ["COMP"],
      est: ["SUPER"],
    };
    return (table[suffix] || []).indexOf(feat) !== -1;
  }

  function freeCuts(word) {
    const found = [];
    function add(stem, suffix, rule) {
      if (!stem) return;
      const hits = LEXICON.filter(function (e) {
        return e.lemma === stem;
      });
      found.push({
        stem: stem,
        suffix: suffix,
        rule: rule,
        inLexicon: hits.length > 0,
      });
    }

    add(word, "ε", "whole string as a stem");
    if (/ies$/.test(word) && word.length > 4) add(word.slice(0, -3) + "y", "s", "undo ies → y");
    if (/ves$/.test(word) && word.length > 4) add(word.slice(0, -3) + "f", "s", "undo ves → f");
    if (/ing$/.test(word) && word.length > 4) {
      const base = word.slice(0, -3);
      add(base, "ing", "strip -ing");
      if (base.length >= 2 && base[base.length - 1] === base[base.length - 2] && isConsonant(base[base.length - 1])) {
        add(base.slice(0, -1), "ing", "strip -ing and undo doubling");
      }
      add(base + "e", "ing", "strip -ing and restore e");
    }
    if (/ed$/.test(word) && word.length > 3) {
      const base = word.slice(0, -2);
      add(base, "ed", "strip -ed");
      if (base.endsWith("i") && base.length > 1) add(base.slice(0, -1) + "y", "ed", "strip -ed and undo i → y");
      if (base.length >= 2 && base[base.length - 1] === base[base.length - 2] && isConsonant(base[base.length - 1])) {
        add(base.slice(0, -1), "ed", "strip -ed and undo doubling");
      }
      add(base + "e", "ed", "strip -ed and restore e");
    }
    if (/est$/.test(word) && word.length > 4) {
      const base = word.slice(0, -3);
      add(base, "est", "strip -est");
      if (base.endsWith("i") && base.length > 1) add(base.slice(0, -1) + "y", "est", "undo i → y");
      if (base.length >= 2 && base[base.length - 1] === base[base.length - 2] && isConsonant(base[base.length - 1])) {
        add(base.slice(0, -1), "est", "undo doubling");
      }
      add(base + "e", "est", "restore e");
    }
    if (/er$/.test(word) && word.length > 3) {
      const base = word.slice(0, -2);
      add(base, "er", "strip -er");
      if (base.endsWith("i") && base.length > 1) add(base.slice(0, -1) + "y", "er", "undo i → y");
      if (base.length >= 2 && base[base.length - 1] === base[base.length - 2] && isConsonant(base[base.length - 1])) {
        add(base.slice(0, -1), "er", "undo doubling");
      }
      add(base + "e", "er", "restore e");
    }
    if (/es$/.test(word) && word.length > 3) add(word.slice(0, -2), "es", "strip -es");
    if (/s$/.test(word) && !/ss$/.test(word) && word.length > 2) add(word.slice(0, -1), "s", "strip -s");

    const map = new Map();
    found.forEach(function (cut) {
      const key = cut.stem + "|" + cut.suffix;
      if (!map.has(key)) map.set(key, cut);
      else if (map.get(key).rule.indexOf(cut.rule) === -1) map.get(key).rule += " · " + cut.rule;
    });
    return Array.from(map.values());
  }

  function listedForm(surface, spec) {
    return {
      lemma: spec.lemma,
      pos: spec.pos,
      posName: spec.plain,
      feat: spec.feat || "CL",
      featPlain: spec.featPlain || spec.plain,
      tag: spec.tag || "",
      gloss: spec.gloss,
      rule: spec.feat ? "listed" : "closed",
      ruleTitle: spec.feat ? "Listed form" : "Closed class",
      ruleExplain: spec.explain,
      columns: [col(surface, spec.gloss)],
    };
  }

  function ambiguityKind(analyses) {
    if (analyses.length < 2) return "";
    const lemmas = new Set(analyses.map(function (a) { return a.lemma; }));
    const poss = new Set(analyses.map(function (a) { return a.pos; }));
    if (lemmas.size > 1) return lemmas.size === 2 ? "Two lemmas fit this string." : lemmas.size + " lemmas fit this string.";
    if (poss.size > 1) return "Same letters, two parts of speech.";
    return "One lemma. Two feature bundles share this surface form.";
  }

  function analyze(raw) {
    const input = String(raw || "").trim().toLowerCase();
    const analyses = [];
    let candidates = 0;
    if (/^[a-z']+$/.test(input)) {
      LEXICON.forEach(function (entry) {
        FEATS[entry.pos].forEach(function (feat) {
          candidates += 1;
          const built = build(entry, feat);
          if (!built) return;
          if (surfaceOf(built.columns) !== input) return;
          analyses.push({
            lemma: entry.lemma,
            pos: entry.pos,
            posName: POS_NAME[entry.pos],
            feat: feat,
            featPlain: FEAT_PLAIN[feat],
            tag: FEAT_TAG[feat],
            gloss: entry.lemma + "/" + entry.pos + " " + FEAT_TAG[feat],
            rule: built.rule,
            ruleTitle: built.ruleTitle,
            ruleExplain: built.ruleExplain,
            columns: built.columns,
          });
        });
      });
      const listed = CLITICS[input] || CLOSED[input] || [];
      listed.forEach(function (spec) {
        analyses.push(listedForm(input, spec));
      });
      EXTRA.forEach(function (spec) {
        if (spec.surface === input) analyses.push(listedForm(input, spec));
      });
    }
    analyses.sort(function (a, b) {
      return POS_ORDER[a.pos] - POS_ORDER[b.pos] || FEAT_ORDER[a.feat] - FEAT_ORDER[b.feat];
    });

    const cuts = freeCuts(input).map(function (cut) {
      const matched = analyses.filter(function (a) {
        return a.lemma === cut.stem && featAllows(cut.suffix, a.feat);
      });
      let verdict = "unknown";
      if (matched.length) verdict = "match";
      else if (cut.inLexicon) verdict = "listed";
      return {
        stem: cut.stem,
        suffix: cut.suffix,
        rule: cut.rule,
        verdict: verdict,
        paths: matched.length,
      };
    });
    const rank = { match: 0, listed: 1, unknown: 2 };
    cuts.sort(function (a, b) {
      return rank[a.verdict] - rank[b.verdict];
    });

    return {
      input: input,
      analyses: analyses,
      cuts: cuts,
      candidates: candidates,
      ambiguity: ambiguityKind(analyses),
    };
  }

  function buildLexiconFsa(words) {
    let nextId = 0;
    const root = {
      id: nextId++,
      ch: "",
      accept: false,
      depth: 0,
      children: new Map(),
      lemmas: [],
    };
    words.forEach(function (word) {
      let node = root;
      word.split("").forEach(function (ch) {
        if (!node.children.has(ch)) {
          node.children.set(ch, {
            id: nextId++,
            ch: ch,
            accept: false,
            depth: node.depth + 1,
            children: new Map(),
            lemmas: [],
          });
        }
        node = node.children.get(ch);
      });
      node.accept = true;
      node.lemmas.push(word);
    });

    const nodes = [];
    const edges = [];
    let leaf = 0;
    function layout(node) {
      const kids = Array.from(node.children.values()).sort(function (a, b) {
        return a.ch < b.ch ? -1 : a.ch > b.ch ? 1 : 0;
      });
      node.children = new Map(kids.map(function (kid) { return [kid.ch, kid]; }));
      if (!kids.length) {
        node.y = leaf++;
      } else {
        kids.forEach(layout);
        node.y = (kids[0].y + kids[kids.length - 1].y) / 2;
      }
      nodes.push(node);
    }
    layout(root);

    function link(node) {
      node.children.forEach(function (kid, ch) {
        edges.push({ from: node.id, to: kid.id, ch: ch });
        link(kid);
      });
    }
    link(root);

    const DX = 92;
    const DY = 46;
    nodes.forEach(function (node) {
      node.x = 34 + node.depth * DX;
      node.y = 32 + node.y * DY;
    });
    const maxDepth = nodes.reduce(function (m, n) { return Math.max(m, n.depth); }, 0);
    const maxY = nodes.reduce(function (m, n) { return Math.max(m, n.y); }, 0);
    return {
      root: root,
      nodes: nodes,
      edges: edges,
      width: maxDepth * DX + 130,
      height: maxY + 42,
      states: nodes.length,
      letters: words.reduce(function (n, w) { return n + w.length; }, 0),
    };
  }

  function continuesTo(node) {
    const out = [];
    function walk(current) {
      current.children.forEach(function (kid) {
        kid.lemmas.forEach(function (lemma) { out.push(lemma); });
        walk(kid);
      });
    }
    walk(node);
    return out;
  }

  function walkLexicon(fsa, raw) {
    const word = String(raw || "").trim().toLowerCase();
    const nodes = [fsa.root];
    const edges = [];
    let node = fsa.root;
    if (!word) {
      return { word: "", nodes: nodes, edges: edges, accept: false, fail: null, index: -1, continues: [] };
    }
    if (!/^[a-z]+$/.test(word)) {
      return { word: word, nodes: nodes, edges: edges, accept: false, fail: word[0], index: 0, continues: [] };
    }
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const child = node.children.get(ch);
      if (!child) {
        return {
          word: word,
          nodes: nodes,
          edges: edges,
          accept: false,
          fail: ch,
          index: i,
          continues: [],
          dead: true,
        };
      }
      edges.push({ from: node.id, to: child.id, ch: ch });
      nodes.push(child);
      node = child;
    }
    return {
      word: word,
      nodes: nodes,
      edges: edges,
      accept: node.accept,
      lemmas: node.lemmas.slice(),
      fail: null,
      index: word.length,
      continues: continuesTo(node),
      dead: false,
      node: node,
    };
  }

  const ABBREV = /^(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Gen|U\.S|U\.K|p\.m|a\.m|i\.e|e\.g)\.$/i;

  function expandWord(raw) {
    const lower = raw.toLowerCase();
    if (lower === "won't") {
      return [
        { text: "will", type: "word" },
        { text: "n't", type: "clitic", note: "contraction of not; the host will is irregular" },
      ];
    }
    const endings = [
      ["n't", "clitic", "contraction of not"],
      ["'re", "clitic", "contraction of are"],
      ["'ve", "clitic", "contraction of have"],
      ["'ll", "clitic", "contraction of will"],
      ["'d", "clitic", "ambiguous: would or had"],
      ["'m", "clitic", "contraction of am"],
    ];
    for (let i = 0; i < endings.length; i++) {
      const end = endings[i][0];
      if (lower.length > end.length && lower.endsWith(end)) {
        const host = raw.slice(0, -end.length);
        const clitic = raw.slice(-end.length);
        const piece = { text: clitic, type: endings[i][1], note: endings[i][2] };
        if (end === "'d") piece.ambiguous = true;
        return [{ text: host, type: "word" }, piece];
      }
    }
    if (lower.endsWith("'s") && lower.length > 2) {
      return [
        { text: raw.slice(0, -2), type: "word" },
        {
          text: raw.slice(-2),
          type: "clitic",
          ambiguous: true,
          note: "ambiguous clitic: possessive, or the verb is, or has",
        },
      ];
    }
    return [{ text: raw, type: "word" }];
  }

  function classify(raw) {
    if (ABBREV.test(raw) || /^(?:p\.m|a\.m|i\.e|e\.g|U\.S|U\.K)\.$/i.test(raw)) {
      return [{ text: raw, type: "abbrev", note: "period stays inside the abbreviation" }];
    }
    if (/^\d+(?:\.\d+)?$/.test(raw)) return [{ text: raw, type: "number" }];
    if (/^[.?!]+$/.test(raw)) return [{ text: raw, type: "end", note: "sentence boundary" }];
    if (/^[,;:"()\-—–]+$/.test(raw)) return [{ text: raw, type: "punct" }];
    return expandWord(raw);
  }

  function analyzeDocument(text) {
    const tok = tokenize(text);
    let ambiguous = 0;
    let unknown = 0;
    let analyzed = 0;
    const sentences = tok.sentences.map(function (sentence) {
      return {
        tokens: sentence.map(function (token) {
          const item = {
            text: token.text,
            type: token.type,
            note: token.note || "",
            parsed: null,
          };
          if (token.type === "word" || token.type === "clitic") {
            item.parsed = analyze(token.text);
            analyzed += 1;
            if (!item.parsed.analyses.length) unknown += 1;
            else if (item.parsed.analyses.length > 1) ambiguous += 1;
          }
          return item;
        }),
      };
    });
    return {
      sentences: sentences,
      stats: {
        sentences: sentences.length,
        tokens: tok.tokens.length,
        analyzed: analyzed,
        ambiguous: ambiguous,
        unknown: unknown,
      },
    };
  }

  function tokenize(text) {
    const clean = String(text || "").replace(/’/g, "'").replace(/[“”]/g, '"');
    const re = /Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.|St\.|Gen\.|U\.S\.|U\.K\.|p\.m\.|a\.m\.|i\.e\.|e\.g\.|\d+(?:\.\d+)?|[A-Za-z]+n't|[A-Za-z]+'re|[A-Za-z]+'ve|[A-Za-z]+'ll|[A-Za-z]+'d|[A-Za-z]+'m|[A-Za-z]+'s|[A-Za-z]+(?:-[A-Za-z]+)*|[.?!]+|[,;:"()\-—–]/gi;
    const sentences = [[]];
    let match;
    while ((match = re.exec(clean))) {
      classify(match[0]).forEach(function (part) {
        sentences[sentences.length - 1].push(part);
        if (part.type === "end") sentences.push([]);
      });
    }
    const kept = sentences.filter(function (s) { return s.length; });
    return {
      sentences: kept,
      tokens: kept.reduce(function (all, s) { return all.concat(s); }, []),
    };
  }

  return {
    lexicon: LEXICON,
    fragment: FRAGMENT,
    analyze: analyze,
    analyzeDocument: analyzeDocument,
    surfaceOf: surfaceOf,
    buildLexiconFsa: buildLexiconFsa,
    walkLexicon: walkLexicon,
    tokenize: tokenize,
    posName: POS_NAME,
    featPlain: FEAT_PLAIN,
  };
});
