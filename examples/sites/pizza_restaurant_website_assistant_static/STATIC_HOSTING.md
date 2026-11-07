# Static nsDeploy bundle

Publish this directory at `/` on the application's origin. The site, browser runtime, and browser-local links require no application server.

For cross-domain agent loading, configure only these public data files with `Access-Control-Allow-Origin: *`:

- `/agent-manifest.json`
- `/pizza_restaurant_website_assistant.network.json`
- `/links.json`
- `/agent-mcp.json`
- `/.well-known/nsdeploy.json`
- `/.well-known/nsdeploy-agent.json`

Action JavaScript and bridge pages do not need CORS: they load on their owning origin and exchange validated messages with callers. Do not apply these CORS headers to business endpoints. The included `_headers` file is used by Netlify and compatible hosts; Apache can use the included `.htaccess` when `mod_headers` and overrides are enabled. `_headers` paths are host-root-relative: merge them into the host's root configuration when deploying under a subpath; adjust the prefix if relocating the bundle. `.htaccess` stays beside the bundle.

For same-origin actions, this origin must also serve the real application and its backend. Use explicit --action-page routes, --action-host-page when embedding the widget, or registered JavaScript modules. Build-time --action-site discovery can instead call existing public external forms/APIs that already allow CORS from this agent origin. Review discovered-actions.json; OPTIONS checks do not verify execution. External requests omit credentials. A themed agent page does not create business capabilities. The host must allow approved callers to frame action-bridge.html (CSP frame-ancestors / X-Frame-Options); a user-opened popup is the fallback. Writes require the owning-site popup confirmation. Authenticated iframe reads may be restricted by browser cookie policy; use top-level actions when needed.

Serve `runtime/sandbox-worker.js` with:

    Content-Security-Policy: default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'

Real BYOK calls go directly from the browser to the router selected in settings, so that router must allow browser CORS. External MCP servers are also contacted directly and must allow browser CORS. Python tools and the public MCP facade are not included. Unresolved links are stored in this browser's local storage.
