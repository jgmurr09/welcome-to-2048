# Welcome to 2048

An interactive future world from the TANG Future World Sprint. Explore how people, technology, shared activities, and world themes connect in an imagined 2048.

## Explore the Experience

- **Explore the World Map:** follow connections between people, themes, activities, and technologies. Select a node to read its information in the sidebar. Filter people by living environment, income, and education.
- **Meet the People:** explore five character stories and their mini maps. Themes, technologies, and shared activities open in a detail modal on this screen. The Back To World Map button returns to the larger map.
- **Learn the Technology:** explore the technology concepts and follow the link to other event deliverables.
- **Create Your Day in 2048:** make choices to generate a day and a personal connection map centered on You.
- **About the Event:** space for the event's one-pager, magazine, and graphic novel.

Leo's optional walkthrough introduces the world and its controls. Character conversations offer another way to explore the stories.

## Run Locally

Use a complete project folder with its assets, portraits, runtime, and model files. A small update ZIP contains replacement files only and must be copied into that complete folder.

From the project folder, run:

```bash
python3 serve-local.py
```

Open http://localhost:8000/ if the browser does not open automatically. Keep Terminal running while testing; press Ctrl+C to stop. For a different port:

```bash
python3 serve-local.py --port 8001
```

If your checkout does not include that helper, use Python's standard server:

```bash
python3 -m http.server 8000
```

Opening index.html directly can preview the interface, but generated conversations require HTTP or HTTPS for the browser worker and WebAssembly runtime.

When obtaining the project through Git, download its Git LFS assets too. GitHub Desktop supports that workflow. A folder containing small LFS pointer files instead of the real media or model data will not provide a complete local experience.

## Edit Content and Interface

| File | What to edit |
| --- | --- |
| `content/world.json` | Full character stories, world themes, World Truths, and technology descriptions |
| `content/presentation.json` | Short map summaries, individual invitations, theme explanations, and character notes |
| `content/onboarding.json` | Leo's introduction and walkthrough wording |
| `content/quiz.json` | Create Your Day questions and result wording |
| `content/personas.json` | Character voice and model context settings |
| `content/chat-replies.json` | Prepared conversation replies |
| `app.js` | Navigation, profiles, sidebars, detail modals, and chat interface |
| `connections.js` | Graph relationships and mini-map layout |
| `styles.css` | Main interface styling and responsive layouts |
| `onboarding.js`, `tour.js` | Introduction and guided walkthrough behavior |
| `page.template.html` | Source page structure |
| `index.html` | Self-contained entry page used for deployment |

The character drawings are supplied assets. Keep their viewing frames and source images together under `portraits/`. The arrival video is silent; the arrival sound is synthesized by the interface. Some scene and event media areas remain placeholders for approved assets.

### Rebuild Carefully

The entry page embeds CSS, content data, and application scripts. Changing a separate source file does not automatically update its embedded copy in index.html.

The current GitHub deployment workflow publishes the existing index.html; it does **not** run build-local.py automatically.

For a complete, synchronized source checkout, rebuild after editing:

```bash
python3 build-local.py
```

Then refresh and test the generated index.html before uploading it with the changed source files.

**Current maintenance note:** recent updates have included targeted changes to the embedded entry page, and some separate source content may still reflect earlier revisions. Before a full rebuild, reconcile the template, JSON, and scripts with the approved index.html so the rebuild retains the latest wording and behavior. For a supplied replacement-file update, copy the supplied files together and test them directly.

## Character Conversations

The bundled chat uses wllama with SmolLM2-360M-Instruct to generate imagined, first-person character replies. Prepared topic replies remain available when the model is loading or unavailable.

- Model and runtime assets load from the same site. The model is split into byte chunks that the worker combines in memory.
- Supported browsers may use WebGPU; a compatibility WASM path supports other browsers. CPU generation can be slow, particularly on phones or restricted work computers.
- The application supplies the selected character's background, relevant story context, and a short conversation history.
- Generated replies are labeled as imagined conversation and shown in red. They do not alter the established character stories.
- Scope checks redirect unrelated requests. The model can still invent details, contradict a story, or produce an unsuitable answer; test representative visitor questions on the intended exhibit hardware.
- The model has no connected live search, device-file access, microphone, camera, or account/database tools. The application keeps conversation state in browser memory rather than creating a conversation database.
- The idle reset returns the experience to its arrival screen and clears visitor state. Configure its interval through `experience-config.js`, keeping the embedded entry-page setting synchronized.

If chat works on one computer but fails on another, check browser compatibility, model asset availability, network restrictions, VPN/firewall rules, and available device resources. HTTPS is recommended for hosted use and browser acceleration.

Bot implementation files include `conversation.js`, `persona-runtime.js`, and `persona-worker.js`. Routine wording and layout updates do not require replacing model weights or runtime binaries.

## Check Before Uploading

Run the available automated checks from the project folder:

```bash
node verify.js
node verify-scope.cjs
```

Optional interaction checks require jsdom 26.1.0:

```bash
npm install --no-save jsdom@26.1.0
node verify-dom.cjs
node verify-scope-dom.cjs
```

These checks cover different parts of the prototype; they do not replace browser testing. After updates, check:

1. Arrival video, clock sequence, and entry controls.
2. Leo's walkthrough, including readable graphics and dialogue.
3. World Map filters, selections, sidebars, and visible profile/chat actions.
4. All five profiles, their mini maps, theme/activity/technology modals, and return navigation.
5. Character conversations, switching between people, and pending replies.
6. Create Your Day results and their You-centered map after navigating away and back.
7. Desktop, short laptop, phone, and portrait kiosk layouts, plus idle reset behavior.

Earlier validation documents describe earlier builds and timings. Recheck the current version on the actual kiosk; do not treat those older results as a current performance guarantee.

## Publish Through GitHub

The repository's `.github/workflows/deploy-pages.yml` runs when main is updated or when started manually through Actions. It downloads Git LFS assets, runs `prepare-pages.py --output public`, and publishes the prepared folder to GitHub Pages.

The preparation step verifies model/runtime checksums and copies the existing entry page and required assets. It does not rebuild the entry page from source.

For ordinary interface updates, upload only the replacement files listed with that update. Retain the existing videos, portraits, model chunks, and runtime assets. Large asset changes may require GitHub Desktop and Git LFS.

If deployment fails, inspect the failed Actions job. Missing LFS data or a model/runtime checksum mismatch must be resolved before preparation can finish. Keep relative asset paths intact when hosting beneath the repository's project URL.
