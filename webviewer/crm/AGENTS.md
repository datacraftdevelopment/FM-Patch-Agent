<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->


  ## ProofKit Documentation
  ProofKit is a set of packages and opinions designed to work really well with FileMaker.	Use the ProofKit docs as the primary reference for this project: https://proofkit.proof.sh/llms.txt

## Data Loading
Always use tanstack/react-query instead of useState and useEffect when loading data or calling FileMaker scripts with fmFetch.
  
