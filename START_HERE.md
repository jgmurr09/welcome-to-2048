# Welcome to 2048 — updated local preview

1. Extract the **entire ZIP** into a fresh folder.
2. Open **index.html** in your browser.
3. Choose **TAP TO ENTER THE FUTURE**, then use the navigation to explore.

No installation, server, or internet connection is required. Keep the extracted files and folders together. Roboto is bundled and embedded in the entry page.

## What changed

- The five landing themes now open branching paths with the subcategories and character assignments from the supplied boards. Each character has a short introduction tied to the selected theme, and **Back to themes** restores the selected branch. See **themes/README.md** for the complete mapping and editing instructions.
- Removed the button, caption and decorative labels over the landing map. The entire map preview remains clickable.
- Replaced the header and arrival-screen branding with the supplied TANG logo.
- Applied Roboto throughout the interface. The **Welcome to 2048** heading retains its previous display font.
- Removed decorative taglines, spaced overlines and small marketing captions. Useful bios, technology descriptions and navigation labels remain.
- Added a dedicated **Explore the Technology** catalog with the five technologies from the map first, followed by twelve blank technology cards for other teams.
- Applied Sophia's shared profile layout to every character. Each profile retains its own portrait, bio, stories and accent color.
- Kept the names across the top for quick character switching. **Meet the People** opens the last visited profile, starting with Sophia.
- Expanded each character graph to include connected technologies, systems, shared activities and nearby people. Graph positions stay stable while selecting an area of life. **List** offers a text alternative.

## Explore the technology

The map technologies have a short summary, **Read more**, and **View on map**. Read more opens a detail view with links to connected people. The blank cards do not pretend to contain finished technology or have inactive buttons.

To add another team's technology, edit a blank entry in **technology-config.js**:

```javascript
{
  id: 'team-technology-01',
  title: 'Your technology name',
  summary: 'A short description for the card.',
  detail: 'More information shown when someone chooses Read more.',
  image: 'technologies/your-image.jpg', // Or null to keep the icon.
  people: ['sophia'],                 // Existing person IDs, or [].
  node: null                         // An existing world node ID, if applicable.
}
```

Fill `title` to turn a blank into a normal card. A map button appears only when `node` matches an existing world node. Add more entries to create more cards. Empty cards remain after the five map technologies and appear in the same order as the configuration.

The five existing technologies use their names and descriptions from `data.js`, with short draft summaries in `technology-config.js` when the existing descriptions are empty.

## Add portraits, voice and story images

- **Portrait:** put your image in `portraits/`, then set the person's `portrait` path in `data.js`. `portraitPosition` controls the crop. Portraits are shared by the landing page, profile and full map.
- **Bio and descriptions:** fill the existing `description` fields in `data.js`; these override the draft profile copy.
- **Draft profile stories:** edit the person's `stories` in `character-config.js`.
- **Voice:** put a recording in `audio/`, then set `audio` and `audioTranscript` in the person's `character-config.js` entry. Native audio controls appear when a recording is configured and never autoplay.
- **Story image:** put an image in `scenes/`, then set `scene` in `character-config.js`.
- **Technology image:** put images in `technologies/` and set the card's `image` path.

After any source changes, rebuild the entry page:

```bash
python3 build-local.py
```

Then refresh **index.html**. Python is only needed to rebuild; the supplied page is already built.

## Responsive behavior

Phone layouts stack the profile content and use short navigation labels: World, People, Technology and About. The five-person selector scrolls horizontally. Graph nodes keep readable sizes and flow into additional rows; they are not shrunk into a tiny desktop overview. Selecting an area brings its story into view.

Portrait kiosks use larger type and controls. Dedicated styles support 1080 × 1920 and 2160 × 3840. Pages scroll normally, and the site does not auto-reset while someone is exploring.

## Main source files

| File | Purpose |
| --- | --- |
| `page.template.html` | Page structure and header navigation |
| `fonts.css` | Bundled Roboto, supplied logo sizes and mobile header labels |
| `landing.js`, `landing.css` | Landing page, screen routing and browser history |
| `landing-config.js` | Theme subcategories, character assignments and introductions |
| `themes.js`, `themes.css` | Responsive theme branches, profile links and return paths |
| `characters.js`, `characters.css` | Shared Sophia profile, wider graphs and character switching |
| `character-config.js` | Character draft stories, audio and scene paths |
| `technology.js`, `technology.css` | Technology catalog and detail views |
| `technology-config.js` | Existing summaries and editable team cards |
| `data.js`, `app.js`, `styles.css` | Existing world map, descriptions, search and navigation |
| `idle-player.js`, `intro-clock.js`, `intro.css` | Muted video playback and the date clock |
| `build-local.py` | Embeds styles, scripts and Roboto in `index.html` |
| `assets/fonts/` | Local Roboto files, license and copyright notice |

This ZIP is a local review copy. The video, world data and date-clock implementation are preserved. No public deployment or GitHub change was made by this update.

## Verification

The theme update was checked against all supplied mappings: five themes, eleven subcategories and eighteen character paths, plus two regional map destinations. All branches were opened in the browser. The theme view was checked at 320 × 740, 390 × 844, 768 × 1024, 1080 × 1920 and 2160 × 3840, with no overlapping branch controls or overflowing theme panels. Profile links open the intended area of life; theme context, return buttons, quick character switching and browser Back were exercised. Kiosk theme controls have minimum heights of 64px at 1080 × 1920 and 88px at 2160 × 3840. This remains Chromium viewport testing; physical kiosks and Safari were not available for verification. The video, autoplay logic, date clock and existing world content are unchanged by this theme update.

Checked all five shared profiles at 320 × 740 and 1080 × 1920, with additional checks at 390 × 844 and a 2160 × 3840 portrait view. The expanded graphs had no overlapping or clipped nodes. Technology cards were checked at 320 × 740, 768 × 1024, 1080 × 1920 and 2160 × 3840 without horizontal overflow. These are responsive Chromium viewport checks, not physical-device or Safari tests.

Verified the supplied logo loads, Roboto loads from the bundled font data, the Welcome heading keeps its original font, the removed captions and map overlay are absent, and the catalog contains five map cards followed by twelve blank team cards. Tested technology details, links to the map and people, character switching from the wider graph, keyboard list selection, browser Back and mobile story scrolling. No application JavaScript errors were observed. Source syntax, local assets, graph references and the ZIP structure passed checks.
