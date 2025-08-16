let characters = [];
let dialogues = [];
let editingIndex = null;

const charInput = document.getElementById('charInput');
const addCharBtn = document.getElementById('addCharBtn');
const charList = document.getElementById('charList');

const dialogInput = document.getElementById('dialogInput');
const suggestionsBox = document.getElementById('suggestions');

const addDialogBtn = document.getElementById('addDialogBtn');
const editLastBtn = document.getElementById('editLastBtn');
const dialogueList = document.getElementById('dialogueList');
const exportBtn = document.getElementById('exportBtn');

/* === Agregar personajes === */
function addCharacter() {
  const name = charInput.value.trim();
  if (!name || characters.includes(name)) return;
  characters.push(name);
  renderCharacters();
  charInput.value = '';
}

function renderCharacters() {
  if (characters.length === 0) {
    charList.innerHTML = '<span class="muted">Sin personajes. Agrega uno arriba.</span>';
    return;
  }
  charList.innerHTML = characters
    .map(c => `<div class="tag" data-name="${c}">${c}</div>`)
    .join('');
  document.querySelectorAll('.tag').forEach(el => {
    el.addEventListener('click', () => {
      insertAtCursor(el.dataset.name + ': ');
    });
  });
}

/* === Helpers === */
function insertAtCursor(text) {
  const pos = dialogInput.selectionStart;
  const val = dialogInput.value;
  dialogInput.value = val.slice(0, pos) + text + val.slice(pos);
  dialogInput.setSelectionRange(pos + text.length, pos + text.length);
  dialogInput.focus();
}

/* === Autocompletado === */
function updateSuggestions() {
  const val = dialogInput.value;
  const pos = dialogInput.selectionStart;
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
  const line = val.slice(lineStart, pos);

  const tokenMatch = line.match(/^([^\s:]+)/);
  if (!tokenMatch) { hideSuggestions(); return; }
  const token = tokenMatch[1].toLowerCase();

  const filtered = characters.filter(c => c.toLowerCase().startsWith(token));
  if (filtered.length === 0) { hideSuggestions(); return; }

  suggestionsBox.innerHTML = filtered.map(c =>
    `<div class="sug-item" data-name="${c}">${c}</div>`
  ).join('');
  suggestionsBox.style.display = 'block';

  suggestionsBox.querySelectorAll('.sug-item').forEach(el => {
    el.addEventListener('click', () => applySuggestion(el.dataset.name));
  });
}

function applySuggestion(name) {
  const val = dialogInput.value;
  const pos = dialogInput.selectionStart;
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
  const line = val.slice(lineStart, pos);
  const tokenMatch = line.match(/^([^\s:]+)/);

  if (tokenMatch) {
    const tokenStart = lineStart;
    const tokenEnd = tokenStart + tokenMatch[1].length;
    dialogInput.value = val.slice(0, tokenStart) + name + ': ' + val.slice(tokenEnd);
    const newPos = tokenStart + name.length + 2;
    dialogInput.setSelectionRange(newPos, newPos);
  } else {
    insertAtCursor(name + ': ');
  }
  hideSuggestions();
}

function hideSuggestions() {
  suggestionsBox.style.display = 'none';
  suggestionsBox.innerHTML = '';
}

/* === Procesar diálogos === */
function processTextareaToDialogues() {
  const raw = dialogInput.value.trim();
  if (!raw) return;

  raw.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const name = line.slice(0, idx).trim();
    const text = line.slice(idx + 1).trim();
    if (!name || !text) return;
    dialogues.push({ character: name, text });
  });

  renderDialogues();
  dialogInput.value = '';
  hideSuggestions();
}

/* === Render diálogos === */
function renderDialogues() {
  if (dialogues.length === 0) {
    dialogueList.innerHTML = '<span class="muted">Aún no hay diálogos.</span>';
    return;
  }
  dialogueList.innerHTML = dialogues.map(d =>
    `<div class="dlg"><b>${d.character}</b><div>${d.text}</div></div>`
  ).join('');
}

/* === Editar último diálogo === */
function editLastDialogue() {
  if (dialogues.length === 0) return;
  const last = dialogues.pop();
  dialogInput.value = `${last.character}: ${last.text}`;
  renderDialogues();
}

/* === Exportar JSON === */
function exportJSON() {
  const data = { dialogue: dialogues };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = prompt('Nombre del archivo (sin extensión):', 'dialogo') || 'dialogo';
  a.href = url;
  a.download = name + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* === Eventos === */
addCharBtn.addEventListener('click', addCharacter);
charInput.addEventListener('keydown', e => { if (e.key === 'Enter') addCharacter(); });

dialogInput.addEventListener('input', updateSuggestions);
dialogInput.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const first = suggestionsBox.querySelector('.sug-item');
    if (first) applySuggestion(first.dataset.name);
  }
});

addDialogBtn.addEventListener('click', processTextareaToDialogues);
editLastBtn.addEventListener('click', editLastDialogue);
exportBtn.addEventListener('click', exportJSON);

/* Inicial */
renderCharacters();
renderDialogues();