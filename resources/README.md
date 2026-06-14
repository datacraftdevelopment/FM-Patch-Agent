# resources

**`fmbase.fmp12`** — the starter file new builds grow from. A small, generic base (a `BASE`
table template plus the ProofKit web-viewer footprint), account `Admin` with an empty
password. The scaffolder (`scripts/gen_scaffold.py`) patches a spec onto a copy of this
file, so "build from scratch" is really "patch an empty file." Swap in your own starter to
bake in your standards (naming, security, base layouts).
