# Explore 2048 — local prototype

Unzip the entire folder and open the new `index.html` in your browser. No installation or internet connection is needed. Keep all files together. Use the freshly extracted folder so an older tab does not keep showing a previous copy.

The opening page now includes all of its JavaScript and CSS. Its button, clock, and map load together, without separate script requests or a web server. The video, poster, and board remain local assets in the folder.

For source edits, change the `.js` or `.css` files (or `page.template.html`), then run `python3 build-local.py` to update `index.html`. Visitors only need to open `index.html`; they do not need Python.

## Future World introduction

An optimized copy of the supplied 20-second MP4 starts automatically and loops silently on the landing screen. The H.264 video keeps the original 1920 × 1080 resolution and all 481 frames, with a smaller file and a fast-start header. Choose **TAP TO ENTER THE FUTURE** to travel from the visitor's actual local date to **January 1, 2048**.

Today's date holds for 1 second. The split-flap clock then accelerates through 5.5 seconds of date changes. The number of date snapshots adapts to the duration so each mechanical flip can finish before the next starts.

The travelling screen contains only the date clock. At arrival, it pauses on 2048 for 0.9 seconds, then automatically transitions into the map. There is no arrival button or second click. The line beneath the landing button has also been removed. The complete default sequence takes about 8 seconds, including both pauses and the exit transition.

Date updates use independent timers. CSS supplies the split-flap effect; animation completion events and animation frames do not control whether the calendar advances. Each tile always has a current static readout beneath its temporary flaps, which are cleared by a timer.

- **Landing screen:** silent autoplaying video, event branding, and the tap-to-enter action. The sound controls, skip control, and corner captions have been removed.
- **Playback recovery:** the player resumes unexpected pauses without rewinding, retries after returning to the tab, and handles a persistent stall without repeatedly reloading the clip. If automatic playback is refused, a central play button appears; it starts playback directly from your click. The main tap-to-enter action continues to work independently.
- **Replay:** choose the circular replay button beside the map's help button to return to the idle screen.
- **Reduced motion:** the landing video still plays automatically as requested. Dates continue advancing with the same pauses and travel duration, with the 3D flips and exit zoom suppressed. Entry into the map is automatic.
- **Keyboard:** use Enter or Space on the landing action. Escape during the clock or arrival pause returns to the landing screen.
- **Offline:** the video, still, code, and map assets are included. No fonts, scripts, or services are fetched from the internet.
- **No auto-reset:** the map stays open while visitors explore. Replay returns it to the idle screen when you are ready for the next visitor.

Edit `intro-config.js` to change `targetDate` (YYYY-MM-DD), `durationMs` (3000–12000, clock travel only), `departureHoldMs`, or `arrivalHoldMs` (400–2500 each). The departure date updates automatically, including after replay. A destination earlier than today is displayed directly instead of running the calendar backward.

The introduction adds a replay control to the map toolbar. Existing map data, placeholders, and interactions are retained. This ZIP is the local version; it has not been published.

## Fill in the placeholders

Edit `data.js`. Every node and relationship has an empty `description` field. Fill it with real copy to replace the lorem ipsum shown in the sidebar and lists. The five person sections are separate records linked with the `person` field.

The graph, connections, search, filters, list view, pan/zoom, and back navigation work. Bios, personal metadata, special story callouts, reflection questions, and the guided walkthrough have been removed.

## Add photos

Put photos in `portraits/`. Set a person's `portrait` field to a path such as `portraits/sophia.jpg`. Adjust `portraitPosition` to control the crop. Until an image is supplied, an initial is shown.

## Main files

- `index.html`: ready-to-open page with its scripts and styles included.
- `page.template.html`: editable page structure.
- `build-local.py`: regenerates `index.html` after source edits.
- `app.js`: navigation and interactions.
- `data.js`: nodes, connections, and descriptions.
- `styles.css`: appearance and responsive layout.
- `intro-config.js`: arrival date and animation duration.
- `intro-clock.js`: clock timing, date flipping, automatic entry, and replay. This replaces the earlier `intro.js` file.
- `idle-player.js`: independent background playback, blocked-play fallback, and pause/stall recovery.
- `intro.css`: idle screen, mechanical clock, and transition styling.
- `assets/`: the supplied idle video and poster image.
- `board.png`: original board.
