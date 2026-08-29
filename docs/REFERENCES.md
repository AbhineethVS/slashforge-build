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
  podcasts.

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
- Do not add a dependency merely because it appears in a reference project.
- Record copied code and nontrivial assets in `THIRD_PARTY_NOTICES.md`.
