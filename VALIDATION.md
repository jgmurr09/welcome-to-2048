# Round 4 validation

## Automated checks

- `node verify.js` passed: five source characters, five themes, 15 World Truths, four artifacts, the previously authorized corrections, consecutive date flips, leap years, original timing, 21 graph nodes, responsive graph bounds, source-backed fallback replies, generative persona contexts, input/output boundaries, all 729 quiz combinations, eight guide steps, and the 150-second reset.
- `verify-dom.cjs` passed with jsdom 26.1.0: relevant theme notes, persistent location/income/Education filters, restored character sidebar previews, all 25 profile sections, technology/activity controls, separate character histories and drafts, stale generation cancellation, retained quiz results, publication placeholders, all eight guide steps, and reset behavior. Persistent storage APIs were deliberately unavailable in this simulation; none were accessed.
- Every application JavaScript file parsed. Python build and packaging helpers compiled. Entry-page asset references resolved.
- The complete model and each byte chunk matched the pinned SHA-256. Native and compatibility runtime files matched their manifest checksums. `prepare-pages.py` prepared a static output successfully.
- `content/world.json` is byte-for-byte identical to round 3. `intro-clock.js`, `intro-config.js`, `intro.css`, `idle-player.js`, and `content/quiz.json` are unchanged. Visible source disclosures were removed from the quiz presentation only.
- Production `index.html` uses the 150-second idle threshold. The long test threshold existed only in an excluded QA preview.

## Browser checks

Chromium checks covered the actual desktop viewport and 320 x 740, 390 x 844, and 1920 x 1080 viewport frames.

- The map used most of the kiosk canvas width. At 1920 x 1080, its viewport was about 1498 x 700 CSS pixels, with no clipped node buttons. The previously fixed tall layout has been replaced by aspect-aware horizontal spacing.
- Education controls selected the matching people. Regional Materials showed two proximity notes, Climate Change three, and Education five. Location and income filters remained available.
- Clicking Ken and Sophia restored their sidebar information and profile/chat actions. On the 320-pixel phone, selecting a person brought the preview to the top of the content area below the fixed navigation. Returning to world context worked.
- Mobile views had no horizontal content overflow. Phone entry defaults to the list; the map remains available for panning and zooming. Profiles still showed all five life areas and the compact graph.
- The active chat portrait was substantially larger. Five named character buttons remained visible. Loading cancellation worked even while progress changed. Device-file requests were intercepted immediately without inference.
- The bundled generative model loaded from same-site assets and produced new first-person replies to questions about an imagined weekend, company/family balance, teeth brushing, and spending time with Ken's son. It handled more than topic matching and switched personas. These are smoke checks, not a comprehensive answer-quality evaluation.
- The final short-context CPU setup took approximately 49.6 seconds for the teeth-brushing reply and 76.3 seconds for Ken's reply. These are observations in this cloud browser, not performance promises. Earlier, longer prompts were slower. The actual exhibit hardware needs testing.

## Limits

No GitLab repository or deployment was changed. GitLab Pages deployment, real kiosk touch hardware, WebGPU acceleration, and Safari/Firefox compatibility were not exercised here. Compatibility assets are bundled and checksummed, and CPU fallback was exercised.

The small model can hallucinate, contradict a persona, or follow instructions poorly. Prompt rules and boundary checks reduce risk but are not comprehensive moderation. Imagined replies appear in red and do not change the fixed narratives. A curated corpus and testing of representative exhibit questions are appropriate next steps; a Wikipedia dump is not required for everyday conversation.

Everything runs in browser memory using bundled static assets. Public static assets remain inspectable by visitors. No confidential-corpus protection is claimed.
