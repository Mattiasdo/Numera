# Publishing Numorph

## First-Time Setup

1. Create or confirm an npm account.
2. Log in locally:

```sh
npm login
npm whoami
```

3. Confirm the package name is still available:

```sh
npm view numorph
```

If npm returns `404`, the name is available at that moment.

## Release Checklist

1. Update `docs/CHANGELOG.md`.
2. Bump the version:

```sh
npm version patch
```

Use `minor` for backwards-compatible features and `major` for breaking changes.

3. Run checks:

```sh
npm run check
npm pack --dry-run
```

4. Publish:

```sh
npm publish
```

5. Push the commit and tag:

```sh
git push origin main --tags
```

## Recommended Imports

```tsx
import Numorph from 'numorph';
import 'numorph/style.css';
```

```ts
import { NumorphController } from 'numorph/vanilla';
```
