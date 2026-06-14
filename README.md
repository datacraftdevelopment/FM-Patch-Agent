# FM-Patch-Agent

An agent-run toolkit for FileMaker 2026 that does two things people have always done by hand:

1. **Patch** changes from one file into another (dev to production) without rebuilding them click by click.
2. **Build** whole files from a written spec, web UI included.

It runs as a folder of plain-English workflows and tested Python tools that an AI coding agent (Claude Code, Codex, or similar) reads and runs. FileMaker 2026 made this possible by giving outside tools real read and write access to the file format. Everything here uses tools that ship today: no SDK, no preview features.

There's a talk that walks through the whole thing: **https://fm-patch-agent.vercel.app**

---

## The idea: workflows, agent, tools

The repo is the agent. There's no app to install. What makes it *this* agent rather than a generic chatbot is the folder layout:

- **`workflows/`** — what to do, in plain English. One Markdown file per job, written like an onboarding doc for a new hire. RFC 2119 keywords (MUST / SHOULD / MAY) tell the agent its degrees of freedom: MUST means stop and escalate on failure, SHOULD means skip with a reason, MAY means use judgment.
- **`scripts/`** — how to do it. Python that does the deterministic work: parse XML, compute a diff, generate a patch. 131 automated tests stand behind them, so a change that breaks patching gets caught in seconds.
- **The agent** sits in the middle. It reads a workflow, runs the tools in order, and makes the calls a human would: proceed, retry, skip, or stop and ask.

Why split it that way? An agent improvising five steps at 90% accuracy each finishes correctly 59% of the time. So everything that can be exact code becomes exact code, and the agent spends its judgment only where judgment is actually needed.

**Use this pattern for your own work.** The patch pipeline is one example. The shape (write the procedure as Markdown, push the deterministic parts into tested scripts, let the agent orchestrate, log every run, fold what you learn back into the workflow) works for anything repetitive your team can write down. Quotes, reports, data moves, file maintenance. Clone the layout, write a new `workflows/your-thing.md`, give it tools in `scripts/`, and go.

---

## What's in the box

```
workflows/         The SOPs — export-xml, diff-review, patch-apply, scaffold-file
scripts/           The pipeline (six chained tools) + the scaffolder + 131 tests
specs/             Example build spec (crm.json) for the scaffolder
resources/         fmbase.fmp12 — a small starter file new builds grow from
docs/              Non-technical summary, the patchability matrix, the concept piece
webviewer/crm/     An example React web app built into a .fmp12 via ProofKit (proofkit.proof.sh)
CLAUDE.md          Agent instructions (the framework rules)
```

### The patch pipeline

Six tools chain in a fixed order, each consuming the previous one's output:

```
fm_export.py     .fmp12 -> Save-as-XML        (headless, on a closed local file)
saxml_parser.py  .xml   -> parsed/            (per-catalog JSON snapshots)
saxml_diff.py    dev vs prod -> diff.json     (added / removed / changed, with safety tiers)
make_review.py   diff.json -> review.html     (you tick the boxes in a browser, download selection.json)
gen_patch.py     dev + prod + selection -> patch.xml   (the FMUpgradeTool patch — the piece nobody else had)
apply_patch.py   target .fmp12 + patch.xml    (backup -> validate -> smoke -> apply -> verify by re-export)
```

The thing that didn't exist anywhere before this: **turning a diff into a patch automatically.** Claris's own documented path is to hand-write the patch XML. Soliant's Mislav Kos wrote the definitive walkthrough on that and asked, out loud, for someone to automate it. This is that automation.

It's careful on purpose. You approve every change with a checkbox. Changes it can't make safely, it refuses (those stay yours, in FileMaker). It rehearses on a throwaway copy before it touches the real file. And it never trusts the tool's success message: the Upgrade Tool will report success on a change that silently did nothing, so every apply is followed by a re-export and re-diff that proves each change actually landed.

**Dependency-aware review.** Tick a script in the review page and the fields and layouts it calls come along, checked for you. The selection is always complete before it builds.

### Building new files

A spec is a plain shopping list saved as JSON: these tables, these fields, these relationships. The scaffolder turns it into one big patch against a starter file, runs it through the same gates (validate, rehearse, apply, verify), and checks the result back against the spec.

```
gen_scaffold.py gen     specs/<name>.json + starter file -> patch.xml + expected.json
apply_patch.py  apply   backup -> validate -> smoke -> apply
gen_scaffold.py verify  expected.json + re-export -> spec coverage check
```

Building from scratch is just patching an empty file. Same machinery, pointed at `resources/fmbase.fmp12`, a small generic base. The `webviewer/crm/` folder is an example of the last step: a React web app deployed into a web viewer *inside* the .fmp12 via [ProofKit](https://proofkit.proof.sh), so a finished solution is modern UI plus FileMaker data in one file.

---

## What patches cleanly, and what doesn't

Honest about the edges. Full detail in [`docs/patchability-matrix.md`](docs/patchability-matrix.md).

| | Add | Change | Remove |
|---|---|---|---|
| Tables, fields, table occurrences, relationships, layouts | green | mostly manual | caution |
| Scripts, value lists, custom functions | caution | caution (field/script) | caution |
| Accounts, privilege sets, custom menus, themes, file security | by hand | by hand | by hand |

Green is round-trip proven. Caution needs explicit sign-off (`--allow-caution`) and a re-check after. Red the tool won't touch. The split exists because Save-as-XML only knows how to *add* things; every change and delete is hand-built, and the security and UI catalogs are off-limits.

---

## Setup

You need:

- **FileMaker 2026** (26.x). Earlier versions export a different XML format.
- **The Claris command-line tools** — `FMDeveloperTool` and `FMUpgradeTool`, installed with FileMaker Server's command-line tools (they land in `/usr/local/bin`). The pipeline shells out to these; they do all the reading and writing of the file, with FileMaker Pro never opening.
- **Python 3.10+**.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest scripts/tests        # 131 tests; integration/E2E skip without the Claris tools
```

The tests that need the Claris CLI tools skip gracefully when they aren't present, so the suite runs anywhere. Files must be closed for export and patch (this version handles local files; hosted files are a known next step).

---

## Run it

```bash
# Patch dev changes into prod (run on copies first, always)
.venv/bin/python scripts/fm_export.py dev.fmp12  -o dev.xml
.venv/bin/python scripts/fm_export.py prod.fmp12 -o prod.xml
.venv/bin/python scripts/saxml_parser.py dev.xml  -o dev_parsed
.venv/bin/python scripts/saxml_parser.py prod.xml -o prod_parsed
.venv/bin/python scripts/saxml_diff.py dev_parsed prod_parsed -o diff.json
.venv/bin/python scripts/make_review.py diff.json -o review.html   # tick boxes, download selection.json
.venv/bin/python scripts/gen_patch.py dev.xml prod.xml diff.json selection.json -o patch.xml
.venv/bin/python scripts/apply_patch.py prod.fmp12 patch.xml       # backup, rehearse, apply, verify

# Build a new file from a spec
.venv/bin/python scripts/gen_scaffold.py gen specs/crm.json resources/fmbase.fmp12 -o patch.xml
```

Read the matching file in `workflows/` before running a workflow. Each one carries the gotchas earlier runs turned up. Never skip the validate -> smoke -> apply -> verify sequence.

---

## Standing on

- **Mislav Kos / Soliant Consulting** — the two articles that mapped this terrain and asked for the tool: ["Using FMUpgradeTool to Patch FileMaker Apps"](https://www.soliantconsulting.com/blog/using-fmupgradetool-to-patch-filemaker-apps/) and ["FileMaker SaveAsXML and FMUpgradeTool: Building Automated Deployments"](https://www.soliantconsulting.com/blog/filemaker-saveasxml-fmupgradetool-building-automated-deployments/).
- **[`ooe-fm`](https://github.com/mislavkos/ooe-fm)** (Mislav Kos, MIT) — the "one of everything" file used as a conformance corpus (`scripts/tests/fixtures/ooe/`).
- **[fm-xml-export-exploder](https://github.com/bc-m/fm-xml-export-exploder)** (bc-m, with Soliant's lossless mode) — splits the giant XML per object so it can be diffed at all.
- **[ProofKit](https://proofkit.proof.sh)** (Proof+Geist) — the web-app layer for the build step.

---

## License

MIT. See [LICENSE](LICENSE).
