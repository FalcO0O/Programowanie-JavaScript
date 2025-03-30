"use strict";

const possibleGrades = ["1", "2", "3", "4", "5", "6"];
const subjects = ["Matematyka", "Informatyka", "Fizyka", "JavaScript"];
const students = [
    "Jan Kowalski",
    "Anna Nowak",
    "Piotr Duda"
];

let db; // baza danych

const request = indexedDB.open("USOSdb", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    const store = db.createObjectStore("grades", { keyPath: "id", autoIncrement: true });
    store.createIndex("student_subject", ["student", "subject"], { unique: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Baza danych otwarta pomyślnie");
};

request.onerror = function(event) {
    console.error("Błąd otwierania bazy danych", event);
};

document.addEventListener("DOMContentLoaded", () => {
    const textField = document.getElementById("text-field");
    const addButton = document.getElementById("add");
    const changeButton = document.getElementById("change");
    const displayButton = document.getElementById("display");

    addButton.addEventListener("click", () => {
        const data = getData(textField);
        if (data) {
            const [student, subject, grade] = data;
            addGrade(student, subject, grade);
        }
    });

    changeButton.addEventListener("click", () => {
        const data = getData(textField);
        if (data) {
            const [student, subject, grade] = data;
            changeGrade(student, subject, grade);
        }
    });

    displayButton.addEventListener("click", () => {
        // Dla wyświetlenia wystarczy podać imię i nazwisko
        let input = textField.value.trim().split(" ");
        if (input.length < 2) {
            alert("Podaj imię i nazwisko studenta!");
            console.log("Podaj imię i nazwisko studenta!");
            return;
        }
        const student = input.slice(0,2).join(" ");
        if(!students.some(s => s.toLowerCase() === student.toLowerCase())) {
            alert("Student nie istnieje!");
            console.log("Student nie istnieje!");
            return;
        }
        displayGrades(student);
    });
});

function getData(textField) {
    let input = textField.value.trim().split(" ");
    if (input.length !== 4) {
        alert("Zła liczba danych! Podaj: Imię Nazwisko Przedmiot Ocena");
        console.log("Zła liczba danych! Podaj: Imię Nazwisko Przedmiot Ocena");
        return;
    }
    const [name, surname, subject, grade] = input;
    const student = name + " " + surname;

    if(!students.some(s => s.toLowerCase() === student.toLowerCase())) {
        alert("Student nie istnieje!");
        console.log("Student nie istnieje!");
        return;
    }
    if(!subjects.some(s => s.toLowerCase() === subject.toLowerCase())) {
        alert("Przedmiot nie istnieje!");
        console.log("Przedmiot nie istnieje!");
        return;
    }
    if(!possibleGrades.includes(grade)) {
        alert("Niepoprawna ocena!");
        console.log("Niepoprawna ocena!");
        return;
    }
    return [student, subject, grade];
}

function addGrade(student, subject, grade) {
    const transaction = db.transaction("grades", "readwrite");
    const store = transaction.objectStore("grades");
    const record = { student, subject, grade };

    const addRequest = store.add(record);
    addRequest.onsuccess = function() {
        alert("Ocena dodana pomyślnie!");
        console.log("Ocena dodana pomyślnie!");
    };
    addRequest.onerror = function(event) {
        alert("Błąd przy dodawaniu oceny! (może student juz ma ocenę)");
        console.log("Błąd przy dodawaniu oceny! (może student juz ma ocenę)", event.target.error);
    };
}

function changeGrade(student, subject, newGrade) {
    const transaction = db.transaction("grades", "readwrite");
    const store = transaction.objectStore("grades");
    const index = store.index("student_subject");
    const query = IDBKeyRange.only([student, subject]);
    const getRequest = index.get(query);

    getRequest.onsuccess = function(event) {
        const record = event.target.result;
        if (record) {
            record.grade = newGrade;
            const updateRequest = store.put(record);
            updateRequest.onsuccess = function() {
                alert("Ocena zaktualizowana!");
                console.log("Ocena zaktualizowana!");
            };
            updateRequest.onerror = function(event) {
                alert("Błąd przy aktualizacji oceny.");
                console.log("Błąd przy aktualizacji oceny.", event.target.error);
            };
        } else {
            alert("Nie znaleziono oceny do zmiany!");
            console.log("Nie znaleziono oceny do zmiany!");
        }
    };

    getRequest.onerror = function(event) {
        alert("Błąd przy wyszukiwaniu oceny.");
        console.log("Błąd przy wyszukiwaniu oceny.", event.target.error);
    };
}

function displayGrades(student) {
    const transaction = db.transaction("grades", "readonly");
    const store = transaction.objectStore("grades");
    const result = [];

    store.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.student.toLowerCase() === student.toLowerCase()) {
                result.push(cursor.value);
            }
            cursor.continue();
        } else {
            if (result.length === 0) {
                alert("Brak ocen dla studenta " + student);
                console.log("Brak ocen dla studenta " + student);
            } else {
                let message = "Oceny dla " + student + ":\n";
                result.forEach(item => {
                    message += item.subject + ": " + item.grade + "\n";
                });
                alert(message);
                console.log(message);
            }
        }
    };
}
