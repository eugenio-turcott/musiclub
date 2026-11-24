<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Musiclub releases and repository presentation

- Commit subject: `Musiclub Updates - V.X.X.X`, matching `package.json`. Describe the change and validation in the body.
- Update `README.md` with every code, configuration or documentation change. Run `npm run docs:update` before committing; `npm run docs:check` verifies generated files stay current.
- Public patch notes and GitHub Releases contain one consolidated entry per major version (`V.X.0.0`). Keep detailed patch history internally; do not publish a new GitHub Release for a minor or patch update.
- Keep the README concise and visual, using the existing Musiclub artwork. Technical instructions belong in `docs/`.
- Preserve published commit and tag history. Changing historical subjects/authors requires an explicit history-rewrite decision.
