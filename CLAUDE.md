# CLAUDE.md

Guidance for an AI coding agent working in this repository.

This is a lean agent framework wrapped around a FileMaker 2026 patch-and-build pipeline. You orchestrate, decide, and improve. Be pragmatic, concise, and reliable. Read [README.md](README.md) first for what the project does.

---

## How this project works

```
FM-Patch-Agent/
├── CLAUDE.md          # You are here — agent instructions
├── README.md          # Human overview: the pattern, the pipeline, the build flow
├── workflows/         # SOPs in Markdown — what to do and when
├── scripts/           # Python tools — the deterministic work, with tests
├── specs/             # Example build specs for the scaffolder
├── resources/         # fmbase.fmp12 — the starter file new builds grow from
└── docs/              # Reference: summary, patchability matrix, concept piece
```

**Workflows** define *what* to do. **Scripts** define *how*. **You** sit in between: reading workflows, calling scripts in the right order, handling errors, deciding when to proceed, retry, skip, or escalate.

Why separate them: if you do everything inline, errors compound. 90% accuracy per step is 59% over five steps. Push deterministic work into scripts so you can focus on decisions.

---

## Before you start any task

1. Read the relevant workflow file in `workflows/`.
2. Check `scripts/` for an existing tool before writing a new one.
3. Run the suite to confirm a clean baseline: `.venv/bin/python -m pytest scripts/tests`.
4. Ask clarifying questions if the request is ambiguous. Don't guess.

---

## Pipeline data flow

The six patch-pipeline scripts chain in this fixed order, each consuming the previous artifact:

```
fm_export.py      .fmp12 → SaXML .xml         (headless FMDeveloperTool on a closed local file)
saxml_parser.py   .xml → parsed/              (per-catalog JSON snapshots)
saxml_diff.py     dev parsed/ vs prod parsed/ → diff.json   (added/removed/modified, patchability tiers)
make_review.py    diff.json → review.html     (operator ticks boxes → downloads selection.json)
gen_patch.py      dev.xml + prod.xml + diff.json + selection.json → patch.xml   (FMUpgradeTool format)
apply_patch.py    target .fmp12 + patch.xml   (backup → validate → smoke → apply → verify by re-export)
```

The scaffolder is a sibling workflow that builds or evolves files from a schema spec:

```
gen_scaffold.py gen     specs/<name>.json + target export → patch.xml + expected.json
apply_patch.py  apply   backup → validate → smoke → apply
gen_scaffold.py verify  expected.json + re-export → spec coverage check
```

### Cross-cutting contracts (easy to violate when touching one script in isolation)

- `diff.json` includes `ignored=True` items for display only; anything generating patches MUST skip them. Ignore patterns live in `scripts/saxml_ignore.json`.
- `duplicate_name=True` items carry only the last same-named object and are forced to patchability `manual`. Resolve duplicates in FileMaker before patching.
- Patchability tiers: `proven` (auto-patchable), `caution` (needs `gen_patch.py --allow-caution`), `manual` (the generator rejects these; handle in FileMaker directly).
- Files must be closed for export and patch (this version is local files only; hosted is a future step). Never trust FMUpgradeTool's success banner. The verify step is mandatory.

---

## Run logging

Each workflow has a single log file in `logs/` (e.g., `logs/workflow-name.log.md`), its run journal, separate from the SOP.

After every run, append an entry:

```markdown
## YYYY-MM-DD HH:MM
- **Status:** Success / Partial / Failed
- **Records:** X/Y processed
- **Issues:** What went wrong (or "None — clean run")
- **Learnings:** What was discovered that should inform future runs
```

Keep the last ~10 entries. When a learning is durable, fold it back into the workflow or script, then the old log entry can roll off. Run → Log → Reflect → Update → next run is smarter.

---

## Constraint keywords (RFC 2119)

| Keyword | Meaning | On failure |
|---------|---------|------------|
| **MUST** | Non-negotiable | Stop and escalate |
| **SHOULD** | Strong preference | Skip with a documented reason |
| **MAY** | Optional | Use judgment |

---

## Error handling

| Type | Examples | Action | Retries |
|------|----------|--------|---------|
| **Retriable** | Timeout, 429, 503 | Retry with backoff | 3 max |
| **Skip** | 404, validation fail, already processed | Log and continue | 0 |
| **Fatal** | 401 auth, missing env vars, schema error | Stop, escalate | 0 |

Default: when in doubt, skip and continue. Processing 90% beats failing at 10%.

---

## Autonomy

**Proceed without asking:** running existing scripts, reading workflows, retrying transient errors (max 3), skipping bad records, logging results.

**Ask first:** creating new workflows, modifying anything destructive, uncertain which approach to take.

**Fix then show:** non-destructive bug fixes in scripts, new error handling, updating run logs.

**Always escalate:** fatal errors, success rate under 50%, ambiguous requirements, three consecutive failures.

---

## Anti-patterns

Do not: retry auth failures (401 is invalid, not transient); parse a tool's output without validating it; trust FMUpgradeTool's success banner without the verify step; run a patch against a file that isn't closed; bypass the validate → smoke → apply → verify sequence; touch the real file before the rehearsal on a copy passes.

---

## Self-healing

When something breaks: diagnose, fix the script to handle the case, add a test that pins it, log the run with the learning, and update the workflow if the process itself needs to change. The system gets stronger and remembers why.
