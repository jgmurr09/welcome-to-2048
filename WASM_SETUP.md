# Browser conversation setup

This round replaces the embedding-only topic matcher with a generative language model. The model composes first-person replies, sees a short record of the selected character, and receives the last exchange for follow-ups. Familiar topic buttons remain available when the model is loading or unavailable.

## Included stack

- wllama 3.8.1, using llama.cpp in a browser worker.
- SmolLM2-360M-Instruct, Q4_K_M quantization, about 258 MiB of model data.
- A same-site compatibility WASM build for browsers without the newer WebAssembly features.
- Automatic WebGPU acceleration when an adapter is available; single-thread CPU WASM otherwise. No cross-origin-isolation headers are required for the single-thread path.

The ZIP includes the model, runtime, compatibility runtime, license notices, and checksums. Nothing needs to be downloaded from a model hub or CDN at runtime. The model is split into six ordinary byte chunks below 50 MiB each, so there is no individual 270 MB Git object. The worker joins the chunks as a Blob; they are not GGUF shards.

## Local review

Extract the whole archive. Double-click `index.html` to review the intro, map, profiles, quiz, event placeholders, and known-topic conversation buttons. Full generative chat requires HTTP or HTTPS because it uses browser workers and WebAssembly modules. A `file://` page explains this limit.

For the full experience, serve the folder with a static web server. HTTPS is the intended kiosk setup and enables WebGPU on supported browsers. The model loads on first opening chat. Progress appears above the conversation. CPU-only generation can be slow, especially on a phone; the browser remains interactive, and switching people or closing chat cancels the pending reply. Input and model assets are kept in working memory. The model stays loaded while you explore during a visit. The 150-second idle reset clears conversations and model prompt state by releasing the worker; the next visit loads the model again.

## GitLab Pages

1. Put the project files, including `runtime/`, in the intended GitLab repository.
2. Run `python3 build-local.py` after editing the content or application code.
3. Run `python3 prepare-pages.py --output public` to validate every model/runtime checksum and copy the static deliverable.
4. The supplied `.gitlab-ci.yml` provides a manual Pages job. It performs those commands and publishes `public/`. Start that job when ready.

No deployment has been performed. Repository and Pages quotas still apply to the roughly 290 MB uncompressed site. If the repo uses a project URL such as `/group/project/`, keep the relative folder structure: all runtime paths resolve beneath that project, rather than the domain root.

## What the model can access

The application gives it only the selected character's memory card, a relevant story passage, a short shared-world description, the current question, and at most one previous exchange. These are plain values passed to a dedicated worker.

The model has no tools, file picker, device filesystem mount, browser-history reader, microphone, camera, account connection, database connection, or live search capability. The worker allows fetch only from the same site origin and project path. Requests omit credentials and bypass the HTTP cache. wllama receives an inert RAM-only cache backend and a model Blob, rather than its default persistent cache or URL downloader. Model prompt reuse is RAM-only. There are no application calls to Local Storage, IndexedDB, OPFS, or service-worker storage.

WASM uses a virtual filesystem in memory to read its model. This is unrelated to opening files on the visitor's computer. Hosting, operating systems, and browsers may keep their own access logs or process memory; the application does not create a conversation database.

## Public content and open-source software are different

The runtime is MIT licensed and the model is Apache 2.0 licensed. That says how the software and weights may be used, not where visitor questions go. Questions are not sent to the model author or a model service.

Static site assets are visible to visitors who can load the site. The embedded character corpus cannot be secret on public GitLab Pages. A future confidential corpus would need authenticated hosting and authorization. There is no credential or hidden-secret mechanism in this prototype.

## Character freedom and boundaries

`content/world.json` remains unchanged. The source biographies, themes, World Truths, and artifacts remain the canonical record. `content/personas.json` contains a concise memory card, voice direction, temperature, and a fixed sampling seed for each character. These cards summarize supplied facts. `content/chat-replies.json` contains the immediate fallback replies.

Generated conversation can imagine ordinary routines, preferences, and opinions, and should frame invented details as possibilities. Generated messages are labeled **IMAGINED CONVERSATION** and shown in red. They are not added to the canonical corpus or reused as permanent character facts. Edit `memoryCard`, voice direction, and the source JSON to tune recall. A curated, reviewed corpus is more useful here than importing a whole Wikipedia dump: the model already has general language knowledge, and the short context should prioritize this world.

Input boundaries intercept explicit sexual content, self-harm disclosures, harmful-instruction requests, real professional-advice requests, and attempts to access device files or override the prompt. Output checks run before a generated reply is displayed. These are prototype controls, not a comprehensive moderation system or a guarantee against unsafe output, hallucinations, contradictions, or prompt injection. Test representative exhibit questions on the actual kiosk before unattended use. Temperature changes style and variation; a fixed seed does not guarantee identical output across browsers or devices.

## Upstream references

- [wllama and API examples](https://github.com/ngxson/wllama)
- [Self-hosted compatibility assets](https://www.npmjs.com/package/@wllama/wllama-compat)
- [SmolLM2 model card and limitations](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct)
- [Pinned GGUF quantization](https://huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF/tree/7be6f65f1db715fe5dc5a4634c0d459b4eed42ec)
- [GitLab Pages](https://docs.gitlab.com/user/project/pages/)
