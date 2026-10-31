# Chat scope update

This update changes only chatbot behavior. The existing application files that changed are `conversation.js`, `app.js`, and their two embedded script blocks in `index.html`. Every other existing file is byte-for-byte identical to the round 4 ZIP. The three added files are this note and the focused scope test scripts. The internal folder name is preserved for replacement compatibility.

The intro, map, filters, profiles, images, typography, quiz, event section, canonical JSON, existing fallback replies, model weights, WASM runtime, model settings, reset timing, and file/database restrictions are unchanged.

## Conversation behavior

The character can discuss their own life, background, relationships, routines, opinions, and the established themes or technology of this imagined 2048. Everyday questions and appropriately grounded discussions of climate, inequality, displacement, care, privacy, or community remain in scope.

A deterministic check now runs before waiting for or invoking the model. Standalone calculations, code-writing tasks, homework, unrelated requests, sports picks, betting, live facts, invented future officeholders, and attempts to switch the model into an unrelated assistant role receive a short character-specific redirect. Saying “in 2048” does not override those task boundaries. Explicit topic buttons cannot override a rejected question.

Short follow-ups use the most recent accepted character exchange. A follow-up after a rejected request cannot reopen that request. Rejected questions and their redirects are excluded from subsequent model context. Each person's conversation remains separate.

The model prompt repeats the conversation scope and the selected person's fixed background. Replies are checked before display for reported betting/score claims, unrelated calculations or code, unsupported numeric claims, explicit age contradictions, unsafe content, or markup. A rejected generation falls back to an established topic reply or a short in-character boundary response. Imagined everyday replies retain the existing red presentation.

These checks are deliberately conservative. They are not a complete semantic classifier, comprehensive fact checker, guarantee against prompt injection, or a penetration test. The model can still make mistakes. No additional model capabilities, file access, external searches, storage, or databases were introduced.

## Checks performed

- `node verify-scope.cjs`: 375 accepted/rejected cases across five characters, plus follow-up isolation and generated-output checks.
- `node verify.js`: existing content, graph, intro timing, eight guide steps, all 729 quiz combinations, runtime restrictions, and idle reset checks passed.
- `verify-dom.cjs`: the existing complete interaction regression passed.
- `verify-scope-dom.cjs`: clear off-topic requests caused no model inference or waiting for model startup; subsequent legitimate questions used clean context; in-scope follow-ups worked; unsupported generated replies were withheld; conversations remained separate.
- Browser smoke check: the exact math and Knicks/Ravens examples immediately redirected while the model was still loading. A question about automation in Leo's work reached the same bundled model and produced a response. That CPU generation took about 73 seconds in this test environment; this update does not change the inference runtime or promise faster in-scope generation.
- Final common introductory-question additions were covered by the automated scope tests. The shared preview URL was taken over by another active project before the final screenshot, so that project was left untouched. No final screenshot or new browser security audit is claimed.
- All non-chat files and all non-chat portions of `index.html` were compared against the original round 4 ZIP and matched exactly.

To run the optional DOM checks, use jsdom 26.1.0. No repository or website deployment was changed.
