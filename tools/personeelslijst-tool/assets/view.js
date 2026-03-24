let staffRows = [];
let filteredRows = [];

const tableBody = document.getElementById('staffTableBody');
const searchInput = document.getElementById('searchInput');
const loadBtn = document.getElementById('loadBtn');
const messageBox = document.getElementById('messageBox');

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  loadRows();
});

function bindEvents() {
  loadBtn.addEventListener('click', loadRows);
  searchInput.addEventListener('input', applyFilter);
}

async function loadRows() {
  showMessage('Personeelslijst wordt geladen...', 'success');

  try {
    const response = await fetch(`${API_URL}?action=readonly`);
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
        <td colspan="5" class="empty-state">Geen resultaten gevonden.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredRows.map(row => `
    <tr>
      <td>${escapeHtml(row.roepnummer || '')}</td>
      <td>${escapeHtml(row.naam || '')}</td>
      <td>${escapeHtml(row.rang || '')}</td>
      <td>${escapeHtml(row.afdeling || '')}</td>
      <td><span class="badge ${getStatusClass(row.status)}">${escapeHtml(row.status || '')}</span></td>
    </tr>
  `).join('');
}

function getStatusClass(status) {
  const value = String(status || '').trim().toLowerCase();

  if (value === 'actief') return 'status-actief';
  if (value === 'non-actief' || value === 'non actief') return 'status-non-actief';
  if (value === 'verlof') return 'status-verlof';

  return 'status-default';
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
