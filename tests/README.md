# Tests

Unit tests use [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/).

## Running tests

```bash
npm run test       # Watch mode
npm run test:run   # Single run
```

**Note:** Vitest 4.x requires Node.js 20.12 or newer. If you see `styleText` or similar errors, upgrade Node: `nvm use 20` (or `fnm use 20`).

## Structure

- `tests/lib/` – Tests for `lib/` (schemas, utils, r2-client)
- `tests/actions/` – Tests for `app/actions/` (work-order with mocked Prisma/auth)
- `tests/components/` – Component tests (CaptainSelect with mocked fetch)
