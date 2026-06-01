import { config } from 'zod';

// MV3's default CSP (`script-src 'self'`) forbids `eval`/`new Function`. Zod 4's
// JIT fast path probes for eval support with `new Function`, which the browser
// reports as a CSP violation even though Zod catches it and falls back. Enabling
// `jitless` skips the probe entirely, removing the violation. Must run before any
// schema is parsed, so this module is imported first at each entry point.
config({ jitless: true });
