import fs from 'node:fs';
import path from 'node:path';

// Every file inside `pages/api` is a route. Reads its `createRouter()` chain and reports, for each
// declared method, which cache policy applies to it — `undefined` when the method declares none.
export default function apiRoutes(directory = 'pages/api') {
  return routeFiles(directory).flatMap((file) => {
    const routerChain = fs.readFileSync(file, 'utf8').match(/createRouter\(\)([\s\S]*?)\.handler\(/)?.[1];

    if (!routerChain) return [{ file, endpoint: `${file} (router not found)` }];

    // `.use` declares the policy for every method of the router, in any position of the chain —
    // ordering it against a middleware that writes `Set-Cookie` is left to the runtime guard.
    // Declared per method, it is only accepted as the first middleware of each one.
    const routerPolicy = routerChain.match(/\.use\(\s*cacheControl\.(noCache|swrMaxAge)/)?.[1];

    return [...routerChain.matchAll(/\.(get|head|post|put|patch|delete|options|all)\(\s*([\w.]+)/g)].map(
      ([, method, firstMiddleware]) => ({
        file,
        endpoint: `${method.toUpperCase()} ${path.dirname(file).replace(/^pages/, '')}`,
        policy: routerPolicy ?? firstMiddleware.match(/^cacheControl\.(noCache|swrMaxAge)$/)?.[1],
      }),
    );
  });
}

function routeFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    return entry.isDirectory() ? routeFiles(entryPath) : entryPath;
  });
}
