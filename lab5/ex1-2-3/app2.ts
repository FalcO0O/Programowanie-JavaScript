/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 */
import { Application, Context, Router } from "jsr:@oak/oak/";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";

const FILE_PATH = "dane.json";

// Initiate app
const app: Application  = new Application();
const router: Router = new Router();
const eta = new Eta({ views: `${Deno.cwd()}/views` });

type Post = { fullname: string; message: string };

async function readJSON(): Promise<Post[]> {
  try {
    const text : string = await Deno.readTextFile(FILE_PATH);
    return text.trim() ? JSON.parse(text) as Post[] : [];
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return [];
    console.error("Błąd odczytu JSON:", err);
    throw err;
  }
}

async function writeJSON(fullname: string, message: string): Promise<void> {
  const posts = await readJSON();
  posts.push({ fullname, message });
  await Deno.writeTextFile(FILE_PATH, JSON.stringify(posts, null, 2));
}

router
  .get("/", async (ctx: Context) => {
    const posts = await readJSON();
    const html = await eta.render("index.eta", { posts });
    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.body = html;
  })
  .post("/", async (ctx: Context) => {
    // Poprawnie pobieramy Body jako getter, a potem jego wartość:
    const form: URLSearchParams = await ctx.request.body.form();

    const fullname : string = form.get("fullname")?.trim() ?? "";
    const message : string = form.get("message")?.trim() ?? "";

    if (fullname && message) {
      await writeJSON(fullname, message);
    }

    ctx.response.status = 303;
    ctx.response.headers.set("Location", "/");
  });

// Middlewares
app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

console.log("App is listening on http://localhost:8080");
await app.listen({ port: 8080 });
