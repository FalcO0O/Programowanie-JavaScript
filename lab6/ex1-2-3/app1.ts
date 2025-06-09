/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 */
import { Application, Context, Router } from "jsr:@oak/oak/";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";
import { encode } from "https://deno.land/x/html_entities/lib/xml-entities.js";

const app: Application = new Application();
const router: Router = new Router();
const eta: Eta = new Eta({ views: `${Deno.cwd()}/views` });

router
  .get("/", (ctx: Context) => {
    const res: string = eta.render("./index");
    ctx.response.body = res;
  })
  .all("/submit", async (ctx: Context) => {
    let name = ["GET", "DELETE"].includes(ctx.request.method)
      ? ctx.request.url.searchParams.get("name")
      : (await ctx.request.body.form()).get("name");
    const type = ctx.request.accepts();

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
  
// Middlewares
app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

console.log("App is listening to port: 8000");
await app.listen({ port: 8000 });