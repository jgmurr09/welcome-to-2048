# Welcome to 2048 

Extract the entire ZIP, then open **index.html**. Full browser AI needs the folder served over HTTP or HTTPS; see **WASM_SETUP.md**. The included model makes this archive much larger than the earlier rounds.

This round keeps the intro, open character profiles, Your Day quiz, and event placeholders. The world map now expands across the available canvas, restores character previews in the sidebar, adds Education filters, hides unrelated theme notes, and uses a two-color 2048 marker in the header. Visible source disclosures are removed; World Truths and the canonical source content remain.

Chat uses a larger portrait and simple character switches. A bundled generative model replaces the embedding-only matcher. It can answer everyday questions and follow-ups around each character's established background. Generated, imagined replies are marked in red. Known-topic buttons work without the model. No device files, external search, or conversation database are connected.

## Editing

- `content/world.json`: unchanged canonical narratives, themes, truths, and artifacts.
- `content/presentation.json`: concise world prose and only the relevant character notes.
- `content/personas.json`: voices, sampling settings, and short generative memory cards.
- `content/chat-replies.json`: known-topic fallback replies.
- `connections.js`: shared graph and responsive spacing.
- `app.js`, `styles.css`: map, profiles, chat, and event presentation.
- `persona-worker.js`, `persona-runtime.js`, `conversation.js`: generative runtime and boundaries.
- `page.template.html`, `build-local.py`: source markup and self-contained entry-page build.

Run `python3 build-local.py` after edits. Run `node verify.js` for content, timing, boundaries, graph, and all 729 quiz combinations. Optional DOM checks use `jsdom@26.1.0`: `node verify-dom.cjs`.

`prepare-pages.py` checks the model and runtime before preparing static Pages output. `.gitlab-ci.yml` supplies a manual deployment job. No hosting or repository has been changed for this delivery.

See **VALIDATION.md** for checks performed and limitations.
