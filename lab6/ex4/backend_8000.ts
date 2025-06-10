// backend.ts - Deno backend (Oak, port 8000)
import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// In-memory data: skala ocen i lista studentów
const gradeScale = [2, 3, 4, 5];
interface Student { id: string; name: string; course: string; image: string; grades: number[]; }
const students: Student[] = [
    { id: "1", name: "Jan Kowalski", course: "CS101", image: "1.jpg", grades: [4] },
    { id: "2", name: "Anna Nowak",  course: "CS101", image: "2.jpg", grades: [5, 3] },
    { id: "3", name: "Maria Wiśniewska", course: "CS101", image: "3.jpg", grades: [] },
];

const app = new Application();
const router = new Router();

// Włącz CORS
app.use(oakCors());

// GET /api/gradescale – lista ocen
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

// GET /api/courses/:course/students – studenci danego kursu
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

// POST /api/students/:id/grades – dodaj ocenę do studenta (body jako XML lub JSON)
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
        const bodyText = await ctx.request.body({ type: "text" }).value;
        const xmlDoc = new DOMParser().parseFromString(bodyText, "application/xml");
        if (xmlDoc) {
            gradeValue = xmlDoc.querySelector("grade")?.textContent || null;
        }
    } else {
        const body = await ctx.request.body().value;
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

// DELETE /api/students/:id/grades/:index – usuń ocenę o indeksie
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

// Serwowanie statycznych plików ze ścieżki /images
app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.startsWith("/images/")) {
        await send(ctx, ctx.request.url.pathname, { root: Deno.cwd() });
    } else {
        await next();
    }
});

// Rejestracja routera i start serwera
app.use(router.routes());
app.use(router.allowedMethods());
console.log("Backend server running on http://localhost:8000");
await app.listen({ port: 8000 });
