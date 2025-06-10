import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { renderFile } from "https://deno.land/x/eta@v1.11.0/mod.ts"

const app = new Application();
const router = new Router();

// Renderuje stronę z index.eta
router.get("/", async (ctx) => {
    const body = await renderFile(`${Deno.cwd()}/views/index.eta`, {});
    if (body) {
        ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
        ctx.response.body = body;
    }
});

// Serwowanie skryptu klienta
app.use(async (ctx, next) => {
    if (ctx.request.url.pathname === "/script.js") {
        await send(ctx, ctx.request.url.pathname, { root: Deno.cwd() });
    } else {
        await next();
    }
});

app.use(router.routes());
app.use(router.allowedMethods());
console.log("Front-end server running on http://localhost:8001");
await app.listen({ port: 8001 });
