/**
 * EMS Trauma Rapportgenerator
 * ----------------------------------------
 * Volledig statische versie voor GitHub Pages.
 * Geen database, geen backend, geen externe API nodig.
 *
 * Bestanden:
 * - index.html
 * - styles.css
 * - config.json
 * - app.js
 *
 * Deze tool:
 * - leest configuratie uit config.json
 * - bouwt selecties, checkboxen en kostenvelden dynamisch op
 * - genereert automatisch een trauma-rapport
 * - berekent MAP, shock index en kosten
 * - laat export toe naar TXT en JSON
 */

let appConfig = null;

const form = document.getElementById("reportForm");
const output = document.getElementById("reportOutput");
const mapDisplay = document.getElementById("mapDisplay");
const shockDisplay = document.getElementById("shockDisplay");
const costDisplay = document.getElementById("costDisplay");
const statusBox = document.getElementById("statusBox");

const copyBtn = document.getElementById("copyBtn");
const downloadTxtBtn = document.getElementById("downloadTxtBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const resetBtn = document.getElementById("resetBtn");
const manualRefreshBtn = document.getElementById("manualRefreshBtn");

/**
 * Haal de tekstwaarde op van een veld op basis van ID.
 */
function getValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

/**
 * Geef alle aangevinkte waardes terug van een checkboxgroep.
 */
function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

/**
 * Formatteer datetime-local naar Belgische datum/tijd.
 */
function formatDateTime(input) {
  if (!input) return "Niet ingevuld";

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  return new Intl.DateTimeFormat("nl-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date).replace(",", "");
}

/**
 * Nette rapport-opmaak.
 */
function clean(text) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Maak een lijst leesbaar.
 */
function joinList(list) {
  return list.length ? list.join(", ") : "Niet gespecificeerd";
}

/**
 * Bouw één rapportregel op.
 */
function line(label, value) {
  const finalValue = value && String(value).trim() ? String(value).trim() : "Niet ingevuld";
  return `${label}: ${finalValue}`;
}

/**
 * Geld formatteren.
 */
function formatMoney(value) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

/**
 * Toon statusmelding.
 */
function showStatus(message, type = "ok") {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden", "error");

  if (type === "error") {
    statusBox.classList.add("error");
  }
}

/**
 * Verberg statusmelding.
 */
function clearStatus() {
  statusBox.classList.add("hidden");
  statusBox.classList.remove("error");
  statusBox.textContent = "";
}

/**
 * Voeg opties toe aan een <select>.
 */
function populateSelect(selectId, options) {
  const select = document.getElementById(selectId);
  select.innerHTML = "";

  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    select.appendChild(option);
  });
}

/**
 * Bouw checkboxen op uit config.json.
 */
function populateCheckboxGroup(containerId, inputName, values) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = "check";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = inputName;
    input.value = value;

    label.appendChild(input);
    label.appendChild(document.createTextNode(value));
    container.appendChild(label);
  });
}

/**
 * Bouw basistarieven op uit config.json.
 */
function populateBaseCosts(costs) {
  const select = document.getElementById("baseCost");
  select.innerHTML = "";

  costs.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.appendChild(option);
  });
}

/**
 * Bouw supplementen dynamisch op uit config.json.
 */
function populateSupplements(supplements) {
  const container = document.getElementById("supplementsContainer");
  container.innerHTML = "";

  supplements.forEach((item) => {
    const label = document.createElement("label");
    label.className = "cost-item";

    label.innerHTML = `
      <span class="cost-label">
        <strong>${item.label}</strong>
        <span>${item.unitLabel}</span>
      </span>
      <span class="qty-wrap">
        Aantal
        <input
          type="number"
          min="0"
          step="1"
          value="0"
          data-cost="${item.cost}"
          data-label="${item.label}"
          class="cost-input"
        >
      </span>
    `;

    container.appendChild(label);
  });
}

/**
 * Bereken MAP en shock index.
 */
function buildCalculations() {
  const sys = Number(getValue("sys"));
  const dia = Number(getValue("dia"));
  const hr = Number(getValue("hr"));

  let map = null;
  let shock = null;

  if (sys > 0 && dia >= 0) {
    map = (sys + (2 * dia)) / 3;
  }

  if (sys > 0 && hr >= 0) {
    shock = hr / sys;
  }

  mapDisplay.textContent = map !== null ? `${map.toFixed(1)} mmHg` : "—";
  shockDisplay.textContent = shock !== null ? shock.toFixed(2) : "—";

  return {
    map: map !== null ? `${map.toFixed(1)} mmHg` : "Niet berekend",
    shock: shock !== null ? shock.toFixed(2) : "Niet berekend"
  };
}

/**
 * Bereken totale kost.
 */
function buildCosts() {
  const baseCostSelect = document.getElementById("baseCost");
  const baseCost = Number(baseCostSelect.value || 0);
  const baseCostLabel = baseCostSelect.options[baseCostSelect.selectedIndex]?.text || "Niet gespecificeerd";
  const manualCorrection = Number(getValue("customCost") || 0);

  const supplementLines = [];
  let supplementTotal = 0;

  document.querySelectorAll(".cost-input").forEach((input) => {
    const qty = Number(input.value || 0);
    const unitCost = Number(input.dataset.cost || 0);
    const label = input.dataset.label || "Supplement";

    if (qty > 0) {
      const subtotal = qty * unitCost;
      supplementTotal += subtotal;
      supplementLines.push(`${label} x${qty} (${formatMoney(unitCost)}) = ${formatMoney(subtotal)}`);
    }
  });

  const total = Math.max(0, baseCost + supplementTotal + manualCorrection);
  costDisplay.textContent = formatMoney(total);

  return {
    baseCost,
    baseCostLabel,
    supplementTotal,
    supplementLines,
    manualCorrection,
    total,
    notes: getValue("costNotes")
  };
}

/**
 * Bouw het trauma-rapport op.
 */
function generateReport() {
  const calculations = buildCalculations();
  const costData = buildCosts();

  const report = `
=== ${appConfig.reportType || "TRAUMARAPPORT"} ===

[ALGEMENE BASISGEGEVENS]
${line("Procedure / onderzoek", getValue("procedureType"))}
${line("Naam patiënt", getValue("patientName"))}
${line("Patiënt-ID", getValue("patientId"))}
${line("Datum & tijd", formatDateTime(getValue("dateTime")))}
${line("Locatie", getValue("location"))}
${line("Behandelaar / rapporteur", getValue("staffLead"))}
${line("Assistent(en)", getValue("staffAssist"))}

[TRAUMA]
${line("Aanmeldingsreden / klacht", getValue("chiefComplaint"))}
${line("Context / mechanisme / voorgeschiedenis", getValue("history"))}
${line("Triage / urgentie", getValue("triage"))}
${line("Pijnscore", getValue("painScore") ? `${getValue("painScore")}/10` : "")}
${line("Klinische observaties / lichamelijk onderzoek", getValue("physicalExam"))}

[VITALS]
${line("Bloeddruk", (getValue("sys") || getValue("dia")) ? `${getValue("sys") || "?"}/${getValue("dia") || "?"} mmHg` : "")}
${line("Hartslag", getValue("hr") ? `${getValue("hr")} bpm` : "")}
${line("Ademhaling", getValue("rr") ? `${getValue("rr")} rpm` : "")}
${line("SpO₂", getValue("spo2") ? `${getValue("spo2")}%` : "")}
${line("Temperatuur", getValue("temp") ? `${getValue("temp")} °C` : "")}
${line("GCS", getValue("gcs"))}
${line("Geschat bloedverlies", getValue("bloodLoss") ? `${getValue("bloodLoss")} ml` : "")}
${line("MAP", calculations.map)}
${line("Shock index", calculations.shock)}

[BEVINDINGEN EN HANDELINGEN]
${line("Bevindingen", joinList(getChecked("findings")))}
${line("Uitgevoerde handelingen", joinList(getChecked("actions")))}
${line("Procedureverloop", getValue("interventions"))}
${line("Medicatie / hulpmiddelen", getValue("medications"))}
${line("Werkdiagnose / conclusie", getValue("diagnosis"))}
${line("Eindstatus / afhandeling", getValue("disposition"))}
${line("Follow-up / controle", getValue("followUp"))}
${line("Nazorg / instructies", getValue("aftercare"))}

[ALGEMENE EXTRA NOTITIES]
${line("Extra notities", getValue("freeNotes"))}

[KOSTEN]
${line("Basistarief", `${costData.baseCostLabel} (${formatMoney(costData.baseCost)})`)}
${line("Supplementen", costData.supplementLines.length ? costData.supplementLines.join("; ") : "Geen")}
${line("Manuele correctie", formatMoney(costData.manualCorrection))}
${line("Kostennotitie", costData.notes)}
${line("Totaal te factureren", formatMoney(costData.total))}
  `;

  output.value = clean(report);

  return {
    reportText: output.value,
    costData
  };
}

/**
 * Kopieer rapport naar klembord.
 */
async function copyReport() {
  clearStatus();
  const { reportText } = generateReport();

  try {
    await navigator.clipboard.writeText(reportText);
    showStatus("Rapport gekopieerd naar klembord.");
  } catch (error) {
    showStatus("Kopiëren naar klembord mislukte. Selecteer en kopieer de tekst manueel.", "error");
  }
}

/**
 * Download bestand.
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Download rapport als TXT.
 */
function downloadTxt() {
  clearStatus();
  const { reportText } = generateReport();

  const filename = `trauma-rapport-${buildFileTimestamp()}.txt`;
  downloadFile(filename, reportText, "text/plain;charset=utf-8");
  showStatus("TXT-bestand werd gedownload.");
}

/**
 * Download rapportdata als JSON.
 */
function downloadJson() {
  clearStatus();
  const { reportText, costData } = generateReport();

  const payload = {
    type: appConfig.reportType || "Traumarapport",
    exportedAt: new Date().toISOString(),
    formData: getAllFormData(),
    calculations: {
      map: mapDisplay.textContent,
      shockIndex: shockDisplay.textContent
    },
    costs: costData,
    report: reportText
  };

  const filename = `trauma-rapport-${buildFileTimestamp()}.json`;
  downloadFile(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  showStatus("JSON-bestand werd gedownload.");
}

/**
 * Verzamel alle formulierdata.
 */
function getAllFormData() {
  const formData = new FormData(form);
  const result = {};

  for (const [key, value] of formData.entries()) {
    if (result[key]) {
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }

  result.findings = getChecked("findings");
  result.actions = getChecked("actions");

  document.querySelectorAll(".cost-input").forEach((input, index) => {
    result[`supplement_${index + 1}`] = {
      label: input.dataset.label,
      quantity: Number(input.value || 0),
      unitCost: Number(input.dataset.cost || 0)
    };
  });

  return result;
}

/**
 * Maak veilige bestandsdatumstring.
 */
function buildFileTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}-${hour}${minute}`;
}

/**
 * Reset formulier.
 */
function resetForm() {
  form.reset();

  document.querySelectorAll(".cost-input").forEach((input) => {
    input.value = 0;
  });

  document.getElementById("customCost").value = 0;
  setDefaultDateTime();

  clearStatus();
  generateReport();
}

/**
 * Zet datum/tijd standaard op nu.
 */
function setDefaultDateTime() {
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  document.getElementById("dateTime").value = nowLocal;
}

/**
 * Laad config.json en initialiseer de tool.
 */
async function initApp() {
  try {
    const response = await fetch("config.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`config.json kon niet geladen worden (${response.status})`);
    }

    appConfig = await response.json();

    populateSelect("triage", appConfig.triageOptions || []);
    populateSelect("disposition", appConfig.dispositionOptions || []);
    populateCheckboxGroup("findingsContainer", "findings", appConfig.findings || []);
    populateCheckboxGroup("actionsContainer", "actions", appConfig.actions || []);
    populateBaseCosts(appConfig.baseCosts || []);
    populateSupplements(appConfig.supplements || []);

    setDefaultDateTime();

    form.addEventListener("input", generateReport);
    form.addEventListener("change", generateReport);
    copyBtn.addEventListener("click", copyReport);
    downloadTxtBtn.addEventListener("click", downloadTxt);
    downloadJsonBtn.addEventListener("click", downloadJson);
    resetBtn.addEventListener("click", resetForm);
    manualRefreshBtn.addEventListener("click", generateReport);

    generateReport();
    showStatus("Tool succesvol geladen.");
  } catch (error) {
    console.error(error);
    showStatus(`Fout bij laden van de tool: ${error.message}`, "error");
  }
}

initApp();
