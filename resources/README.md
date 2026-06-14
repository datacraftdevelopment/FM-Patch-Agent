# resources

The scaffolder (`scripts/gen_scaffold.py`) patches a spec onto a copy of a **starter
file you supply** — so "build from scratch" is really "patch an empty file." A good
starter is a small base that bakes in your standards (naming, security, base layouts,
and the ProofKit web-viewer footprint if you want the web-app step). Point the
scaffolder at it:

```
python scripts/gen_scaffold.py gen specs/crm.json your-starter.fmp12 -o patch.xml
```

A bundled starter isn't included here because FileMaker stamps developer metadata into
the file. Make your own blank/base file in FileMaker and use that.
