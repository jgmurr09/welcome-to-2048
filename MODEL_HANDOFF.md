# Persona conversation boundary

This build includes a working static browser WASM retrieval path. See `WASM_SETUP.md` for hosting and access behavior.

`content/world.json` remains canonical. Stable source IDs use paths such as `characters.ken.sections.home`. `content/chat-replies.json` provides first-person wording grounded in those sections; the original passages remain available through source disclosures. Persona voice and topic chips are separate from facts.

`FutureConversation.answer(personId, question, explicitTopic, previousTopic)` handles established topics and undefined-detail boundaries. `FuturePersonaRuntime.chooseTopic(personId, question)` can match unfamiliar wording to a grounded topic through MiniLM embeddings. Candidate records are limited to the selected character. It returns a topic ID or null, never generated story prose.

The existing `FutureConversation.buildContext(personId, question, history)` contract remains available for a later generative adapter. It includes the character, related themes, truths, artifacts, voice policy, and bounded history. It makes no network request.

`FutureQuiz.context()` returns completed visitor choices and source IDs, or null. Those choices are visitor interests, not a new character biography or changes to the world.

## Boundaries for future expansion

1. Only supplied passages establish personal facts. Shared world truths do not prove personal ownership or habits.
2. Keep unknown details undefined. Ken’s teeth-brushing question does not establish a toothbrush, brand, device, or routine.
3. Retain source IDs and escape rendered text.
4. Keep memories and canonical knowledge separate. Do not write visitor suggestions into the source JSON.
5. Cancel pending work on character switches and reset. Clear messages, drafts, quiz answers, and any future model conversation state.
6. Mark any newly invented world or character details with the bright red `.new-detail` style for author review.

The current model performs matching, so temperature is not used to invent personality. The old temperature/seed values in `content/personas.json` remain draft settings for a future generative adapter, not guarantees of determinism. Source replies and semantic retrieval are bounded by the existing content.
