/**
 * EMS Ziekenhuiskosten Calculator v2
 * ----------------------------------
 * Werkt volledig client-side.
 * Geen database, geen backend.
 * De dropdown bepaalt welke prijsitems zichtbaar zijn.
 */

let pricingData = null;

document.addEventListener("DOMContentLoaded", async () => {
  setTodayAsDefaultDate();
  bindStaticEvents();
  await loadPricing();
});

function setTodayAsDefaultDate() {
  const dateInput = document.getElementById("visitDate");
  if (!dateInput) return;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

function bindStaticEvents() {
  document.getElementById("visitType").addEventListener("change", handleVisitTypeChange);

  document.getElementById("copySummaryBtn").addEventListener("click", () => {
    copyTextareaValue("summaryOutput");
  });

  document.getElementById("copyCompactBtn").addEventListener("click", () => {
    copyTextareaValue("compactOutput");
  });

  document.getElementById("resetBtn").addEventListener("click", resetForm);

  [
    "manualAdjustment",
    "adjustmentType",
    "currencySymbol",
    "patientName",
    "staffName",
    "visitDate",
    "notes"
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateAll);
    document.getElementById(id).addEventListener("change", updateAll);
  });
}

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

    handleVisitTypeChange();
  } catch (error) {
    console.error(error);
    document.getElementById("summaryOutput").value =
      "Fout bij laden van pricing.json. Controleer of het bestand in dezelfde map staat.";
    document.getElementById("compactOutput").value =
      "De calculator kon niet initialiseren door een laadfout.";
  }
}

function renderOptions(containerId, items, inputType, groupName) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "option-card";
    wrapper.dataset.types = (item.types || []).join(",");

    wrapper.innerHTML = `
      <label>
        <input
          type="${inputType}"
          name="${groupName}"
          value="${item.id}"
          data-price="${item.price}"
          data-label="${escapeHtml(item.label)}"
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

function handleVisitTypeChange() {
  const visitType = document.getElementById("visitType").value;

  ["baseCosts", "exams", "treatments", "extras"].forEach((containerId) => {
    filterOptionsByVisitType(containerId, visitType);
  });

  autoSelectDefaultBaseCost(visitType);
  updateAll();
}

function filterOptionsByVisitType(containerId, visitType) {
  const container = document.getElementById(containerId);
  const cards = container.querySelectorAll(".option-card");

  cards.forEach((card) => {
    const types = (card.dataset.types || "").split(",").filter(Boolean);
    const input = card.querySelector("input");

    const isVisible = types.includes(visitType);

    card.classList.toggle("hidden", !isVisible);

    if (!isVisible && input) {
      input.checked = false;
    }
  });
}

function autoSelectDefaultBaseCost(visitType) {
  const baseInputs = document.querySelectorAll('#baseCosts input[type="radio"]');
  let matched = false;

  baseInputs.forEach((input) => {
    const card = input.closest(".option-card");
    if (!card || card.classList.contains("hidden")) return;

    if (!matched) {
      input.checked = true;
      matched = true;
    } else {
      input.checked = false;
    }
  });
}

function getSelectedItems(containerId) {
  const container = document.getElementById(containerId);
  const selected = [];

  container.querySelectorAll("input:checked").forEach((input) => {
    const card = input.closest(".option-card");
    if (card && !card.classList.contains("hidden")) {
      selected.push({
        id: input.value,
        label: input.dataset.label,
        price: Number(input.dataset.price || 0)
      });
    }
  });

  return selected;
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

function getAdjustmentValue() {
  const rawValue = Number(document.getElementById("manualAdjustment").value || 0);
  const type = document.getElementById("adjustmentType").value;
  return type === "subtract" ? -Math.abs(rawValue) : Math.abs(rawValue);
}

function updateAll() {
  const visitTypeLabel = document.getElementById("visitType").selectedOptions[0].textContent;

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
    visitTypeLabel,
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

function generateSummaryOutput(data) {
  const patientName = document.getElementById("patientName").value.trim();
  const staffName = document.getElementById("staffName").value.trim();
  const visitDate = document.getElementById("visitDate").value;
  const notes = document.getElementById("notes").value.trim();

  const summaryLines = [];
  summaryLines.push("KOSTENOVERZICHT ZIEKENHUISBEZOEK");
  summaryLines.push("");
  summaryLines.push(`Type bezoek: ${data.visitTypeLabel}`);

  if (patientName) summaryLines.push(`Patiënt / ID: ${patientName}`);
  if (staffName) summaryLines.push(`EMS-medewerker / arts: ${staffName}`);
  if (visitDate) summaryLines.push(`Datum: ${visitDate}`);
  if (notes) summaryLines.push(`Notitie: ${notes}`);
  summaryLines.push("");

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
  summaryLines.push(`TOTAAL: ${formatMoney(data.grandTotal)}`);

  const allSelectedLabels = [
    ...data.baseItems.map((item) => item.label),
    ...data.examItems.map((item) => item.label),
    ...data.treatmentItems.map((item) => item.label),
    ...data.extraItems.map((item) => item.label)
  ];

  let compact = `Kosten berekend voor ${data.visitTypeLabel}`;
  if (allSelectedLabels.length) {
    compact += ` op basis van ${allSelectedLabels.join(", ")}`;
  }
  if (data.adjustment !== 0) {
    compact += `, met correctie van ${formatMoney(data.adjustment)}`;
  }
  compact += `. Totaalbedrag: ${formatMoney(data.grandTotal)}.`;
  if (notes) {
    compact += ` Notitie: ${notes}.`;
  }

  document.getElementById("summaryOutput").value = summaryLines.join("\n");
  document.getElementById("compactOutput").value = compact;
}

function formatItemLines(items) {
  if (!items.length) return ["- Geen"];
  return items.map((item) => `- ${item.label}: ${formatMoney(item.price)}`);
}

function formatMoney(value) {
  const currencySymbol = document.getElementById("currencySymbol")?.value?.trim() || "$";
  const sign = value < 0 ? "-" : "";
  return `${sign}${currencySymbol}${Math.abs(value)}`;
}

async function copyTextareaValue(textareaId) {
  const textarea = document.getElementById(textareaId);
  if (!textarea || !textarea.value) return;

  try {
    await navigator.clipboard.writeText(textarea.value);
    alert("Tekst gekopieerd naar klembord.");
  } catch (error) {
    console.error(error);
    alert("Kopiëren mislukt.");
  }
}

function resetForm() {
  document.getElementById("visitType").value = "standard";
  document.getElementById("patientName").value = "";
  document.getElementById("staffName").value = "";
  document.getElementById("notes").value = "";
  document.getElementById("manualAdjustment").value = "0";
  document.getElementById("adjustmentType").value = "add";
  document.getElementById("currencySymbol").value = "$";

  setTodayAsDefaultDate();

  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((input) => {
    input.checked = false;
  });

  handleVisitTypeChange();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
