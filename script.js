let characters = [];
let dialogues = [];
let editIndex = null; // Para editar mensajes

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

// --- Autocompletado ---
const dialogInput = document.getElementById("dialogInput");
const autocompleteBox = document.getElementById("autocompleteBox");

dialogInput.addEventListener("input", () => {
  const text = dialogInput.value;
  const lastWord = text.split(" ")[0]; // primera palabra
  const matches = characters.filter(c => c.toLowerCase().startsWith(lastWord.toLowerCase()));

  if (matches.length > 0 && lastWord.length > 0) {
    autocompleteBox.innerHTML = matches.map(m => `<div onclick="selectAutocomplete('${m}')">${m}</div>`).join("");
    autocompleteBox.style.display = "block";
  } else {
    autocompleteBox.style.display = "none";
  }
});

dialogInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const first = autocompleteBox.querySelector("div");
    if (first) selectAutocomplete(first.textContent);
  }
});

function selectAutocomplete(name) {
  const text = dialogInput.value;
  const rest = text.substring(text.indexOf(" ")).trim();
  dialogInput.value = `${name}: ${rest}`;
  autocompleteBox.style.display = "none";
}

// --- Agregar diálogos ---
function addDialogue() {
  const text = dialogInput.value.trim();
  if (!text.includes(":")) return alert("Formato: Personaje: Texto");

  const [char, ...msgParts] = text.split(":");
  let msg = msgParts.join(":").trim();

  // Reemplazar "" con ''
  msg = msg.replace(/"/g, "'");

  if (editIndex !== null) {
    dialogues[editIndex] = { character: char.trim(), text: msg };
    editIndex = null;
  } else {
    dialogues.push({ character: char.trim(), text: msg });
  }

  renderDialogues();
  dialogInput.value = "";
}

function renderDialogues() {
  const list = document.getElementById("dialogueList");
  list.innerHTML = dialogues.map((d, i) =>
    `<li onclick="editDialogue(${i})"><b>${d.character}:</b> ${d.text}</li>`
  ).join("");
}

function editDialogue(index) {
  const d = dialogues[index];
  dialogInput.value = `${d.character}: ${d.text}`;
  editIndex = index;
}

// --- Exportar JSON ---
function exportJSON() {
  const data = { dialogue: dialogues };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dialogos.json";
  a.click();
  URL.revokeObjectURL(url);
}