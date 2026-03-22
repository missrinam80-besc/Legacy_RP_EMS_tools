/**
 * EMS Ziekenhuiskosten Calculator
 * --------------------------------
 * Deze tool werkt volledig client-side:
 * - Geen database
 * - Geen backend
 * - Prijzen worden geladen uit pricing.json
 * - Geschikt voor hosting via GitHub Pages
 *
 * Werking:
 * 1. pricing.json laden
 * 2. Formulier dynamisch opbouwen
 * 3. Selecties uitlezen
 * 4. Subtotalen en totaal berekenen
 * 5. Overzicht en compacte tekst genereren
 */

let pricingData = null;

/**
 * Initialisatie zodra de pagina geladen is.
 */
document.addEventListener("DOMContentLoaded", async () => {
  setTodayAsDefaultDate();
  bindStaticEvents();
  await loadPricing();
});

/**
 * Zet de datum standaard op vandaag.
 */
function setTodayAsDefaultDate() {
  const dateInput = document.getElementById("visitDate");
  if (!dateInput) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

/**
 * Koppel events aan statische knoppen en velden.
 */
function bindStaticEvents() {
  document.getElementById("copySummaryBtn").addEventListener("click", () => {
    copyTextareaValue("summaryOutput");
  });

  document.getElementById("copyCompactBtn").addEventListener("click", () => {
    copyTextareaValue("compactOutput");
  });

  document.getElementById("resetBtn").addEventListener("click", resetForm);

  document.getElementById("manualAdjustment").addEventListener("input", updateAll);
  document.getElementById("adjustmentType").addEventListener("change", updateAll);
  document.getElementById("currencySymbol").addEventListener("input", updateAll);

  document.getElementById("patientName").addEventListener("input", updateAll);
  document.getElementById("staffName").addEventListener("input", updateAll);
  document.getElementById("visitDate").addEventListener("input", updateAll);
  document.getElementById("notes").addEventListener("input", updateAll);
}

/**
 * Laad pricing.json in.
 */
async function loadPricing() {
  try {
    const response = await fetch("pricing.json");
    if (!response.ok) {
      throw new Error(`Kon pricing.json niet laden. Status: ${response.status}`);
    }

    pricingData = await response.json();

    renderOptions("baseCosts", pricingData.baseCosts, "radio", "baseCost");
    renderOptions("exams", pricingData.exams, "checkbox", "exam");
    renderOptions("treatments", pricingData.treatments, "checkbox", "treatment");
    renderOptions("extras", pricingData.extras, "checkbox", "extra");

    updateAll();
  } catch (error) {
    console.error(error);
    document.getElementById("summaryOutput").value =
      "Fout bij laden van pricing.json. Controleer of het bestand in dezelfde map staat.";
    document.getElementById("compactOutput").value =
      "De calculator kon niet initialiseren door een laadfout.";
  }
}

/**
 * Render een lijst van opties als radio buttons of checkboxes.
 *
 * @param {string} containerId - ID van de container
 * @param {Array} items - lijst met prijsitems
 * @param {string} inputType - "radio" of "checkbox"
 * @param {string} groupName - naam van de inputgroep
 */
function renderOptions(containerId, items, inputType, groupName) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "option-card";

    const checkedAttr = item.default ? "checked" : "";

    wrapper.innerHTML = `
      <label>
        <input
          type="${inputType}"
          name="${groupName}"
          value="${item.id}"
          data-price="${item.price}"
          data-label="${escapeHtml(item.label)}"
          ${checkedAttr}
        />
        <span class="option-content">
          <span class="option-title">${escapeHtml(item.label)}</span>
          <span class="option-price">${formatMoney(item.price)}</span>
        </span>
      </label>
    `;

    container.appendChild(wrapper);
  });

  container.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", updateAll);
  });
}

/**
 * Haal geselecteerde inputitems op uit een container.
 *
 * @param {string} containerId
 * @returns {Array<{id: string, label: string, price: number}>}
 */
function getSelectedItems(containerId) {
  const container = document.getElementById(containerId);
  const selected = [];

  container.querySelectorAll("input:checked").forEach((input) => {
    selected.push({
      id: input.value,
      label: input.dataset.label,
      price: Number(input.dataset.price || 0)
    });
  });

  return selected;
}

/**
 * Tel de prijzen van een lijst items op.
 *
 * @param {Array<{price:number}>} items
 * @returns {number}
 */
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

/**
 * Lees de manuele correctie uit.
 *
 * @returns {number}
 */
function getAdjustmentValue() {
  const rawValue = Number(document.getElementById("manualAdjustment").value || 0);
  const type = document.getElementById("adjustmentType").value;

  if (type === "subtract") {
    return -Math.abs(rawValue);
  }

  return Math.abs(rawValue);
}

/**
 * Werk alle subtotalen, totaalbedrag en tekstuitvoer bij.
 */
function updateAll() {
  const baseItems = getSelectedItems("baseCosts");
  const examItems = getSelectedItems("exams");
  const treatmentItems = getSelectedItems("treatments");
  const extraItems = getSelectedItems("extras");
  const adjustment = getAdjustmentValue();

  const baseSubtotal = calculateSubtotal(baseItems);
  const examsSubtotal = calculateSubtotal(examItems);
  const treatmentsSubtotal = calculateSubtotal(treatmentItems);
  const extrasSubtotal = calculateSubtotal(extraItems);

  const grandTotal =
    baseSubtotal +
    examsSubtotal +
    treatmentsSubtotal +
    extrasSubtotal +
    adjustment;

  document.getElementById("baseSubtotal").textContent = formatMoney(baseSubtotal);
  document.getElementById("examsSubtotal").textContent = formatMoney(examsSubtotal);
  document.getElementById("treatmentsSubtotal").textContent = formatMoney(treatmentsSubtotal);
  document.getElementById("extrasSubtotal").textContent = formatMoney(extrasSubtotal);
  document.getElementById("adjustmentTotal").textContent = formatMoney(adjustment);
  document.getElementById("grandTotal").textContent = formatMoney(grandTotal);

  generateSummaryOutput({
    baseItems,
    examItems,
    treatmentItems,
    extraItems,
    adjustment,
    baseSubtotal,
    examsSubtotal,
    treatmentsSubtotal,
    extrasSubtotal,
    grandTotal
  });
}

/**
 * Genereer het uitgebreide overzicht en de compacte tekst.
 */
function generateSummaryOutput(data) {
  const patientName = document.getElementById("patientName").value.trim();
  const staffName = document.getElementById("staffName").value.trim();
  const visitDate = document.getElementById("visitDate").value;
  const notes = document.getElementById("notes").value.trim();

  const summaryLines = [];

  summaryLines.push("KOSTENOVERZICHT ZIEKENHUISBEZOEK");
  summaryLines.push("");

  if (patientName) summaryLines.push(`Patiënt / ID: ${patientName}`);
  if (staffName) summaryLines.push(`EMS-medewerker / arts: ${staffName}`);
  if (visitDate) summaryLines.push(`Datum: ${visitDate}`);
  if (notes) summaryLines.push(`Notitie: ${notes}`);

  if (patientName || staffName || visitDate || notes) {
    summaryLines.push("");
  }

  summaryLines.push("Basiskost:");
  summaryLines.push(...formatItemLines(data.baseItems));
  summaryLines.push(`Subtotaal basiskost: ${formatMoney(data.baseSubtotal)}`);
  summaryLines.push("");

  summaryLines.push("Onderzoeken:");
  summaryLines.push(...formatItemLines(data.examItems));
  summaryLines.push(`Subtotaal onderzoeken: ${formatMoney(data.examsSubtotal)}`);
  summaryLines.push("");

  summaryLines.push("Behandelingen:");
  summaryLines.push(...formatItemLines(data.treatmentItems));
  summaryLines.push(`Subtotaal behandelingen: ${formatMoney(data.treatmentsSubtotal)}`);
  summaryLines.push("");

  summaryLines.push("Extra’s:");
  summaryLines.push(...formatItemLines(data.extraItems));
  summaryLines.push(`Subtotaal extra’s: ${formatMoney(data.extrasSubtotal)}`);
  summaryLines.push("");

  summaryLines.push(`Correctie: ${formatMoney(data.adjustment)}`);
  summaryLines.push("");
  summaryLines.push(`TOTAAL: ${formatMoney(data.grandTotal)}`);

  const compactParts = [];
  const allSelectedLabels = [
    ...data.baseItems.map((item) => item.label),
    ...data.examItems.map((item) => item.label),
    ...data.treatmentItems.map((item) => item.label),
    ...data.extraItems.map((item) => item.label)
  ];

  if (allSelectedLabels.length > 0) {
    compactParts.push(`Ziekenhuiskosten berekend op basis van ${allSelectedLabels.join(", ")}`);
  } else {
    compactParts.push("Ziekenhuiskosten berekend zonder geselecteerde kostenposten");
  }

  if (data.adjustment !== 0) {
    compactParts.push(`met een correctie van ${formatMoney(data.adjustment)}`);
  }

  compactParts.push(`Totaalbedrag: ${formatMoney(data.grandTotal)}.`);

  if (notes) {
    compactParts.push(`Notitie: ${notes}.`);
  }

  document.getElementById("summaryOutput").value = summaryLines.join("\n");
  document.getElementById("compactOutput").value = compactParts.join(". ").replace(/\.\./g, ".");
}

/**
 * Format lijnen voor een lijst van items.
 *
 * @param {Array<{label:string, price:number}>} items
 * @returns {string[]}
 */
function formatItemLines(items) {
  if (!items.length) {
    return ["- Geen"];
  }

  return items.map((item) => `- ${item.label}: ${formatMoney(item.price)}`);
}

/**
 * Geldbedrag formatteren volgens gekozen symbool.
 *
 * @param {number} value
 * @returns {string}
 */
function formatMoney(value) {
  const currencySymbol =
    document.getElementById("currencySymbol")?.value?.trim() || "$";

  const sign = value < 0 ? "-" : "";
  const absoluteValue = Math.abs(value);

  return `${sign}${currencySymbol}${absoluteValue}`;
}

/**
 * Kopieer de inhoud van een textarea.
 *
 * @param {string} textareaId
 */
async function copyTextareaValue(textareaId) {
  const textarea = document.getElementById(textareaId);
  if (!textarea || !textarea.value) return;

  try {
    await navigator.clipboard.writeText(textarea.value);
    alert("Tekst gekopieerd naar klembord.");
  } catch (error) {
    console.error("Kopiëren mislukt:", error);
    alert("Kopiëren mislukt.");
  }
}

/**
 * Reset het volledige formulier.
 */
function resetForm() {
  document.getElementById("patientName").value = "";
  document.getElementById("staffName").value = "";
  document.getElementById("notes").value = "";
  document.getElementById("manualAdjustment").value = "0";
  document.getElementById("adjustmentType").value = "add";
  document.getElementById("currencySymbol").value = "$";

  setTodayAsDefaultDate();

  document.querySelectorAll('#baseCosts input[type="radio"]').forEach((input) => {
    input.checked = false;
  });

  document.querySelectorAll('#exams input[type="checkbox"], #treatments input[type="checkbox"], #extras input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });

  updateAll();
}

/**
 * Beveiliging voor labels in HTML.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
