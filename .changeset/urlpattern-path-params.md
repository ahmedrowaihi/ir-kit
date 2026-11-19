---
"@ir-kit/kit": patch
---

`match()` and `createRouter()` now handle OpenAPI paths with param names like `{pet-id}` or `{file.name}`, and literal `:`, `+`, `*`, `?`, `(` or `)` in path text (`/v1/{name}:cancel`, `/a+b`), which previously failed to match, matched wrong or threw.
