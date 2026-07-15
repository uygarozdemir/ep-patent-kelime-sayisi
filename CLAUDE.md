# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chrome extension (Manifest V3) with no build step. Given an EP patent number
(e.g. `EP 3634453`), it queries the EPO European Publication Server, locates the **B1**
publication, downloads its XML, and computes a Word-like word count for **Tarifname
(description) + İstemler (claims in the procedural language only)**.

Files: `manifest.json`, `popup.html`, `popup.js`, `rules.json`. No package manager, no
bundler, no tests — everything runs directly as unpacked extension source.

## Running / testing changes

There is no CLI build. To test a change:

1. Open `chrome://extensions`, enable "Developer mode".
2. "Load unpacked" → select this folder (first time), or click the reload icon on the
   extension's card (after edits).
3. Click the extension icon, enter a number like `EP 3634453`, click "Ara".

`popup.js` logic can also be sanity-checked outside the browser by parsing a downloaded
`document.xml` with any XML parser and re-implementing `countWords`/`countDocument` — this
was how the word-count logic was originally validated (Python + `xml.etree`) before wiring
it into the extension.

## Architecture

### Two-step EPO API flow (`popup.js`)

The EPO publication server has no simple "get B1 by number" endpoint; the actual React app
(data.epo.org) drives a two-step flow that this extension replicates directly with `fetch`,
with no background service worker:

1. **Search** — `POST https://data.epo.org/publication-server/publications?page=0&size=20&lng=en`
   with a JSON body shaped like the site's internal search form (`publicationNumber` as
   **digits only** — no `EP` prefix, no spaces, no kind code; `publicationDateRange` with a
   wide year range; `publicationKinds: ["B1"]`). The response's `content[0]` gives the exact
   `xmlFile` storage path (e.g. `2026/18/DOC/EPNWB1/EP18799410NWB1/EP18799410NWB1.xml`) —
   there is no need to guess the publication's correction code (e.g. `NW`).
2. **Fetch XML** — `GET https://data.epo.org/publication-server/publications/xml?path=<xmlFile>`
   returns the raw `ep-patent-document` XML.

### Cloudflare Origin check → `rules.json`

`data.epo.org` sits behind Cloudflare and rejects requests whose `Origin` header isn't
`https://data.epo.org` — a plain `fetch()` from an extension popup sends
`Origin: chrome-extension://<id>` and gets **403**. Since `Origin`/`Referer` are forbidden
headers that JS cannot set directly, this is fixed at the network layer via
`declarativeNetRequest`: `rules.json` rewrites `Origin` and `Referer` to EPO's own origin for
any `xmlhttprequest` request under `data.epo.org/publication-server/`. `manifest.json` wires
this up via the `declarativeNetRequest` permission and `declarative_net_request.rule_resources`.
If a future change touches request URLs, keep the `urlFilter` in `rules.json` in sync or the
403 will come back.

### Word-count semantics (`countDocument` / `countWords` in `popup.js`)

This is the part most likely to need recalibration against real MS Word output, so the
reasoning is captured here rather than only in code comments:

- **Scope is intentionally narrow**: only `<description>` + the `<claims>` element whose
  `lang` attribute matches the document root's `lang` (the procedural language). EP B1 XML
  repeats claims in **three languages** (`en`/`de`/`fr` — i.e. Claims/Ansprüche/Revendications);
  only the procedural-language claims are counted, mirroring the range of text the user
  actually translates. Bibliographic data (`SDOBI`) and prior-art citation lists (`nplcit`)
  are excluded because they aren't inside `<description>`/`<claims>`.
- Text is extracted via plain `textContent` on the matched elements — no manual block/inline
  tag handling. This works because the source XML already has real whitespace/newlines
  between sibling block elements (`</p>\n<heading>`), while inline tags like `<i>`/`<sub>`
  have no surrounding whitespace in the source, so adjacency (e.g. `H<sub>2</sub>O` → one
  word) is preserved for free. Table cells (`<entry>`) can end up concatenated without a
  separator — a known, accepted small risk.
- Tokenizer rules, matching confirmed MS Word behavior: em-dash/en-dash (`—`/`–`) are
  word **separators** and get replaced with a space before splitting; a plain hyphen (`-`)
  is a **joiner** and is left alone (`well-known` = one word); a token only counts if it
  contains at least one Unicode letter or digit (pure punctuation tokens are dropped).
- There is no known-good Word reference count yet for calibration — if the user reports a
  real Word count for a specific EP number, treat it as ground truth and adjust the
  extraction/tokenizer rules (not just add a special case) to close the gap.

## Language

All user-facing strings (popup UI, status/error messages) are in Turkish — keep new
user-facing text in Turkish for consistency.
