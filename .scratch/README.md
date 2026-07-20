# `.scratch/`

Local-only working directory. Everything here is ignored by git except this
file and `.gitignore`, so nothing you drop in ends up in a commit or a PR.

## What belongs here

- Throwaway scripts, one-off queries, and repro cases
- Screenshots, recordings, and exported assets used while working on a task
- Logs, profiling output, database dumps, and other large local artifacts
- Draft notes and intermediate output from a multi-step task
- Sample data pulled from a real environment for debugging

## What does not belong here

- Anything another developer or CI needs — that goes in the repo proper
  (`scripts/`, `docs/`, `docs/assets/`, test fixtures next to their tests)
- Secrets and credentials — use `.env.local`, which is already ignored
- Anything you want to survive a `git clean -xdf`

## Notes for agents

- Prefer `.scratch/` over `/tmp` for temporary files during a task, so the
  work stays visible to the developer and is cleaned up with the repo.
- Namespace your files (`.scratch/<short-task-name>/…`) rather than piling
  loose files into the root of the folder.
- Never reference a `.scratch/` path from committed code, docs, tests, or
  config — it does not exist on anyone else's machine or in CI.
- Do not commit anything from here. If something turns out to be worth
  keeping, move it into the tracked part of the repo and say so explicitly.
- Treat contents as disposable: it is safe to assume anything here can be
  deleted, so don't store the only copy of something important in it.
