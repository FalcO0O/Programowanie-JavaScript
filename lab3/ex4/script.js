"use strict";

// Funkcja pomocnicza
function capitalizeWords(str) {
    return str
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

const possibleGrades = ["1", "2", "3", "4", "5", "6"];
const subjects = ["matematyka", "informatyka", "fizyka", "javascript"];
const students = [
    { name: "jan kowalski", cardId: "card-jan-kowalski" },
    { name: "anna nowak", cardId: "card-anna-nowak" },
    { name: "piotr duda", cardId: "card-piotr-duda" }
];

let db;

// Otwarcie bazy
const request = indexedDB.open("USOSdb", 1);
request.onupgradeneeded = (event) => {
    db = event.target.result;
    const store = db.createObjectStore("grades", { keyPath: "id", autoIncrement: true });
    store.createIndex("student_subject", ["student", "subject"], { unique: true });
};
request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Baza danych otwarta");
    initCards();
};
request.onerror = (event) => console.error("Błąd otwierania bazy danych", event);

// Funkcja dodaje obsługę zdarzeń dla kart
function initCards() {
    students.forEach(studentObj => {
        const cardEl = document.getElementById(studentObj.cardId);
        if (!cardEl) return;

        // Formularz i elementy wewnątrz karty
        const card = cardEl.querySelector(".card");
        const gradeForm = card.querySelector(".grade-form");
        const subjectInput = card.querySelector(".subject-input");
        const gradeInput = card.querySelector(".grade-input");
        const gradeList = card.querySelector(".grade-list");
        const saveButton = card.querySelector(".save-grade");

        // Rozwijanie formularza przy kliknięciu na kartę (poza formularzem)
        card.addEventListener("click", (e) => {
            if (e.target.closest(".grade-form")) return;
            gradeForm.style.display = (gradeForm.style.display === "block") ? "none" : "block";
        });

        // Obsługa przycisku zapisu oceny
        saveButton.addEventListener("click", (e) => {
            let subject = subjectInput.value.trim().toLowerCase();
            let grade = gradeInput.value.trim();
            const studentKey = studentObj.name.toLowerCase();

            if (!subject || !grade) {
                alert("Oba pola muszą być wypełnione!");
                return;
            }
            if (!subjects.includes(subject)) {
                alert("przedmiot nie istnieje!");
                return;
            }
            if (!possibleGrades.includes(grade)) {
                alert("niepoprawna ocena!");
                return;
            }

            getGrade(studentKey, subject, (record) => {
                if (record) {
                    changeGrade(studentKey, subject, grade, () => {
                        alert("ocena zaktualizowana!");
                        updateStudentCard(studentKey, gradeList, card);
                    });
                } else {
                    addGrade(studentKey, subject, grade, () => {
                        alert("ocena dodana pomyślnie!");
                        updateStudentCard(studentKey, gradeList, card);
                    });
                }
            });
            subjectInput.value = "";
            gradeInput.value = "";
            gradeForm.style.display = "none";
        });

        // załadowanie ocen z bazy
        updateStudentCard(studentObj.name.toLowerCase(), gradeList, card);
    });
}

// Pobiera ocenę z bazy danych
function getGrade(student, subject, callback) {
    const transaction = db.transaction("grades", "readonly");
    const store = transaction.objectStore("grades");
    const index = store.index("student_subject");
    const query = IDBKeyRange.only([student, subject]);
    const req = index.get(query);
    req.onsuccess = (event) => callback(event.target.result);
    req.onerror = (event) => console.error("Błąd przy wyszukiwaniu oceny", event.target.error);
}

// Dodaje nową ocenę do bazy
function addGrade(student, subject, grade, callback) {
    const transaction = db.transaction("grades", "readwrite");
    const store = transaction.objectStore("grades");
    const record = { student, subject, grade };
    const req = store.add(record);
    req.onsuccess = () => callback();
    req.onerror = (event) => console.error("Błąd przy dodawaniu oceny", event.target.error);
}

// Modyfikuje istniejącą ocenę w bazie
function changeGrade(student, subject, newGrade, callback) {
    const transaction = db.transaction("grades", "readwrite");
    const store = transaction.objectStore("grades");
    const index = store.index("student_subject");
    const query = IDBKeyRange.only([student, subject]);
    const req = index.get(query);
    req.onsuccess = (event) => {
        let record = event.target.result;
        if (record) {
            record.grade = newGrade;
            const updateReq = store.put(record);
            updateReq.onsuccess = () => callback();
            updateReq.onerror = (event) => console.error("Błąd przy aktualizacji oceny", event.target.error);
        } else {
            alert("Nie znaleziono oceny do zmiany!");
        }
    };
    req.onerror = (event) => console.error("Błąd przy wyszukiwaniu oceny", event.target.error);
}

// Aktualizuje zawartość listy ocen karty studenta
function updateStudentCard(student, gradeListEl, cardEl) {
    const transaction = db.transaction("grades", "readonly");
    const store = transaction.objectStore("grades");
    const results = [];

    const req = store.openCursor();
    req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.student === student) {
                results.push({ subject: cursor.value.subject, grade: cursor.value.grade });
            }
            cursor.continue();
        } else {
            // Czyścimy listę ocen
            while (gradeListEl.firstChild) {
                gradeListEl.removeChild(gradeListEl.firstChild);
            }
            if (results.length === 0) {
                gradeListEl.appendChild(document.createTextNode("Brak ocen"));
                cardEl.classList.add("not-assigned");
                cardEl.classList.remove("assigned");
            } else {
                results.forEach(item => {
                    const p = document.createElement("p");
                    p.textContent = `${capitalizeWords(item.subject)}: ${item.grade}`;
                    gradeListEl.appendChild(p);
                });
                cardEl.classList.add("assigned");
                cardEl.classList.remove("not-assigned");
            }
        }
    };
}
