const API_URL = "http://localhost:8000/api";

// Funkcja do pobrania i sparsowania XML
async function fetchXML(url) {
  const res = await fetch(url, { headers: { "Accept": "application/xml" } });
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");
  if (!xml) throw new Error("Nieprawidłowy XML");
  return xml;
}

// Pobiera skalę ocen jako tablicę stringów
async function fetchScale() {
  const xml = await fetchXML(`${API_URL}/gradescale`);
  return Array.from(xml.getElementsByTagName("grade"))
    .map(n => n.textContent)
    .filter(Boolean);
}

// Pobiera studentów z danego kursu
async function fetchStudents(course) {
  const xml = await fetchXML(`${API_URL}/courses/${course}/students`);
  const list = [];
  xml.querySelectorAll("student").forEach(st => {
    const id    = st.getAttribute("id");
    const name  = st.getAttribute("name");
    const img   = st.querySelector("image")?.textContent || "";
    const grades = Array.from(st.getElementsByTagName("grade"))
      .map(n => n.textContent)
      .filter(Boolean);
    if (id && name) list.push({ id, name, img, grades });
  });
  return list;
}

// Dodaje ocenę
async function addGrade(studentId, grade) {
  const body = `<grade>${grade}</grade>`;
  await fetch(`${API_URL}/students/${studentId}/grades`, {
    method: "POST",
    headers: {
      "Accept": "application/xml",
      "Content-Type": "application/xml"
    },
    body
  });
}

// Usuwa ocenę
async function deleteGrade(studentId, index) {
  await fetch(`${API_URL}/students/${studentId}/grades/${index}`, {
    method: "DELETE",
    headers: { "Accept": "application/xml" }
  });
}

// Przypina eventy drag&drop i klików
function setupInteractions() {
  // dragstart dla ocen w puli
  document.querySelectorAll("#grade-pool .tag").forEach(el => {
    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", el.textContent);
    });
  });

  // drop na karcie
  document.querySelectorAll(".card-content").forEach(content => {
    content.addEventListener("dragover", e => e.preventDefault());
    content.addEventListener("drop", async e => {
      e.preventDefault();
      const grade = e.dataTransfer.getData("text/plain");
      const card  = content.closest(".card");
      const id    = card?.getAttribute("data-studentid");
      if (id && grade) {
        await addGrade(id, grade);
        loadAndRender();
      }
    });
  });

  // drop na istniejącej ocenie
  document.querySelectorAll(".tag.grade").forEach(tag => {
    tag.setAttribute("draggable", "true");
    tag.addEventListener("dragover", e => e.preventDefault());
    tag.addEventListener("drop", async e => {
      e.preventDefault();
      const newGrade = e.dataTransfer.getData("text/plain");
      const card     = tag.closest(".card");
      const id       = card?.getAttribute("data-studentid");
      const idx      = tag.getAttribute("data-index");
      if (id && idx != null && newGrade) {
        await deleteGrade(id, Number(idx));
        await addGrade(id, newGrade);
        loadAndRender();
      }
    });
    // klikięcie usuwa ocenę
    tag.addEventListener("click", async () => {
      const card = tag.closest(".card");
      const id   = card?.getAttribute("data-studentid");
      const idx  = tag.getAttribute("data-index");
      if (id && idx != null) {
        await deleteGrade(id, Number(idx));
        loadAndRender();
      }
    });
  });
}

// Renderuje całą stronę
async function loadAndRender() {
  // Pula ocen
  const pool = document.getElementById("grade-pool");
  pool.innerHTML = "";
  const grades = await fetchScale();
  grades.forEach(g => {
    const span = document.createElement("span");
    span.className = "tag is-link";
    span.textContent = g;
    pool.appendChild(span);
  });

  // Studenci
  const container = document.getElementById("students-container");
  container.innerHTML = "";
  const students = await fetchStudents("CS101");
  students.forEach(st => {
    const col = document.createElement("div");
    col.className = "column is-one-third";

    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-studentid", st.id);

    // Obrazek
    const imgWrap = document.createElement("div");
    imgWrap.className = "card-image";
    const figure = document.createElement("figure");
    figure.className = "image is-4by3";
    const img = document.createElement("img");
    img.src = `http://localhost:8000/images/${st.img}`;
    img.alt = st.name;
    figure.appendChild(img);
    imgWrap.appendChild(figure);

    // Treść karty
    const content = document.createElement("div");
    content.className = "card-content";
    const title = document.createElement("p");
    title.className = "title is-5";
    title.textContent = st.name;
    const gradesDiv = document.createElement("div");
    gradesDiv.className = "tags";
    st.grades.forEach((g, i) => {
      const tag = document.createElement("span");
      tag.className = "tag is-info grade";
      tag.textContent = g;
      tag.setAttribute("data-index", i.toString());
      gradesDiv.appendChild(tag);
    });

    content.appendChild(title);
    content.appendChild(gradesDiv);
    card.appendChild(imgWrap);
    card.appendChild(content);
    col.appendChild(card);
    container.appendChild(col);
  });

  // Po wstawieniu nowych elementów podczepiamy eventy
  setupInteractions();
}

// Start
document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();
});
