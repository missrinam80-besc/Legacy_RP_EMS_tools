/**
 * EMS Opnameverslag Generator
 * ----------------------------------------
 * Statische versie voor de multi-tool GitHub Pages structuur.
 * Alle data blijft lokaal in de browser.
 */

let appConfig = null;

const STORAGE_KEY = "ems_tool_opname_report_v1";

const form = document.getElementById("reportForm");
const output = document.getElementById("reportOutput");
const costDisplay = document.getElementById("costDisplay");
const statusBox = document.getElementById("statusBox");
const admissionTypeDisplay = document.getElementById("admissionTypeDisplay");
const dischargeDisplay = document.getElementById("dischargeDisplay");

const copyBtn = document.getElementById("copyBtn");
const downloadTxtBtn = document.getElementById("downloadTxtBtn");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const clearStorageBtn = document.getElementById("clearStorageBtn");
const resetBtn = document.getElementById("resetBtn");
const manualRefreshBtn = document.getElementById("manualRefreshBtn");

function getValue(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function getChecked(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

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

function clean(text) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function joinList(list) {
  return list.length ? list.join(", ") : "Niet gespecificeerd";
}

function line(label, value) {
  const finalValue = value && String(value).trim() ? String(value).trim() : "Niet ingevuld";
  return `${label}: ${finalValue}`;
}

function formatMoney(value) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function showStatus(message, type = "ok") {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden", "error");

  if (type === "error") {
    statusBox.classList.add("error");
  }
}

function clearStatus() {
  statusBox.classList.add("hidden");
  statusBox.classList.remove("error");
  statusBox.textContent = "";
}

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

function updateMeta() {
  admissionTypeDisplay.textContent = getValue("admissionType") || "—";
  dischargeDisplay.textContent = getValue("dischargeExpectation") || "—";
}

function generateReport() {
  const costData = buildCosts();
  updateMeta();

  const report = `
=== ${appConfig.reportType || "OPNAMEVERSLAG"} ===

[ALGEMENE BASISGEGEVENS]
${line("Procedure / opnamegrond", getValue("procedureType"))}
${line("Naam patiënt", getValue("patientName"))}
${line("Patiënt-ID", getValue("patientId"))}
${line("Datum & tijd", formatDateTime(getValue("dateTime")))}
${line("Locatie", getValue("location"))}
${line("Behandelaar / rapporteur", getValue("staffLead"))}
${line("Assistent(en)", getValue("staffAssist"))}

[OPNAME INTAKE]
${line("Reden van opname", getValue("admissionReason"))}
${line("Voorgeschiedenis / relevante context", getValue("admissionHistory"))}
${line("Type opname", getValue("admissionType"))}
${line("Prioriteit", getValue("admissionPriority"))}
${line("Afdeling / kamer", getValue("admissionWard"))}
${line("Toestand bij opname", getValue("admissionStatus"))}
${line("Onderzoek en bevindingen", getValue("admissionExam"))}

[ZORGPLAN EN OPVOLGING]
${line("Opname-indicaties", joinList(getChecked("indications")))}
${line("Observatie / opvolgpunten", joinList(getChecked("monitoringPoints")))}
${line("Risico's / aandachtspunten", joinList(getChecked("riskFlags")))}
${line("Behandelplan / observatieplan", getValue("admissionPlan"))}
${line("Medicatie / interventies tijdens opname", getValue("admissionMedications"))}
${line("Instructies / afspraken", getValue("admissionInstructions"))}
${line("Geschatte duur opname", getValue("estimatedStay"))}
${line("Verwachte afhandeling", getValue("dischargeExpectation"))}
${line("Follow-up / vervolgactie", getValue("followUp"))}

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

function getAllFormData() {
  const result = {};
  const textFields = form.querySelectorAll("input, textarea, select");

  textFields.forEach((field) => {
    if (field.type === "checkbox") return;
    if (!field.id) return;
    result[field.id] = field.value;
  });

  result.indications = getChecked("indications");
  result.monitoringPoints = getChecked("monitoringPoints");
  result.riskFlags = getChecked("riskFlags");

  result.supplements = Array.from(document.querySelectorAll(".cost-input")).map((input) => ({
    label: input.dataset.label,
    quantity: Number(input.value || 0),
    unitCost: Number(input.dataset.cost || 0)
  }));

  return result;
}

function saveToLocalStorage() {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      formData: getAllFormData()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Opslaan in localStorage mislukt:", error);
  }
}

function restoreFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);
    const data = parsed?.formData;

    if (!data || typeof data !== "object") return false;

    Object.entries(data).forEach(([key, value]) => {
      if (key === "indications" || key === "monitoringPoints" || key === "riskFlags" || key === "supplements") return;

      const field = document.getElementById(key);
      if (!field) return;
      field.value = value ?? "";
    });

    if (Array.isArray(data.indications)) {
      document.querySelectorAll('input[name="indications"]').forEach((checkbox) => {
        checkbox.checked = data.indications.includes(checkbox.value);
      });
    }

    if (Array.isArray(data.monitoringPoints)) {
      document.querySelectorAll('input[name="monitoringPoints"]').forEach((checkbox) => {
        checkbox.checked = data.monitoringPoints.includes(checkbox.value);
      });
    }

    if (Array.isArray(data.riskFlags)) {
      document.querySelectorAll('input[name="riskFlags"]').forEach((checkbox) => {
        checkbox.checked = data.riskFlags.includes(checkbox.value);
      });
    }

    if (Array.isArray(data.supplements)) {
      const supplementInputs = Array.from(document.querySelectorAll(".cost-input"));

      data.supplements.forEach((savedItem, index) => {
        const input = supplementInputs[index];
        if (!input) return;
        input.value = Number(savedItem.quantity || 0);
      });
    }

    return true;
  } catch (error) {
    console.error("Herstellen uit localStorage mislukt:", error);
    return false;
  }
}

function clearLocalStorageData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Wissen van localStorage mislukt:", error);
  }
}

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

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function downloadTxt() {
  clearStatus();
  const { reportText } = generateReport();

  const filename = `opnameverslag-${buildFileTimestamp()}.txt`;
  downloadFile(filename, reportText, "text/plain;charset=utf-8");
  showStatus("TXT-bestand werd gedownload.");
}

function downloadJson() {
  clearStatus();
  const { reportText, costData } = generateReport();

  const payload = {
    type: appConfig.reportType || "Opnameverslag",
    exportedAt: new Date().toISOString(),
    formData: getAllFormData(),
    costs: costData,
    report: reportText
  };

  const filename = `opnameverslag-${buildFileTimestamp()}.json`;
  downloadFile(filename, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  showStatus("JSON-bestand werd gedownload.");
}

function buildFileTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}-${hour}${minute}`;
}

function setDefaultDateTime() {
  const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  document.getElementById("dateTime").value = nowLocal;
}

function clearStorageOnly() {
  clearLocalStorageData();
  showStatus("Lokale opslag van deze tool werd gewist.");
}

function resetForm() {
  form.reset();

  document.querySelectorAll(".cost-input").forEach((input) => {
    input.value = 0;
  });

  document.querySelectorAll('input[name="indications"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  document.querySelectorAll('input[name="monitoringPoints"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  document.querySelectorAll('input[name="riskFlags"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  document.getElementById("customCost").value = 0;
  setDefaultDateTime();

  clearLocalStorageData();
  clearStatus();
  generateReport();

  showStatus("Formulier en lokale opslag werden gereset.");
}

function handleFormUpdate() {
  generateReport();
  saveToLocalStorage();
}

async function initApp() {
  try {
    const response = await fetch("config.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`config.json kon niet geladen worden (${response.status})`);
    }

    appConfig = await response.json();

    populateSelect("admissionType", appConfig.admissionTypeOptions || []);
    populateSelect("admissionPriority", appConfig.admissionPriorityOptions || []);
    populateSelect("dischargeExpectation", appConfig.dischargeExpectationOptions || []);
    populateCheckboxGroup("indicationsContainer", "indications", appConfig.indications || []);
    populateCheckboxGroup("monitoringContainer", "monitoringPoints", appConfig.monitoringPoints || []);
    populateCheckboxGroup("riskFlagsContainer", "riskFlags", appConfig.riskFlags || []);
    populateBaseCosts(appConfig.baseCosts || []);
    populateSupplements(appConfig.supplements || []);

    setDefaultDateTime();

    const restored = restoreFromLocalStorage();

    form.addEventListener("input", handleFormUpdate);
    form.addEventListener("change", handleFormUpdate);
    copyBtn.addEventListener("click", copyReport);
    downloadTxtBtn.addEventListener("click", downloadTxt);
    downloadJsonBtn.addEventListener("click", downloadJson);
    clearStorageBtn.addEventListener("click", clearStorageOnly);
    resetBtn.addEventListener("click", resetForm);
    manualRefreshBtn.addEventListener("click", generateReport);

    generateReport();

    if (restored) {
      showStatus("Vorige lokale sessie werd automatisch hersteld.");
    } else {
      showStatus("Tool succesvol geladen.");
    }
  } catch (error) {
    console.error(error);
    showStatus(`Fout bij laden van de tool: ${error.message}`, "error");
  }
}

initApp();
