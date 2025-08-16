// data
let characters = [];
let dialogues = [];
let editingIndex = null;

// dom
const charInput = document.getElementById('charInput');
const addCharBtn = document.getElementById('addCharBtn');
const charList = document.getElementById('charList');

const dialogInput = document.getElementById('dialogInput');
const autocomplete = document.getElementById('autocomplete');
const acceptBtn = document.getElementById('acceptBtn');

const addDialogBtn = document.getElementById('addDialogBtn');
const exportBtn = document.getElementById('exportBtn');
const dialogueList = document.getElementById('dialogueList');

/* ---------- Characters ---------- */
function addCharacter(){
  const name = charInput.value.trim();
  if(!name) { charInput.value=''; return; }
  if(characters.includes(name)) { charInput.value=''; return; }
  characters.push(name);
  charInput.value='';
  renderCharacters();
}
function renderCharacters(){
  if(characters.length===0){
    charList.innerHTML = 'No hay personajes aún.';
    return;
  }
  charList.innerHTML = characters.map(c=>`<div class="tag" data-name="${escapeHtml(c)}">${escapeHtml(c)}</div>`).join(' ');
  // attach click to tags: insert Name:  at cursor
  charList.querySelectorAll('.tag').forEach(el=>{
    el.onclick = ()=> {
      replaceTokenAtLineStart(el.dataset.name + ': ');
      dialogInput.focus();
      updateAutocomplete();
    }
  });
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- Autocomplete ---------- */
// find token at start of current line
function getLineTokenAndPos(){
  const pos = dialogInput.selectionStart;
  const val = dialogInput.value;
  const lineStart = val.lastIndexOf('\n', pos-1) + 1;
  const upToCursor = val.slice(lineStart, pos);
  const m = upToCursor.match(/^([^\s:]+)/); // first word (no spaces or :)
  if(!m) return { token:'', lineStart, tokenStart: null, tokenEnd: null };
  const token = m[1];
  return { token, lineStart, tokenStart: lineStart, tokenEnd: lineStart + token.length };
}
function updateAutocomplete(){
  const info = getLineTokenAndPos();
  if(!info.token || info.token.length===0){ hideAutocomplete(); return; }
  const t = info.token.toLowerCase();
  const matches = characters.filter(c => c.toLowerCase().startsWith(t));
  if(matches.length===0){ hideAutocomplete(); return; }
  autocomplete.innerHTML = matches.map(m => `<div class="aut-item" data-name="${escapeHtml(m)}">${escapeHtml(m)}</div>`).join('');
  autocomplete.classList.remove('hidden');
  // attach clicks
  autocomplete.querySelectorAll('.aut-item').forEach(it=>{
    it.onclick = ()=> applySuggestion(it.dataset.name);
  });
}
function hideAutocomplete(){ autocomplete.classList.add('hidden'); autocomplete.innerHTML=''; }
function applySuggestion(name){
  const info = getLineTokenAndPos();
  // if no token, just insert at cursor
  if(info.tokenStart === null){
    insertAtCursor(name + ': ');
    hideAutocomplete();
    return;
  }
  const val = dialogInput.value;
  const before = val.slice(0, info.tokenStart);
  const after = val.slice(info.tokenEnd);
  const newVal = before + name + ': ' + after;
  const cursorPos = before.length + name.length + 2;
  dialogInput.value = newVal;
  setTimeout(()=>dialogInput.setSelectionRange(cursorPos, cursorPos), 0);
  hideAutocomplete();
}
/* Accept first suggestion (button / Tab) */
function acceptFirstSuggestion(){
  const first = autocomplete.querySelector('.aut-item');
  if(first) applySuggestion(first.dataset.name);
}

/* Insert helpers */
function insertAtCursor(text){
  const pos = dialogInput.selectionStart;
  const v = dialogInput.value;
  dialogInput.value = v.slice(0,pos) + text + v.slice(pos);
  const newPos = pos + text.length;
  setTimeout(()=>dialogInput.setSelectionRange(newPos,newPos),0);
}
/* Replace token at start of line (if token present) otherwise insert at cursor */
function replaceTokenAtLineStart(replacement){
  const info = getLineTokenAndPos();
  const val = dialogInput.value;
  if(info.tokenStart === null){
    insertAtCursor(replacement);
    return;
  }
  const before = val.slice(0, info.tokenStart);
  const after = val.slice(info.tokenEnd);
  const newVal = before + replacement + after;
  const cursorPos = before.length + replacement.length;
  dialogInput.value = newVal;
  setTimeout(()=>dialogInput.setSelectionRange(cursorPos, cursorPos),0);
}

/* ---------- Add / Edit Dialogues ---------- */
function processLinesToDialogues(){
  const raw = dialogInput.value;
  if(!raw.trim()) return;
  const lines = raw.split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if(!trimmed) return;
    const colon = trimmed.indexOf(':');
    if(colon === -1) return; // ignore lines without colon
    const name = trimmed.slice(0, colon).trim();
    let text = trimmed.slice(colon + 1).trim();
    if(!name || !text) return;
    // replace double quotes and curly quotes with single quote
    text = text.replace(/["“”]/g, "'");
    // if editing mode is active and editingIndex set, we handled externally (we will only use addDialogue's behavior)
    dialogues.push({ character: name, text });
  });
}

function addDialogue(evt){
  // If editingIndex !== null, we update that one and exit edit mode
  const raw = dialogInput.value.trim();
  if(raw === '' && editingIndex === null) return;
  // If editingIndex is set and the user modified and presses add: replace that index
  if(editingIndex !== null){
    const line = raw; // expect single line with Name: text (we'll parse first line)
    const colon = line.indexOf(':');
    if(colon !== -1){
      const name = line.slice(0, colon).trim();
      let text = line.slice(colon + 1).trim();
      text = text.replace(/["“”]/g,"'");
      dialogues[editingIndex] = { character: name, text };
      editingIndex = null;
      dialogInput.value = '';
      renderDialogues();
      return;
    } else {
      // If invalid while editing, do nothing
      alert('Formato inválido para editar (debe ser: Nombre: Texto)');
      return;
    }
  }
  // Normal add: allow multiple lines
  processLinesToDialogues();
  dialogInput.value = '';
  renderDialogues();
}

/* Click a dialogue to edit it (any item) */
function startEditDialogue(index){
  const d = dialogues[index];
  if(!d) return;
  editingIndex = index;
  dialogInput.value = `${d.character}: ${d.text}`;
  // put cursor at end
  setTimeout(()=>{ const p = dialogInput.value.length; dialogInput.setSelectionRange(p,p); dialogInput.focus(); }, 0);
}

/* ---------- Render ---------- */
function renderDialogues(){
  if(dialogues.length === 0){
    dialogueList.innerHTML = '<div class="muted">Aún no hay diálogos.</div>';
    return;
  }
  dialogueList.innerHTML = dialogues.map((d,i)=> {
    return `<div class="dialogue-item" data-idx="${i}"><div class="who">${escapeHtml(d.character)}</div><div class="what">${escapeHtml(d.text)}</div></div>`;
  }).join('');
  // attach click handlers
  dialogueList.querySelectorAll('.dialogue-item').forEach(el=>{
    el.onclick = ()=> startEditDialogue(Number(el.dataset.idx));
  });
}

/* ---------- Export JSON ---------- */
function exportJSON(){
  const data = { dialogue: dialogues };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = prompt('Nombre del archivo (sin extensión):', 'dialogo') || 'dialogo';
  a.href = url; a.download = name + '.json'; a.click();
  URL.revokeObjectURL(url);
}

function insertCharacterTag(name){
  const val = dialogInput.value;
  const before = val.endsWith("\n") || val.length === 0 ? val : val + "\n";
  const insertion = name + ": ";

  dialogInput.value = before + insertion;

  // mueve el cursor al final
  const newPos = dialogInput.value.length;
  setTimeout(()=> dialogInput.setSelectionRange(newPos, newPos), 0);
  dialogInput.focus();

  updateAutocomplete();
}

/* ---------- Events ---------- */
// add character
addCharBtn.addEventListener('click', addCharacter);
charInput.addEventListener('keydown', e=> { if(e.key === 'Enter'){ e.preventDefault(); addCharacter(); }});

// autoupdate suggestions while typing
dialogInput.addEventListener('input', updateAutocomplete);
// hide autocomplete on blur (small delay for click)
dialogInput.addEventListener('blur', ()=> setTimeout(hideAutocomplete, 120));

// Tab key -> accept first suggestion
dialogInput.addEventListener('keydown', e=>{
  if(e.key === 'Tab'){
    const first = autocomplete.querySelector('.aut-item');
    if(first){
      e.preventDefault(); // prevent focus change
      applySuggestion(first.dataset.name || first.getAttribute('data-name') || first.textContent);
    }
  }
});

// accept button
acceptBtn.addEventListener('click', acceptFirstSuggestion);

// add dialog(s)
addDialogBtn.addEventListener('click', addDialogue);
exportBtn.addEventListener('click', exportJSON);

// initial render
renderCharacters();
renderDialogues();