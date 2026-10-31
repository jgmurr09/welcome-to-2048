# Run and edit

1. Extract all files into a fresh folder.
2. Open `index.html` for a local review.
3. Enter through the clock and Leo’s tour, or use the small Skip control in the upper right.

The entry page embeds the application JavaScript, styles, fonts, and JSON. Keep assets, supplied portraits, runtime files, and `persona-worker.js` beside it. Browser AI needs HTTP/HTTPS; direct-file review uses the source-based replies.

## Source files

| File | Purpose |
| --- | --- |
| `content/world.json` | Unchanged supplied characters, themes, truths, artifacts, and approved corrections |
| `content/presentation.json` | Cleaner theme prose, per-person map notes, and source IDs |
| `content/onboarding.json` | Four Leo story screens and four interface guide steps |
| `content/quiz.json` | Questions, icons, tailored result text, destinations, and sources |
| `content/chat-replies.json` | Source-grounded first-person replies for five personas |
| `content/personas.json` | Topic chips, voice notes, and future model policy |
| `app.js` | Map, open profile sections, technology, publications, and centered chat |
| `connections.js` | Graph relationships, world coordinates, and profile maps |
| `quiz.js` | Six-choice flow, in-visit results, editing, and map routes |
| `world-ui.js` | Supplied portraits, escaped text, bracketed backgrounds, and icons |
| `onboarding.js`, `tour.js` | Reading-paced dialogue, cast reveal, and guided controls |
| `persona-runtime.js`, `persona-worker.js` | Same-site, memory-only semantic question matching |
| `runtime/model-manifest.json` | Pinned model/runtime versions, checksums, and file list |
| `styles.css`, `intro.css` | Responsive interface and clock styling |
| `intro-clock.js`, `idle-player.js`, `idle-reset.js` | Calendar, silent looping video, and inactivity reset |
| `build-local.py` | Generates the offline entry page from source |
| `prepare-pages.py`, `.gitlab-ci.yml` | Verified static output and manual Pages deployment job |
| `verify.js`, `verify-dom.cjs` | Core data checks and optional interaction tests |

## Rebuild

```bash
python3 build-local.py
node verify.js
```

Refresh `index.html` afterward. Edit source JSON and `page.template.html` rather than generated `world-data.js`, `icons-data.js`, or `index.html`.

Optional interaction checks use jsdom 26.1.0: install it with `npm install --no-save jsdom@26.1.0`, then run `node verify-dom.cjs`. These simulate interaction without checking visual layout.

## Map and profile editing

World theme tiles are the theme navigation. Location and income filters change which people are in focus without moving their nodes. Their labels stay with the map, while theme notes appear next to portraits. The right panel contains only theme context and source references.

Activities can be shown or hidden. Technology can follow the selected person, show everyone’s connections, or be hidden. Click a technology or activity to open its connection window. Click Meet or Chat in the selected-person bar for that person.

Profiles render all five supplied life areas. Their source passages are unchanged. The small map links to other people, themes, activities, and technology. External robotic knee support still has no invented personal owner.

To add publication media later, update `renderAbout()` in `app.js`. Keep each publication header and replace its bracketed square with the approved cover, file, and destination. No file upload or device-file reader is included.

## Session behavior

Quiz choices, results, messages, and drafts live in memory for the current visit. Moving among tabs preserves them. Reloading or the 150-second idle reset clears them. Source model weights and public story vectors may stay in memory across an idle reset; no conversations are retained in the model.

The clock and video behavior are preserved. High-speed calendar entries advance through every consecutive date, while the screen shows a continuous flip blur. The video is muted, autoplaying, and looping. Device/browser policy still controls playback and arrival sound.
