import { Application, Context, Router, send } from "jsr:@oak/oak";
import logger from "https://deno.land/x/oak_logger/mod.ts";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import { DatabaseService } from "./db.ts";
import { StudentController } from "./controller.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

const PORT = 8000;
const app = new Application();
const router = new Router();
const eta = new Eta({ views: `${Deno.cwd()}/views` });
const csp = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const dbService = new DatabaseService("mongodb://127.0.0.1:27017", "AGH", "ex4");
await dbService.connect();
const controller = new StudentController(dbService);

app.use(async (ctx, next) => {
  await next();
  ctx.response.headers.set("Content-Security-Policy", csp);
});

// CORS middleware
app.use(oakCors({
  origin: `http://localhost:${PORT}`,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"]
}));


app.use(logger.logger);
app.use(logger.responseTime);

// cookies
app.use(async (ctx, next) => {
  // próbujemy odczytać token z ciasteczka
  let token = await ctx.cookies.get("csrf_token");
  if (!token) {
    // jeśli brak, generujemy nowy
    token = crypto.randomUUID();
    ctx.cookies.set("csrf_token", token, {
      httpOnly: false,
      sameSite: "strict",
    });
  }
  // przechowujemy w stanie
  ctx.state.csrf = token;
  await next();
});

router
  .get("/", async (ctx: Context) => {
    const html = await Deno.readFile("views/index.html");
    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.body = html;
  })
  .get("/usos", async (ctx: Context) => {
    const students = await controller.getAllStudents();
    ctx.response.body = await eta.render("usos.eta", {
      studentsCards: students,
      csrfToken: ctx.state.csrf,
    });
    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  })
  .post("/usos/add", async (ctx: Context) => {
    const formData = await ctx.request.body.formData();
    const sent = formData.get("csrf_token")?.toString();
    const real  = await ctx.cookies.get("csrf_token");
    if (!sent || sent !== real) {
      ctx.response.status = 403;
      ctx.response.body = "Nieprawidłowy token CSRF";
      return;
    }
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

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/views/css")) {
    await send(ctx, ctx.request.url.pathname, {
      root: Deno.cwd(),
    });
  } else {
    await next();
  }
});


console.log(`Server listening at http://localhost:${PORT}`);
await app.listen({ port: PORT });
