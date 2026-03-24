let staffRows = [];
let filteredRows = [];

const tableBody = document.getElementById('staffTableBody');
const searchInput = document.getElementById('searchInput');
const actorInput = document.getElementById('actorInput');
const loadBtn = document.getElementById('loadBtn');
const addRowBtn = document.getElementById('addRowBtn');
const saveBtn = document.getElementById('saveBtn');
const messageBox = document.getElementById('messageBox');

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadRows();
});

function bindEvents() {
  loadBtn.addEventListener('click', loadRows);
  addRowBtn.addEventListener('click', addRow);
  saveBtn.addEventListener('click', saveRows);
  searchInput.addEventListener('input', applyFilter);
}

async function loadRows() {
  showMessage('Personeelslijst wordt geladen...', 'success');

  try {
    const response = await fetch(`${API_URL}?action=list`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Laden mislukt.');
    }

    staffRows = Array.isArray(data.rows) ? data.rows : [];
    applyFilter();
    showMessage('Personeelslijst is geladen.', 'success');
  } catch (err) {
    showMessage(err.message || 'Fout bij laden.', 'error');
  }
}

function applyFilter() {
  const q = searchInput.value.trim().toLowerCase();

  if (!q) {
    filteredRows = [...staffRows];
  } else {
    filteredRows = staffRows.filter(row => {
      return [
        row.roepnummer,
        row.naam,
        row.rang,
        row.afdeling,
        row.status
      ].some(value => String(value || '').toLowerCase().includes(q));
    });
  }

  renderTable();
}

function renderTable() {
  if (!filteredRows.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">Geen resultaten gevonden.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredRows.map((row) => {
    const realIndex = staffRows.findIndex(item => String(item.roepnummer) === String(row.roepnummer));

    return `
      <tr>
        <td><input class="table-input" type="text" value="${escapeHtml(row.roepnummer || '')}" data-index="${realIndex}" data-field="roepnummer"></td>
        <td><input class="table-input" type="text" value="${escapeHtml(row.naam || '')}" data-index="${realIndex}" data-field="naam"></td>
        <td><input class="table-input" type="text" value="${escapeHtml(row.rang || '')}" data-index="${realIndex}" data-field="rang"></td>
        <td><input class="table-input" type="text" value="${escapeHtml(row.afdeling || '')}" data-index="${realIndex}" data-field="afdeling"></td>
        <td><input class="table-input" type="text" value="${escapeHtml(row.status || '')}" data-index="${realIndex}" data-field="status"></td>
        <td class="checkbox-cell">
          <input type="checkbox" ${row.is_active ? 'checked' : ''} data-index="${realIndex}" data-field="is_active">
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="danger" onclick="removeRow(${realIndex})">Verwijderen</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  bindTableInputs();
}

function bindTableInputs() {
  document.querySelectorAll('#staffTableBody input[data-field]').forEach(input => {
    const type = input.getAttribute('type');

    if (type === 'checkbox') {
      input.addEventListener('change', handleFieldChange);
    } else {
      input.addEventListener('input', handleFieldChange);
    }
  });
}

function handleFieldChange(event) {
  const el = event.target;
  const index = Number(el.dataset.index);
  const field = el.dataset.field;

  if (Number.isNaN(index) || !staffRows[index]) return;

  if (el.type === 'checkbox') {
    staffRows[index][field] = el.checked;
  } else {
    staffRows[index][field] = el.value;
  }
}

function addRow() {
  staffRows.push({
    roepnummer: '',
    naam: '',
    rang: '',
    afdeling: '',
    status: 'actief',
    is_active: true
  });

  applyFilter();
}

function removeRow(index) {
  if (index < 0 || index >= staffRows.length) return;
  staffRows.splice(index, 1);
  applyFilter();
}

async function saveRows() {
  const actor = actorInput.value.trim();

  if (!actor) {
    showMessage('Vul eerst jouw naam in voor logging.', 'error');
    return;
  }

  const cleanedRows = staffRows.map(row => ({
    roepnummer: String(row.roepnummer || '').trim(),
    naam: String(row.naam || '').trim(),
    rang: String(row.rang || '').trim(),
    afdeling: String(row.afdeling || '').trim(),
    status: String(row.status || '').trim(),
    is_active: !!row.is_active
  }));

  const validationError = validateRows(cleanedRows);
  if (validationError) {
    showMessage(validationError, 'error');
    return;
  }

  try {
    showMessage('Personeelslijst wordt opgeslagen...', 'success');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveAll',
        actor,
        rows: cleanedRows
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Opslaan mislukt.');
    }

    showMessage('Personeelslijst is opgeslagen.', 'success');
    loadRows();
  } catch (err) {
    showMessage(err.message || 'Fout bij opslaan.', 'error');
  }
}

function validateRows(rows) {
  const seen = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (!row.roepnummer) {
      return `Rij ${i + 1}: roepnummer ontbreekt.`;
    }

    if (seen.has(row.roepnummer)) {
      return `Dubbel roepnummer gevonden: ${row.roepnummer}`;
    }

    seen.add(row.roepnummer);
  }

  return null;
}

function showMessage(text, type = 'success') {
  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
