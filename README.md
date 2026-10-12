# MorphWalk

A finite-state morphological parser for English. Paste a passage and every word is analyzed as lemma, category, and inflection. Ambiguous words keep every accepting path.

Hosted demo: [https://sanjitchitturi.github.io/morphwalk/](https://sanjitchitturi.github.io/morphwalk/)

The topic is finite-state morphological parsing. The lexicon stores stems and irregulars. Spelling rules (epenthesis, consonant doubling, e-deletion, y-to-i, f-to-ves) produce the surface form. Closed-class words and clitics such as `'s` and `n't` are listed entries. A word the lexicon cannot build is left unknown.

## Use it

Open the hosted page, or double-click `index.html`. The first passage is already analyzed. Click a word to see the transducer alignment. **Copy gloss** exports the interlinear reading.

Three passages are built in: ambiguity (`flies`, `leaves`), names and clitics, and irregular verbs.

Check the engine with:

```bash
node test_engine.js
```
