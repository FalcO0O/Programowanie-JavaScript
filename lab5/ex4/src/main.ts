import { Application, Context, Router, send } from "jsr:@oak/oak";
import logger from "https://deno.land/x/oak_logger/mod.ts";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import { DatabaseService } from "./db.ts";
import { StudentController } from "./controller.ts";

const PORT = 8080;
const app = new Application();
const router = new Router();
const eta = new Eta({ views: `${Deno.cwd()}/views` });

const dbService = new DatabaseService("mongodb://127.0.0.1:27017", "AGH", "ex4");
await dbService.connect();
const controller = new StudentController(dbService);

router
  .get("/", async (ctx: Context) => {
    const html = await Deno.readFile("views/index.html");
    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.body = html;
  })
  .get("/usos", async (ctx: Context) => {
    const studentsCards = await controller.getAllStudents();
    const html = await eta.render("usos.eta", { studentsCards });
    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.body = html;
  })
  .post("/usos/add", async (ctx: Context) => {
    const formData = await ctx.request.body.formData();

    const studentName = formData.get("student")?.toString();
    const subject = formData.get("subject")?.toString();
    const grade = Number(formData.get("grade"));

    if (!studentName || !subject || !grade) {
      ctx.response.status = 400;
      ctx.response.body = "Brak wymaganych danych.";
      return;
    }

    const [imie, nazwisko] = studentName.split(" ");

    if (Number.isNaN(grade) || grade < 1 || grade > 6) {
      ctx.response.status = 400;
      ctx.response.body = "Nieprawidłowa wartość oceny (1-6)";
      return;
    }

    try {
      await controller.upsertGrade(imie, nazwisko, subject, grade);
      ctx.response.redirect("/usos");
    } catch (err) {
      console.error("Błąd podczas zapisywania oceny:", err);
      ctx.response.status = 500;
      ctx.response.body = `Błąd serwera: ${err}`;
    }
  });

app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

// aby obrazki się ładowały
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/images")) {
    await send(ctx, ctx.request.url.pathname, { root: Deno.cwd() });
  } else {
    await next();
  }
});

console.log(`Server listening at http://localhost:${PORT}`);
await app.listen({ port: PORT });
