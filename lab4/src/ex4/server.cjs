"use strict";

const http = require("http");
const fs   = require("fs").promises;
const path = require("path");
const url  = require("url");

const BASE_DIR    = __dirname;
const DATA_DIR    = path.join(BASE_DIR, "../../data");
const STUDENTS_FN = path.join(DATA_DIR, "students.json");
const GRADES_FN   = path.join(DATA_DIR, "grades.json");

async function readJSON(fn) {
  try {
    return JSON.parse(await fs.readFile(fn, "utf8"));
  } catch {
    return [];
  }
}

  async function writeJSON(fn, data) {
  await fs.mkdir(path.dirname(fn), { recursive: true });
  await fs.writeFile(fn, JSON.stringify(data, null, 2), "utf8");
}

// prosta walidacja
function esc(s) {
  return s.replace(/&/g,"&amp;")
          .replace(/</g,"&lt;")
          .replace(/>/g,"&gt;");
}

async function renderCards() {
  const students = await readJSON(STUDENTS_FN);
  const grades   = await readJSON(GRADES_FN);

  return students.map(st => {
    const name     = st.name;
    const display  = name.charAt(0).toUpperCase() + name.slice(1);
    const sid      = esc(st.cardId);
    const studentGrades = grades.filter(g => g.student === name);
    const has      = studentGrades.length > 0;
    const gradeList = has
      ? studentGrades.map(g =>
          `<p>${esc(g.subject)}: ${esc(g.grade)}</p>`
        ).join("")
      : "Brak ocen";

    return `
      <div id="${sid}" class="column is-one-third-desktop">
        <div class="card ${has ? "assigned" : "not-assigned"}">
          <header class="card-header">
            <p class="card-header-title">${esc(display)}</p>
          </header>
          <div class="card-content">
            <figure class="image is-128x128">
              <img src="/images/student.jpg" alt="Student">
            </figure>
            <div class="grade-list">${gradeList}</div>
            <div class="grade-form">
              <form method="GET" action="/usos.html">
                <input type="hidden" name="action" value="add">
                <input type="hidden" name="student" value="${esc(name)}">
                <div class="field">
                  <label class="label">Przedmiot</label>
                  <div class="control">
                    <input class="input subject-input" name="subject" type="text" placeholder="wpisz przedmiot" required>
                  </div>
                </div>
                <div class="field">
                  <label class="label">Ocena</label>
                  <div class="control">
                    <input class="input grade-input" name="grade" type="text" placeholder="1-6" required>
                  </div>
                </div>
                <div class="control">
                  <button class="button is-link" type="submit">Zapisz ocenę</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>`;
  }).join("\n");
}

// obsługa żądań
async function handler(req, res) {
  const parsed = url.parse(req.url, true);
  const p      = parsed.pathname;
  const q      = parsed.query;

  // statyczne index.html
  if (p === "/" || p === "/index.html") {
    try {
      const html = await fs.readFile(path.join(BASE_DIR, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch {
      res.writeHead(500); return res.end("Server error");
    }
  }

  // usos.html
  if (p === "/usos.html") {
    // dodaj/zmień ocenę
    if (q.action === "add" && q.student && q.subject && q.grade) {
      const grades = await readJSON(GRADES_FN);
      const exists = grades.find(r => r.student===q.student && r.subject===q.subject);
      if (exists) {
        exists.grade = q.grade;
      } else {
        grades.push({ student: q.student, subject: q.subject, grade: q.grade });
      }
      await writeJSON(GRADES_FN, grades);
      // przekierowanie do czystego html bez parametrów
      res.writeHead(302, { Location: "/usos.html" });
      return res.end();
    }
    // wczytanie szablonu i wstrzyknięcie kart
    try {
      let tpl = await fs.readFile(path.join(BASE_DIR, "usos.html"), "utf8");
      const cardsHtml = await renderCards();
      tpl = tpl.replace("<!-- CARDS_PLACEHOLDER -->", cardsHtml);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(tpl);
    } catch (e) {
      res.writeHead(500);
      return res.end("Błąd serwera");
    }
  }

  // obrazy
  if (p.startsWith("/images/")) {
    const img = path.join(BASE_DIR, "../../images", p.slice(8));
    try {
      const data = await fs.readFile(img);
      const ext = path.extname(img).slice(1);
      res.writeHead(200, { "Content-Type": `image/${ext}` });
      return res.end(data);
    } catch {
      res.writeHead(404); return res.end("Not found");
    }
  }

  // w innym wypadku 404
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Nie znaleziono zasobu");
}

const server = http.createServer(handler);
server.listen(3000, () => {
  console.log("Serwer działa na http://localhost:3000");
});
