import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";

// Lokalna baza
const gradeScale = [2, 3, 4, 5];
interface Student { id: string; name: string; course: string; image: string; grades: number[]; }
const students: Student[] = [
    { id: "1", name: "Jan Kowalski", course: "CS101", image: "1.jpg", grades: [4] },
    { id: "2", name: "Anna Nowak",  course: "CS101", image: "2.jpg", grades: [5, 3] },
    { id: "3", name: "Maria Wiśniewska", course: "CS101", image: "3.jpg", grades: [] },
];

const app = new Application();
const router = new Router();

// CORS
app.use(oakCors());

// Lista ocen
router.get("/api/gradescale", (ctx) => {
    const accept = ctx.request.headers.get("Accept") || "";
    const wantsXML = accept.includes("application/xml");
    if (wantsXML) {
        // Generowanie XML ręcznie
        let xml = "<gradescale>";
        for (const g of gradeScale) {
            xml += `<grade>${g}</grade>`;
        }
        xml += "</gradescale>";
        ctx.response.type = "application/xml";
        ctx.response.body = xml;
    } else {
        // Domyślnie JSON
        ctx.response.body = { gradescale: gradeScale };
    }
});

// GET studenci danego kursu
router.get("/api/courses/:course/students", (ctx) => {
    const course = ctx.params.course!;
    const courseStudents = students.filter(s => s.course === course);
    const accept = ctx.request.headers.get("Accept") || "";
    const wantsXML = accept.includes("application/xml");
    if (wantsXML) {
        let xml = "<students>";
        for (const s of courseStudents) {
            xml += `<student id="${s.id}" name="${s.name}">`;
            xml += `<image>${s.image}</image>`;
            xml += "<grades>";
            for (const g of s.grades) {
                xml += `<grade>${g}</grade>`;
            }
            xml += "</grades>";
            xml += "</student>";
        }
        xml += "</students>";
        ctx.response.type = "application/xml";
        ctx.response.body = xml;
    } else {
        ctx.response.body = { students: courseStudents };
    }
});

// POST dodaje ocenę do studenta (body jako XML lub JSON)
router.post("/api/students/:id/grades", async (ctx) => {
    const id = ctx.params.id!;
    const student = students.find(s => s.id === id);
    if (!student) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Student not found" };
        return;
    }
    const contentType = ctx.request.headers.get("Content-Type") || "";
    let gradeValue: string | null = null;
    if (contentType.includes("xml")) {
        const bodyText = (await ctx.request.body.text());
        const m = bodyText.match(/<grade>([^<]+)<\/grade>/);
        gradeValue = m ? m[1] : null;
    } else {
        const body = await ctx.request.body.json();
        gradeValue = body.grade?.toString() || null;
    }
    if (gradeValue) {
        const num = parseFloat(gradeValue);
        if (!isNaN(num)) {
            student.grades.push(num);
        }
    }
    ctx.response.status = 204; // No Content
});

// DELETE usuwa ocenę o indeksie
router.delete("/api/students/:id/grades/:index", (ctx) => {
    const id = ctx.params.id!;
    const index = Number(ctx.params.index);
    const student = students.find(s => s.id === id);
    if (!student) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Student not found" };
        return;
    }
    if (isNaN(index) || index < 0 || index >= student.grades.length) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid grade index" };
        return;
    }
    student.grades.splice(index, 1);
    ctx.response.status = 204; // No Content
});

// Serwowanie zdjęć ze ścieżki /images
app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/images/")) {
        await send(ctx, ctx.request.url.pathname, { root: Deno.cwd() });
    } else {
        await next();
    }
});

// Start serwera
app.use(router.routes());
app.use(router.allowedMethods());
console.log("Backend server running on http://localhost:8000");
await app.listen({ port: 8000 });
