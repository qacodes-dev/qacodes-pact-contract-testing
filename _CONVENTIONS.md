# Sample-repo build briefs — conventions

These briefs build the **real GitHub repositories** that back the qa.codes
"Project Samples" (`/practice/project-samples/<slug>`). Each `<slug>.md` in this
folder is a **self-contained, paste-ready prompt** for a fresh Claude Code
session pointed at the (currently empty) repo.

## The golden rule
Each repo **must match its qa.codes sample page exactly** — same tech stack,
folder structure, run commands, environment variables, reporting and CI. The
source of truth is the committed data record:

```
data/practice/project-samples/<slug>.ts
```

If the brief and the data record ever disagree, the **data record wins** (or fix
the data record in a follow-up). Do **not** invent a different target system, a
different folder layout, or different commands than the sample page documents.

## Repos
- Org: `github.com/qacodes-dev`, repo name `qacodes-<slug>`.
- Clone URL: `https://github.com/qacodes-dev/qacodes-<slug>.git`.
- The repos already exist and are empty — you are filling them, not creating them.

## Every repo must ship
1. **A real, runnable project** — not stubs or placeholders. A small but genuine,
   meaningful test set (a handful of well-designed specs, not hundreds).
2. **`README.md`** covering: overview, prerequisites, install steps, run commands
   (matching the sample page), environment config, folder structure, reporting,
   a CI badge, and a link back to `https://qa.codes/practice/project-samples/<slug>`.
3. **`.env.example`** with every documented variable (no real secrets committed).
4. **`LICENSE`** — MIT, holder "qa.codes".
5. **`.gitignore`** appropriate to the stack.
6. **CI** — a GitHub Actions workflow that installs, runs the suite **headless**,
   uploads the HTML report as an artifact (`if: always()`), and is **green on the
   default branch**. Use built-in retries where flakiness is expected; never hard
   sleeps.

## Target system under test (SUT)
Use exactly the SUT the sample's `overview` names (e.g. Sauce Demo `saucedemo.com`,
`restful-booker`, `reqres.in`). These are stable public demos — do not swap them.

## Handoff workflow (for the human)
Allocate **one brief per Claude Code session**. Start each session in an empty
clone of the matching repo and paste the brief. Each brief references this file
for the shared rules above.

## Acceptance (Definition of Done per repo)
- `git clone` → follow README → the documented run command works locally.
- CI is green on the default branch and publishes the HTML report artifact.
- Folder structure and commands match the qa.codes sample page.
- README links back to the sample page; no secrets in git.
