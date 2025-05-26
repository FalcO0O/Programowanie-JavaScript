import { Application, Context, Router } from "jsr:@oak/oak/";
import { Eta } from "https://deno.land/x/eta/src/index.ts";
import logger from "https://deno.land/x/oak_logger/mod.ts";
import { MongoClient } from "npm:mongodb@6.1.0";


interface Student {
  lname: string;
  fname: string;
  faculty: string;
}

async function getData(): Promise<Student[]> {
  const client = new MongoClient("mongodb://127.0.0.1:27017");
  await client.connect();
  const db = client.db("AGH");
  const studentsCollection = db.collection<Student>("students");
  const allData = await studentsCollection.find({}, { projection: { _id: 0 } }).toArray();
  client.close();
  console.log(allData);
  return allData;
}

const students = await getData();

const app = new Application();
const router = new Router();

const eta = new Eta({ views: `${Deno.cwd()}/views` });

router.get("/:faculty", async (ctx) => {
  console.log("Searching for:");
  console.log(ctx.params.faculty);
  const html = await eta.render("app3.eta", { persons: students.filter((s) => s.faculty.toLocaleLowerCase() === ctx.params.faculty.toLocaleLowerCase()) });
  console.log(students, ctx.params);
  ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  ctx.response.body = html;
}).get("/", async (ctx: Context) => {
  const html = await eta.render("app3.eta", { persons: students });

  ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  ctx.response.body = html;
});

app.use(logger.logger);
app.use(logger.responseTime);
app.use(router.routes());
app.use(router.allowedMethods());

console.log("App is listening on http://localhost:8080");
await app.listen({ port: 8080 });
