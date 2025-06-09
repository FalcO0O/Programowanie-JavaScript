/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 */
import { Application, Context, Router } from "jsr:@oak/oak/";
import { Eta } from "https://deno.land/x/eta/src/index.ts";

const app: Application = new Application();
const router: Router = new Router();
const eta: Eta = new Eta({ views: `${Deno.cwd()}/views` });

router.get("/", (ctx: Context) => {
  const res: string = eta.render("./index");
  ctx.response.body = res;
});

// Middlewares
app.use(router.routes());
app.use(router.allowedMethods());

console.log("App is listening to port: 8001");
await app.listen({ port: 8001 });            