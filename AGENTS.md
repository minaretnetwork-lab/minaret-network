<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project guidance

- Read `README.md` for the current Vercel/cloud Supabase setup. Dated handoffs and local-stack scripts describe retired infrastructure. Read deeper documentation only when the task calls for it.
- Inspect the relevant implementation before adding a pattern. Preserve established architecture and conventions unless there is a concrete reason to change them. Keep edits focused and leave unrelated code alone. Use npm and the committed `package-lock.json`.
- Follow the Next.js rules above. For version-sensitive APIs, conventions, or file structure, consult the relevant installed guide in `node_modules/next/dist/docs/`.
- Keep `.env` files, keys, tokens, credentials, service-role keys, connection strings, certificates, and private dumps out of Git and output. Keep production credentials server-side. Preserve intentional tracked `.env*.example` templates.
- Review `git status` and `git diff` before finishing. Do not commit generated files, secrets, or unrelated changes. Do not rewrite history, force-push, delete branches, push, or deploy without an explicit request. A push to the production GitHub repository may trigger Vercel deployment.
- Do not alter Vercel projects, domains, environment variables, or deployment settings, or Cloudflare DNS, zones, records, Workers, Pages, tunnels, or production settings without an explicit request. State when a code change needs an external deployment or configuration step.
- Treat schema and migrations as consequential: inspect existing conventions first, explain consequential schema/data changes before applying them, and never run destructive production migrations or modify production data without explicit instruction. `db:push`, seed, reset, and historical local-stack scripts are not routine setup commands.
- For substantive changes, run relevant lint, type checks, tests, and production build; use judgment for trivial edits. Review the final diff.

## Agent coordination

- The selected lead model owns overall scope, architecture, security, database/infrastructure decisions, integration, review, and final verification.
- Delegate only independent, bounded work when it improves speed, cost, focus, or coverage. Prefer a faster, lower-cost worker such as Luna when explicit model selection is available and the task is straightforward: exploration, usage searches, documentation checks, test discovery, validation, log investigation, or mechanical edits.
- Give workers only the context they need where supported. Keep short dependent steps with the lead. Coordinate edits so agents do not change the same files concurrently, and review delegated results before integrating. Do not spawn agents merely to satisfy this guidance.
