let characters = [];
let dialogues = [];

function addCharacter() {
  const input = document.getElementById("charInput");
  const name = input.value.trim();
  if (name && !characters.includes(name)) {
    characters.push(name);
    renderCharacters();
  }
  input.value = "";
}

function renderCharacters() {
  const charList = document.getElementById("charList");
  charList.innerHTML = characters.map(c => `<span>${c}</span>`).join(" ");
}

function addDialogue() {
  const input = document.getElementById("dialogInput");
  const text = input.value.trim();

  // Se espera formato: Nombre: Texto
  const parts = text.split(":");
  if (parts.length >= 2) {
    const char = parts[0].trim();
    const msg = parts.slice(1).join(":").trim();

    dialogues.push({ character: char, text: msg });
    renderDialogues();
  }
  input.value = "";
}

function renderDialogues() {
  const list = document.getElementById("dialogueList");
  list.innerHTML = dialogues.map(d => 
    `<li><b>${d.character}:</b> ${d.text}</li>`
  ).join("");
}

function exportJSON() {
  const data = {
    dialogue: dialogues
  };
  const json = JSON.stringify(data, null, 2);

  // Crear archivo descargable
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dialogo.json"; // aquí le das nombre
  a.click();
  URL.revokeObjectURL(url);
}