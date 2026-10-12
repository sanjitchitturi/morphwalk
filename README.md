# MorphWalk

A live finite-state lab for the first half of an NLP course. It is one static page: a lexicon automaton, a morphological transducer, and a word/sentence scanner. No install, no server, no network.

The hosted demo is [https://sanjitchitturi.github.io/morphwalk/](https://sanjitchitturi.github.io/morphwalk/). Opening `index.html` locally does the same thing. The word **leaves** is already parsed into two accepting paths.

## What to show

Press **Start class tour** and use **Next**. The dark bar is the sentence the class should see. **What to say** opens the spoken line. Arrow keys move the tour when you are not typing in a box.

1. **cat** accepts. A lexicon is a trie; a double circle is an accept state.
2. **cax** dies. No arc labeled `x`, so the string is not in the language.
3. **hop** accepts, and one more arc builds **hope**. A state can accept and continue.
4. **cats** is a transducer, not just an automaton. The last arc is `s:+PL`.
5. **hopping** doubles `p`. Spelling rules are the arcs that do not copy.
6. **leaves** is ambiguous: `leaf/N +PL` and `leave/V +3SG`. Two accepting paths, no winner.
7. **hoping**, lexicon-free mode. `hope+ing` matches; `hop+ing` is a real stem with the wrong shape (`hopping`).
8. **went** is one irregular arc to `go+PAST`. The suffix stripper has nothing to peel.
9. Tokenize `Mr. Smith's children aren't leaving.` The period in `Mr.` is not a sentence boundary. `'s` is ambiguous (possessive, *is*, or *has*). Click **flies** to jump back to the parser.

If someone asks a follow-up, the chips under the box are the backup slides: **flies** (one spelling, two categories), **walked** (past and participle share `-ed`), **cities**, **foxes**, **children**, **buses**, **this** (reject).

## Syllabus

| Topic | Where it shows up |
| --- | --- |
| Finite-state automata | Lexicon tab: states, arcs, accept, reject |
| Ambiguity | `leaves`, `flies`, `books`, `walked`, and the clitic `'s` |
| Models and algorithms | A path is a candidate `(lemma, category, feature)`. The page reports how many paths were checked and how many accept |
| English morphology | Noun number, verb tense and aspect, adjective degree, plus irregulars |
| Finite-state morphological parsing | Input/output alignment on the Parse tab |
| Building a finite-state lexicon | The trie. Shared prefixes share states |
| FSTs for morphological parsing | Arcs written `input:output`, including epsilon |
| Lexicon-free FSTs | The cuts on the right. They peel suffixes and miss spelling and irregulars |
| Words and sentence tokenization | Tokenize tab |

Constituency, n-grams, and part-of-speech tagging are later in the course. This demo stops where the lectures have stopped.

## How a parse works

The lexicon lists a lemma with a category, and a few irregular forms (`went`, `children`, `was`). Regular inflections are produced by spelling rules:

- zero morpheme (`cat` singular)
- `-s`, and epenthetic `-es` after a sibilant (`foxes`)
- `y → ie` (`cities`, `flies`) and `y → i` (`happier`, `studied`)
- silent `e` deleted before `-ing`, `-er`, `-est` (`hoping`, `later`)
- consonant doubling on a short CVC stem (`hopping`, `bigger`)
- `f → ves` for `leaf`
- one-arc irregulars (`went : go+PAST`)

Parsing searches those paths and keeps every one whose surface side equals the typed word. With a few dozen lemmas this is the transducer, written out as alignments so a class can watch it.

Morphotactics is the small automaton on the lower left: a noun may be singular or plural, a verb may take `-s`, `-ed`, or `-ing`, an adjective may take `-er` or `-est`.

The lexicon-free column does not use those rules. It only strips `-ing`, `-ed`, `-es`, `-s`, `-er`, `-est` and undoes a few letters blindly. Green means the guess matches a real path. Amber means the stem is listed but the spelling is wrong. Red means the stem is not listed.

## Run it

Double-click `index.html`.

Or, from this folder:

```bash
python3 -m http.server 8765
```

Then open `http://localhost:8765`.

## Put it on GitHub

Upload the **contents** of this folder so `index.html` sits at the root of the repository, not inside an extra directory.

1. Create a repository, for example `morphwalk`.
2. Add every file here: `index.html`, `styles.css`, `engine.js`, `ui.js`, `test_engine.js`, `README.md`, `.nojekyll`.
3. Settings → Pages → deploy from branch → `main` → `/ (root)`.
4. The live page is `https://<your-username>.github.io/morphwalk/`.

`.nojekyll` tells GitHub Pages to publish the folder as-is.

Check the engine locally with:

```bash
node test_engine.js
```
