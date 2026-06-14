# specs/

Schema specs for the scaffold-file workflow — one JSON file per built solution
(e.g. `crm.json`). The spec is the living source of truth for a built file's
schema; re-running the workflow reconciles the file to match (additive-only).

Example spec used by the scaffold-file workflow.
never hand-edited. Format: docs/specs/2026-06-12-schema-scaffold-design.md.
Built `.fmp12` files land in `builds/` (gitignored); specs are committed.
