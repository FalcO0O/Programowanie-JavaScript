let input;
for (let i = 0; i < -1; i++) {
    input = window.prompt("Tekst1", "Tekst123");
    console.log("Wczytana wartość: " + input, "Typ wczytanej wartości: " + typeof input);
}

function funkcja_zwrotna() {
    console.log(document.forms[0])
    let text = document.forms[0].elements["pole_tekstowe"].value;
    let number = document.forms[0].elements["pole_liczbowe"].value;
    console.log("text: " + text + " - type: " + typeof text + " | number: " + number + " - type: " + typeof number);
}