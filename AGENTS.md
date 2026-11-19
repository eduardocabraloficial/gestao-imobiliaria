# Repository Guidelines

## Project Structure & Module Organization

Production code lives under `src/`: App Router pages and route handlers are in `src/app`, reusable UI in `src/components`, domain helpers in `src/lib`, and shared models in `src/types`. Place static files in `public/`, tests in `tests/`, and Supabase migrations in `supabase/`. Group new code by business capability and keep configuration at the repository root.

## Build, Test, and Development Commands

Use the npm scripts defined in `package.json`:

- `npm run dev`: start the local Next.js environment.
- `npm run build`: create a production-ready artifact.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run lint`: run the Next.js ESLint rules.

Run all documented checks locally before opening a pull request.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and the committed ESLint configuration. Prefer descriptive domain names such as `FollowUpStatus` or `ClientDetail`. Use `PascalCase` for types and components, `camelCase` for functions and variables, and `kebab-case` for route folders. Keep server and client concerns explicit; add `"use client"` only to interactive components. Never embed credentials or environment-specific values in source files.

## Testing Guidelines

Add tests with every behavior change and regression fix. Mirror the source layout in `tests/`, and name tests after the unit or scenario they cover (for example, `rent-adjustment.test.*`). Tests should be deterministic and must not depend on production services or shared mutable data. Document the selected framework and any coverage threshold when testing infrastructure is added.

## Commit & Pull Request Guidelines

There is no Git history from which to infer an established convention. Until one is adopted, use concise, imperative Conventional Commit messages such as `feat: add property registration` or `fix: validate lease end date`. Keep commits narrowly scoped. Pull requests should explain the problem and solution, list verification performed, link relevant issues, and include screenshots for visible UI changes. Call out migrations, configuration changes, and follow-up work explicitly.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
