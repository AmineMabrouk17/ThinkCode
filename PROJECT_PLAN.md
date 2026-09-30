# ThinkCode — Build Plan

Stack: Next.js (App Router, TypeScript) + Tailwind CSS + Cloudflare D1 + OpenNext (Cloudflare Workers deploy).

Each feature: dedicated branch → subagent implementation → PR → validate → merge → next.

- [x] Repo setup (README on main)
- [x] feat/1-foundation — Next.js + Tailwind + OpenNext/Cloudflare scaffold, D1 schema + seed, design system, app shell, navigation
- [x] feat/2-dashboard — Dashboard: stats, continue learning, recent, needs review, patterns overview
- [x] feat/3-problems — Problem library: list, search/filters, create/edit/delete, problem detail page
- [x] feat/4-patterns-tags — Patterns library + pattern detail knowledge pages, tags CRUD
- [x] feat/5-thinking — Thinking timer (configurable), thinking sessions, initial thoughts, session history
- [x] feat/6-knowledge — Markdown notes: mental model, key lessons, mistakes (editor + preview)
- [x] feat/7-solutions — Solution editor: language, code, complexity, explanation, alternatives
- [x] feat/8-resources — AI conversation links + YouTube resources
- [x] feat/9-visualizations — Mermaid diagram visualizations
- [x] feat/10-review — Review system: sessions, history, spaced repetition, compare old vs new
- [ ] feat/11-search — Global search across problems, notes, patterns
- [ ] feat/12-deploy — Cloudflare deploy config, CI, final polish, docs