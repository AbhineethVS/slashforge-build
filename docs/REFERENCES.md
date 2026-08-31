# References and Licenses

## Product and architecture references

### Open Notebook

- Repository: https://github.com/lfnovo/open-notebook
- License: MIT
- Useful patterns: notebooks and sources, asynchronous ingestion, chunk-level
  embeddings, source-scoped retrieval, context controls, and clickable
  citations.
- Deliberately not adopted: SurrealDB, LangGraph for simple chat,
  `surreal-commands`, multi-provider configuration, transformations, and
  podcast orchestration.

Open Notebook's default chat often places selected source text directly in the
prompt, while its separate Ask flow uses a more expensive multi-step retrieval
graph. This project instead uses one predictable query-embed-retrieve-answer
pipeline.

If implementation later copies a source file or substantial code, preserve the
upstream MIT license and `Copyright (c) 2024 Luis Novo` in a
`THIRD_PARTY_NOTICES.md` file.

### Agent Skills

- Anthropic examples and specification:
  https://github.com/anthropics/skills
- UI UX Pro Max:
  https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

The project skills follow the standard directory pattern of one skill folder
with a required `SKILL.md`. They are original, project-specific instructions.
No datasets, scripts, or skill text from either repository are copied.

UI UX Pro Max is MIT-licensed and may later be installed for Cursor through its
official CLI if its full searchable design catalog is useful. It is not a
runtime dependency of this application.

## OpenAI references

- File Search guide:
  https://developers.openai.com/api/docs/guides/tools-file-search
- Model catalog:
  https://developers.openai.com/api/docs/models
- GPT-5 Mini:
  https://developers.openai.com/api/docs/models/gpt-5-mini
- API billing versus ChatGPT billing:
  https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform
- Prepaid API billing:
  https://help.openai.com/en/articles/8264644-what-is-prepaid-billing

OpenAI managed File Search remains a future simplification option. The first
release uses custom page-aware retrieval because the product requires trusted
page links, not only file-level citations.

## Sarvam speech references

- Models overview:
  https://docs.sarvam.ai/api/getting-started/models
- Saaras v3 speech-to-text overview:
  https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview
- Speech-to-text REST API:
  https://docs.sarvam.ai/api-reference/speech-to-text/transcribe
- Bulbul v3 text-to-speech overview:
  https://docs.sarvam.ai/api/api-guides-tutorials/text-to-speech/overview
- Bulbul v3 model guide:
  https://docs.sarvam.ai/api/getting-started/models/bulbul
- Text-to-speech REST API:
  https://docs.sarvam.ai/api-reference/text-to-speech/convert
- Authentication and server-side key handling:
  https://docs.sarvam.ai/api-reference/authentication
- Credits and rate limits:
  https://docs.sarvam.ai/api-reference-docs/ratelimits.mdx

Phase 6 uses Sarvam only for English-India speech processing: Saaras v3
transcribes bounded push-to-talk input and Bulbul v3 narrates backend-owned
validated text. OpenAI remains the content-generation provider. Confirm current
model availability, request limits, pricing, audio formats, voice selection,
and redistribution terms before implementation or packaging generated audio.

## Framework and platform references

- React documentation: https://react.dev/
- Vite documentation: https://vite.dev/
- FastAPI documentation: https://fastapi.tiangolo.com/
- PyMuPDF documentation: https://pymupdf.readthedocs.io/
- NumPy documentation: https://numpy.org/doc/
- Azure App Service Python quickstart:
  https://learn.microsoft.com/en-us/azure/app-service/quickstart-python

## Dependency policy

- Verify each dependency's current version, maintenance state, and license at
  implementation time.
- Pin direct dependencies and commit lock files.
- Prefer the official OpenAI SDK over provider abstraction layers.
- Use Sarvam only behind the backend speech boundary; do not introduce a
  general model-provider abstraction.
- Do not add a dependency merely because it appears in a reference project.
- Record copied code and nontrivial assets in `THIRD_PARTY_NOTICES.md`.
