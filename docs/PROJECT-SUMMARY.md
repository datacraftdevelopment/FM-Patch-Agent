# FileMaker Patch Agent — Project Summary

*Last updated: June 12, 2026*

## The problem we're solving

When changes are made to a FileMaker system — new tables, new fields, new scripts — someone has to move those changes from the development copy into the production system that people actually use. Today that's done by hand: open both files, compare them, and rebuild each change in production one at a time. It's slow, it's easy to miss something, and a mistake lands in the system everyone depends on.

## What we built

An assistant-driven toolkit that automates that whole process:

1. **Snapshot both files.** The tool takes a complete structural snapshot of the development file and the production file — no manual exporting, no clicking through menus.
2. **Compare them.** It finds every difference: things added, things removed, things changed.
3. **Show you a checklist.** The differences appear on a simple webpage. Each one has a checkbox and a color rating — green for changes the tool can apply safely and automatically, yellow for changes that get extra safety checks, red for the few things that still need a human to do by hand. You tick the boxes for what you want moved over.
4. **Apply the changes safely.** The tool makes a backup of production, does a full rehearsal of the update on a throwaway copy first, and only then applies your selected changes to the real file. If anything goes wrong, it automatically puts the backup back.
5. **Double-check the result.** Afterward, it takes a fresh snapshot and confirms every selected change actually arrived. We never take the software's word for it — we look.

Notably, the "turn a comparison into an applied update" step doesn't exist anywhere else — FileMaker's own documentation says to do it manually. This fills that gap.

## How we tested it

- **72 automated checks** run the entire toolkit from end to end, including a full dress rehearsal: two real FileMaker files that differ by six tables, dozens of fields, and several layouts. The tool found all 104 differences, applied every one of them to a copy of "production," and the verification step confirmed the two files ended up structurally identical.
- **An independent review panel** (multiple AI reviewers, each finding double-checked by others) went over the finished system looking for hidden problems. It found two serious ones — both cases where the update would *report* success but quietly get something wrong, like a formula arriving disabled or a record-numbering counter being reset. Both were fixed, and new tests were added so they can't quietly come back.
- **Every safety claim was proven, not assumed.** We deliberately tested the failure paths too: what happens when a file is open, when an update fails halfway, when the wrong items are selected. The tool refuses, restores, or stops with a clear message in each case.

## Where we are now

| | |
|---|---|
| Build the toolkit | ✅ Done |
| Test it end-to-end on sample files | ✅ Done — all 72 checks passing |
| Independent review + fixes | ✅ Done |
| Written procedures for running it | ✅ Done |
| Trial run on the real dev/production files | ⏳ Next — waiting to schedule |
| Support for server-hosted files | 📋 Planned for version 2 |

## What's next

The next step is a supervised trial run with the actual development and production files (on copies first, as always). After that, the workflow is ready for routine use: make changes in development, run the comparison, tick the boxes, and the changes land in production — backed up, rehearsed, and verified.
