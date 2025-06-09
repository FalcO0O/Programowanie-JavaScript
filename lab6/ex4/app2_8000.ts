/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 */
import { Application, Context, Router } from "jsr:@oak/oak/";
import logger from "https://deno.land/x/oak_logger/mod.ts";
import { encode } from "https://deno.land/x/html_entities/lib/xml-entities.js";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const app: Application = new Application();

app.use(
  oakCors({
    origin: "http://localhost:8001",       // lub "*" aby zezwolić każdemu
    credentials: true,                      // potrzebne dla withCredentials / include
    allowedMethods: ["GET", "POST", "OPTIONS"]
  })
);

const router: Router = new Router();

router.all("/submit", async (ctx: Context) => {
  let name = ["GET", "DELETE"].includes(ctx.request.method)
    ? ctx.request.url.searchParams.get("name")
    : (await ctx.request.body.form()).get("name");
  let type = ctx.request.accepts();

  console.log();
  console.log("-".repeat(11));
  console.count("Request");
  console.log("-".repeat(11));
  console.log(`${ctx.request.method} ${ctx.request.url}`);
  console.log(`Accept: ${type}`);
  console.group("\x1B[35mname\x1B[0m");
  console.log(name);
  console.groupEnd();

  switch (type[0]) {
    case "application/json":
      // Send the JSON greeting
      ctx.response.type = type[0];
      ctx.response.body = { welcome: `Hello '${name}'` };
      console.log(
        `The server sent a \x1B[31mJSON\x1B[0m document to the browser`
      );
      break;
    case "application/xml":
      // Send the XML greeting
      name = name !== undefined ? encode(name) : "";
      ctx.response.type = type[0];
      ctx.response.body = `<welcome>Hello '${name}'</welcome>`;
      console.log(
        `The server sent an \x1B[31mXML\x1B[0m document to the browser`
      );
      break;
    default:
      // Send the text plain greeting
      ctx.response.type = "text/plain";
      ctx.response.body = `Hello '${name}'`;
      console.log(
        `The server sent a \x1B[31mplain text\x1B[0m document to the browser`
      );
      break;
  }
});

// Proxy do World Time API:
router.get("/time", async (ctx: Context) => {
  const city = ctx.request.url.searchParams.get("city") || "";
  const url = `https://www.timeapi.io/api/Time/current/zone?timeZone=Europe/${encodeURIComponent(city)}`;

  try {
    const resp = await fetch(url);
    ctx.response.status = resp.status;
    ctx.response.type = resp.headers.get("content-type") || "application/json";

    if (resp.status === 200) {
      ctx.response.body = await resp.json();
    } else {
      ctx.response.body = { error: await resp.text() };
    }
  } catch (e) {
    ctx.response.status = 500;
    ctx.response.body = { error: e.message };
  }
});


// Middlewares
app.use(router.routes());
app.use(router.allowedMethods());
app.use(logger.logger);
app.use(logger.responseTime);
console.log("App is listening to port: 8000");
await app.listen({ port: 8000 });