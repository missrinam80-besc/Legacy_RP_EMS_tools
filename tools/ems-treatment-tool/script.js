/**
 * EMS Behandelingstool v2
 * -----------------------
 * Deze versie gebruikt config.json als bron voor:
 * - lichaamsdelen
 * - wondtypes
 * - bandages
 * - medicaties
 * - drempels
 *
 * De tool combineert:
 * - vitale functies
 * - pijnlevel
 * - bloedverlies
 * - meerdere letsels per lichaamsdeel
 * - fracturen
 *
 * Output:
 * - urgentie
 * - behandeling per lichaamsdeel
 * - algemene behandeling
 * - waarschuwingen
 * - materiaallijst
 * - kopieerbare samenvatting
 */

let CONFIG = {};
let summaryOutput = "";
let allExpanded = false;

document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  bindGlobalEvents();
});

async function loadConfig() {
  try {
    const response = await fetch("config.json");
    CONFIG = await response.json();

    document.getElementById("appTitle").textContent = CONFIG.appTitle || "EMS Behandelingstool";
    document.getElementById("appSubtitle").textContent =
      CONFIG.appSubtitle || "Slimme beslissingshulp voor medische interventies.";

    populateGeneralSelects();
    renderBodyParts();
  } catch (error) {
    console.error("Config laden mislukt:", error);
    alert("config.json kon niet geladen worden. Controleer of je via een webserver of GitHub Pages werkt.");
  }
}

function bindGlobalEvents() {
  document.getElementById("analyzeBtn").addEventListener("click", analyzePatient);
  document.getElementById("resetBtn").addEventListener("click", resetForm);
  document.getElementById("copyBtn").addEventListener("click", copySummary);
  document.getElementById("downloadBtn").addEventListener("click", downloadSummary);
  document.getElementById("expandAllBtn").addEventListener("click", toggleAllLimbs);
}

function populateGeneralSelects() {
  const painSelect = document.getElementById("painLevel");
  const bloodLossSelect = document.getElementById("bloodLoss");

  painSelect.innerHTML = "";
  bloodLossSelect.innerHTML = "";

  CONFIG.painLevels.forEach((item) => {
    painSelect.appendChild(new Option(item.label, item.value));
  });

  CONFIG.bloodLossLevels.forEach((item) => {
    bloodLossSelect.appendChild(new Option(item.label, item.value));
  });
}

function renderBodyParts() {
  const container = document.getElementById("bodyPartsContainer");
  container.innerHTML = "";

  CONFIG.bodyParts.forEach((part) => {
    const card = document.createElement("div");
    card.className = "limb-card";
    card.dataset.partKey = part.key;

    card.innerHTML = `
      <div class="limb-header" data-toggle="${part.key}">
        <div class="limb-title-wrap">
          <div class="limb-title">${escapeHtml(part.label)}</div>
          <div class="limb-subtitle">Voeg één of meerdere letsels toe en noteer eventuele opmerkingen.</div>
        </div>
        <div class="toggle-icon">▾</div>
      </div>
      <div class="limb-body" id="body-${part.key}">
        <div class="field">
          <label>Verwondingen</label>
          <div id="woundList-${part.key}" class="wound-list"></div>
          <div class="inline-actions">
            <button type="button" class="secondary-btn small-btn" data-add-wound="${part.key}">
              + Verwonding toevoegen
            </button>
          </div>
        </div>

        <div class="checkbox-row">
          <input type="checkbox" id="fracture-${part.key}" />
          <label for="fracture-${part.key}">Fractuur vermoed / aanwezig</label>
        </div>

        <div class="field">
          <label for="notes-${part.key}">Opmerking</label>
          <textarea id="notes-${part.key}" placeholder="Extra observatie of context..."></textarea>
        </div>
      </div>
    `;

    container.appendChild(card);

    const header = card.querySelector(".limb-header");
    header.addEventListener("click", () => {
      card.classList.toggle("open");
    });

    const addBtn = card.querySelector(`[data-add-wound="${part.key}"]`);
    addBtn.addEventListener("click", () => addWoundRow(part.key));

    addWoundRow(part.key);
  });
}

function addWoundRow(partKey, selectedValue = "") {
  const list = document.getElementById(`woundList-${partKey}`);
  if (!list) return;

  const row = document.createElement("div");
  row.className = "wound-row";

  const select = document.createElement("select");
  select.innerHTML = `<option value="">Geen letsel geselecteerd</option>`;

  CONFIG.woundOptions.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === selectedValue) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "icon-btn";
  removeBtn.textContent = "×";
  removeBtn.title = "Verwijder deze verwonding";

  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(select);
  row.appendChild(removeBtn);
  list.appendChild(row);
}

function toggleAllLimbs() {
  allExpanded = !allExpanded;
  document.querySelectorAll(".limb-card").forEach((card) => {
    if (allExpanded) {
      card.classList.add("open");
    } else {
      card.classList.remove("open");
    }
  });
}

function resetForm() {
  document.getElementById("heartRate").value = "";
  document.getElementById("bloodPressure").value = "";
  document.getElementById("temperature").value = "";
  document.getElementById("painLevel").selectedIndex = 0;
  document.getElementById("bloodLoss").selectedIndex = 0;

  CONFIG.bodyParts.forEach((part) => {
    document.getElementById(`fracture-${part.key}`).checked = false;
    document.getElementById(`notes-${part.key}`).value = "";
    const woundList = document.getElementById(`woundList-${part.key}`);
    woundList.innerHTML = "";
    addWoundRow(part.key);
  });

  setUrgency("green", "Nog geen analyse", "Formulier gewist.");
  setEmptyOutput("perLimbOutput");
  setEmptyOutput("generalOutput");
  setEmptyOutput("warningsOutput");
  setEmptyOutput("materialsOutput");
  document.getElementById("summaryText").value = "";
  summaryOutput = "";
}

function setEmptyOutput(id) {
  const el = document.getElementById(id);
  el.className = "result-content empty-state";
  el.innerHTML = "Nog geen analyse beschikbaar.";
}

function analyzePatient() {
  const patientData = collectPatientData();
  const analysis = buildAnalysis(patientData);
  renderAnalysis(analysis);
}

function collectPatientData() {
  const heartRate = parseInt(document.getElementById("heartRate").value, 10);
  const bloodPressure = document.getElementById("bloodPressure").value.trim();
  const temperature = parseFloat(document.getElementById("temperature").value);
  const painLevel = document.getElementById("painLevel").value;
  const bloodLoss = document.getElementById("bloodLoss").value;

  const bodyParts = CONFIG.bodyParts.map((part) => {
    const woundValues = Array.from(
      document.querySelectorAll(`#woundList-${part.key} select`)
    )
      .map((select) => select.value)
      .filter(Boolean);

    return {
      key: part.key,
      label: part.label,
      wounds: woundValues,
      fracture: document.getElementById(`fracture-${part.key}`).checked,
      notes: document.getElementById(`notes-${part.key}`).value.trim()
    };
  });

  return {
    vitals: {
      heartRate: Number.isFinite(heartRate) ? heartRate : null,
      bloodPressure,
      temperature: Number.isFinite(temperature) ? temperature : null
    },
    painLevel,
    bloodLoss,
    bodyParts
  };
}

function buildAnalysis(data) {
  const perLimb = [];
  const generalTreatment = [];
  const warnings = [];
  const materials = new Set();

  let severityScore = 0;
  let severeBleedCount = 0;
  let stitchCount = 0;
  let fractureCount = 0;
  let gunshotLikeCount = 0;
  let burnCount = 0;

  const painMeta = getLevelMeta(CONFIG.painLevels, data.painLevel);
  const bloodLossMeta = getLevelMeta(CONFIG.bloodLossLevels, data.bloodLoss);

  severityScore += (painMeta?.score || 0) * 1.5;
  severityScore += (bloodLossMeta?.score || 0) * 2;

  const bp = parseBloodPressure(data.vitals.bloodPressure);

  if (data.vitals.heartRate !== null) {
    if (data.vitals.heartRate >= CONFIG.thresholds.heartRateCritical) {
      severityScore += 4;
      warnings.push(`Kritiek verhoogde hartslag (${data.vitals.heartRate}).`);
    } else if (data.vitals.heartRate >= CONFIG.thresholds.heartRateHigh) {
      severityScore += 2;
      warnings.push(`Verhoogde hartslag (${data.vitals.heartRate}).`);
    }
  }

  if (bp && bp.systolic <= CONFIG.thresholds.bloodPressureCriticalSystolic) {
    severityScore += 4;
    warnings.push(`Kritiek lage systolische bloeddruk (${bp.systolic}).`);
  } else if (bp && bp.systolic <= CONFIG.thresholds.bloodPressureLowSystolic) {
    severityScore += 2;
    warnings.push(`Lage systolische bloeddruk (${bp.systolic}).`);
  }

  if (data.vitals.temperature !== null) {
    if (data.vitals.temperature < CONFIG.thresholds.temperatureLow) {
      severityScore += 2;
      warnings.push(`Onderkoeling mogelijk (${data.vitals.temperature}°C).`);
    } else if (data.vitals.temperature > CONFIG.thresholds.temperatureHigh) {
      severityScore += 2;
      warnings.push(`Koorts / oververhitting mogelijk (${data.vitals.temperature}°C).`);
    }
  }

  data.bodyParts.forEach((part) => {
    if (!part.wounds.length && !part.fracture && !part.notes) return;

    const partAdvice = [];
    const partWarnings = [];
    let localScore = 0;

    part.wounds.forEach((woundKey) => {
      const wound = CONFIG.wounds[woundKey];
      const woundLabel = getWoundLabel(woundKey);

      if (!wound) return;

      localScore += wound.pain + wound.bleeding * 8;

      if (wound.bleeding >= 0.5) {
        severeBleedCount += 1;
        severityScore += 2;
        const bestBandage = getBestBandage(woundKey);
        partAdvice.push(`Stelp ernstige bloeding van ${woundLabel} met ${bestBandage.label}.`);
        partAdvice.push("Overweeg een tourniquet als de bloeding niet onder controle raakt.");
        materials.add(CONFIG.medications.tourniquet.label);
        materials.add(bestBandage.label);
      } else if (wound.bleeding > 0) {
        const bestBandage = getBestBandage(woundKey);
        partAdvice.push(`Breng ${bestBandage.label} aan voor ${woundLabel}.`);
        materials.add(bestBandage.label);
      } else {
        if (woundKey === "burn") {
          const bestBandage = getBestBandage(woundKey);
          partAdvice.push(`Koel en dek de brandwonde af met ${bestBandage.label}.`);
          materials.add(bestBandage.label);
        } else if (woundKey === "contusion") {
          partAdvice.push(`Observeer en ondersteun conservatief bij ${woundLabel}.`);
        } else if (woundKey === "abrasion") {
          const bestBandage = getBestBandage(woundKey);
          partAdvice.push(`Reinig en dek de ${woundLabel} af met ${bestBandage.label}.`);
          materials.add(bestBandage.label);
        }
      }

      if (wound.needSewing) {
        stitchCount += 1;
        partAdvice.push(`Hechten aanbevolen voor ${woundLabel}.`);
        materials.add(CONFIG.medications.sewing_kit.label);
      }

      if (
        ["lowvelocitywound", "mediumvelocitywound", "highvelocitywound", "velocitywound"].includes(woundKey)
      ) {
        gunshotLikeCount += 1;
        partWarnings.push(`Controleer ${woundLabel} op dieper of intern letsel.`);
      }

      if (woundKey === "burn") {
        burnCount += 1;
        partWarnings.push("Controleer temperatuur, pijn en verdere huidschade.");
      }

      if (woundKey === "crush") {
        partWarnings.push("Let op bijkomende verpletteringsschade en functieverlies.");
      }

      if (woundKey === "puncturewound") {
        partWarnings.push("Controleer op penetrerend letsel en diepte van de wonde.");
      }
    });

    if (part.fracture) {
      fractureCount += 1;
      localScore += 4;
      severityScore += 2;
      partAdvice.push("Immobiliseer dit lichaamsdeel en beperk verdere beweging.");
      partAdvice.push("Voorzie stabilisatie, spalk of verdere orthopedische opvolging.");
      materials.add("Immobilisatie / spalk");
      const fractureWarning = CONFIG.fractures[part.key]?.warning;
      if (fractureWarning) {
        partWarnings.push(fractureWarning);
      }
    }

    if (part.notes) {
      partWarnings.push(`Opmerking: ${part.notes}`);
    }

    if (!partAdvice.length) {
      partAdvice.push("Geen specifieke interventie afgeleid buiten observatie.");
    }

    perLimb.push({
      label: part.label,
      advice: dedupeArray(partAdvice),
      warnings: dedupeArray(partWarnings),
      localScore
    });

    severityScore += localScore / 2;
  });

  if (data.painLevel === "hoog" || data.painLevel === "extreem") {
    generalTreatment.push("Overweeg morphine voor sterke pijnstilling.");
    materials.add(CONFIG.medications.morphine.label);
    if (data.painLevel === "extreem") {
      severityScore += 2;
      warnings.push("Extreme pijnscore gemeld.");
    }
  } else if (data.painLevel === "gemiddeld") {
    generalTreatment.push("Voorzie pijnopvolging en evalueer nood aan verdere analgesie.");
  }

  if (data.bloodLoss === "gemiddeld") {
    generalTreatment.push("Overweeg saline 250 ml of 500 ml en monitor circulatie.");
    materials.add(CONFIG.medications.saline250ml.label);
  } else if (data.bloodLoss === "hoog") {
    generalTreatment.push("Voorzie bloed of saline-ondersteuning en volg bloeddruk nauw op.");
    materials.add(CONFIG.medications.blood250ml.label);
    materials.add(CONFIG.medications.saline500ml.label);
  } else if (data.bloodLoss === "extreem") {
    generalTreatment.push("Bloedtransfusie sterk aanbevolen bij extreem bloedverlies.");
    materials.add(CONFIG.medications.blood500ml.label);
    warnings.push("Extreem bloedverlies gemeld.");
    severityScore += 3;
  }

  if (
    (bp && bp.systolic <= CONFIG.thresholds.bloodPressureLowSystolic) ||
    (data.vitals.heartRate !== null && data.vitals.heartRate >= CONFIG.thresholds.heartRateHigh)
  ) {
    generalTreatment.push("Continue monitoring van vitale functies aanbevolen.");
  }

  if (
    severeBleedCount >= 2 ||
    gunshotLikeCount >= 2 ||
    fractureCount >= 2 ||
    data.bloodLoss === "extreem"
  ) {
    generalTreatment.push("Voorbereiding voor urgente opname, chirurgie of intensieve observatie aanbevolen.");
    severityScore += 2;
  }

  if (
    (data.painLevel === "extreem" && stitchCount >= 2) ||
    (gunshotLikeCount >= 1 && severeBleedCount >= 1)
  ) {
    generalTreatment.push("Propofol alleen overwegen in gecontroleerde procedure- of OK-setting.");
    materials.add(CONFIG.medications.propofol.label);
  }

  if (
    data.bloodLoss === "hoog" ||
    data.bloodLoss === "extreem" ||
    (bp && bp.systolic <= CONFIG.thresholds.bloodPressureCriticalSystolic)
  ) {
    generalTreatment.push("Evalueer nood aan epinephrine enkel bij ernstige instabiliteit en passend klinisch beeld.");
    materials.add(CONFIG.medications.epinephrine.label);
  }

  if (!generalTreatment.length) {
    generalTreatment.push("Algemene observatie en wondopvolging volstaan voorlopig.");
  }

  if (fractureCount > 0) {
    warnings.push(`Fracturen vermoed/aanwezig: ${fractureCount}.`);
  }

  if (stitchCount > 0) {
    warnings.push(`Hechten aanbevolen bij ${stitchCount} letsel(s).`);
  }

  if (gunshotLikeCount > 0) {
    warnings.push("Projectielletsels aanwezig: controleer op interne schade.");
  }

  if (burnCount > 0) {
    warnings.push("Brandwonde aanwezig: bewaak temperatuur en bijkomende huidschade.");
  }

  const urgency = determineUrgency(severityScore, warnings);

  return {
    urgency,
    perLimb,
    generalTreatment: dedupeArray(generalTreatment),
    warnings: dedupeArray(warnings),
    materials: Array.from(materials).sort((a, b) => a.localeCompare(b, "nl")),
    patientData: data
  };
}

function determineUrgency(score, warnings) {
  let level = "green";
  let label = "Stabiel / opvolgen";
  let reason = `Beperkte ernstscore (${score.toFixed(1)}).`;

  if (score >= 18) {
    level = "red";
    label = "Kritiek";
    reason = `Hoge ernstscore (${score.toFixed(1)}). Onmiddellijke interventie aanbevolen.`;
  } else if (score >= 10) {
    level = "orange";
    label = "Dringend";
    reason = `Verhoogde ernstscore (${score.toFixed(1)}). Snelle behandeling nodig.`;
  } else if (score >= 5) {
    level = "blue";
    label = "Opvolgen / matig urgent";
    reason = `Matige ernstscore (${score.toFixed(1)}). Observatie en behandeling aangewezen.`;
  }

  if (warnings.some((w) => /kritiek|extreem/i.test(w))) {
    level = "red";
    label = "Kritiek";
    reason = "Kritieke parameters of waarschuwingen gedetecteerd.";
  }

  return { level, label, reason, score };
}

function renderAnalysis(analysis) {
  setUrgency(analysis.urgency.level, analysis.urgency.label, analysis.urgency.reason);

  renderPerLimb(analysis.perLimb);
  renderSimpleListBlock("generalOutput", analysis.generalTreatment, "Geen algemene behandeling nodig.");
  renderSimpleListBlock("warningsOutput", analysis.warnings, "Geen extra waarschuwingen.");
  renderSimpleListBlock("materialsOutput", analysis.materials, "Geen specifiek materiaal voorgesteld.");

  summaryOutput = buildSummaryText(analysis);
  document.getElementById("summaryText").value = summaryOutput;
}

function setUrgency(level, label, reason) {
  const badge = document.getElementById("urgencyBadge");
  const reasonEl = document.getElementById("urgencyReason");

  badge.className = "urgency-badge";

  if (level === "red") {
    badge.classList.add("urgency-red");
  } else if (level === "orange") {
    badge.classList.add("urgency-orange");
  } else if (level === "blue") {
    badge.classList.add("urgency-blue");
  } else {
    badge.classList.add("urgency-green");
  }

  badge.textContent = label;
  reasonEl.textContent = reason;
}

function renderPerLimb(items) {
  const container = document.getElementById("perLimbOutput");
  container.className = "result-content";

  if (!items.length) {
    container.classList.add("empty-state");
    container.innerHTML = "Geen lokale letsels ingevoerd.";
    return;
  }

  container.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const adviceList = item.advice.length
      ? `<ul class="result-list">${item.advice.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
      : "<p>Geen specifiek advies.</p>";

    const warningBlock = item.warnings.length
      ? `<p><strong>Let op:</strong> ${escapeHtml(item.warnings.join(" | "))}</p>`
      : "";

    card.innerHTML = `
      <h4>${escapeHtml(item.label)}</h4>
      ${adviceList}
      ${warningBlock}
    `;

    container.appendChild(card);
  });
}

function renderSimpleListBlock(targetId, items, emptyMessage) {
  const container = document.getElementById(targetId);
  container.className = "result-content";

  if (!items.length) {
    container.classList.add("empty-state");
    container.innerHTML = emptyMessage;
    return;
  }

  container.innerHTML = `
    <div class="result-card">
      <ul class="result-list">
        ${items.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function buildSummaryText(analysis) {
  const lines = [];

  lines.push("EMS BEHANDELINGSANALYSE");
  lines.push("=======================");
  lines.push("");

  lines.push(`Urgentie: ${analysis.urgency.label}`);
  lines.push(`Reden: ${analysis.urgency.reason}`);
  lines.push("");

  lines.push("ALGEMENE PATIËNTSTATUS");
  lines.push("----------------------");
  lines.push(`Hartslag/pols: ${valueOrDash(analysis.patientData.vitals.heartRate)}`);
  lines.push(`Bloeddruk: ${valueOrDash(analysis.patientData.vitals.bloodPressure)}`);
  lines.push(`Lichaamstemperatuur: ${valueOrDash(analysis.patientData.vitals.temperature)}`);
  lines.push(`Pijnlevel: ${valueOrDash(analysis.patientData.painLevel)}`);
  lines.push(`Bloedverlies: ${valueOrDash(analysis.patientData.bloodLoss)}`);
  lines.push("");

  lines.push("BEHANDELING PER LICHAAMSDEEL");
  lines.push("----------------------------");

  if (!analysis.perLimb.length) {
    lines.push("Geen lokale letsels ingevoerd.");
  } else {
    analysis.perLimb.forEach((item) => {
      lines.push(item.label.toUpperCase());
      item.advice.forEach((line) => lines.push(`- ${line}`));
      if (item.warnings.length) {
        lines.push(`- Let op: ${item.warnings.join(" | ")}`);
      }
      lines.push("");
    });
  }

  lines.push("ALGEMENE BEHANDELING");
  lines.push("--------------------");
  analysis.generalTreatment.forEach((line) => lines.push(`- ${line}`));
  lines.push("");

  lines.push("WAARSCHUWINGEN");
  lines.push("--------------");
  if (analysis.warnings.length) {
    analysis.warnings.forEach((line) => lines.push(`- ${line}`));
  } else {
    lines.push("- Geen extra waarschuwingen.");
  }
  lines.push("");

  lines.push("BENODIGD MATERIAAL & MEDICATIE");
  lines.push("------------------------------");
  if (analysis.materials.length) {
    analysis.materials.forEach((line) => lines.push(`- ${line}`));
  } else {
    lines.push("- Geen specifiek materiaal voorgesteld.");
  }

  return lines.join("\n");
}

function copySummary() {
  if (!summaryOutput.trim()) {
    alert("Er is nog geen samenvatting om te kopiëren.");
    return;
  }

  navigator.clipboard.writeText(summaryOutput)
    .then(() => alert("Samenvatting gekopieerd."))
    .catch(() => alert("Kopiëren mislukt."));
}

function downloadSummary() {
  if (!summaryOutput.trim()) {
    alert("Er is nog geen samenvatting om te downloaden.");
    return;
  }

  const blob = new Blob([summaryOutput], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ems-behandelanalyse.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseBloodPressure(value) {
  if (!value || typeof value !== "string") return null;

  const match = value.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return null;

  return {
    systolic: parseInt(match[1], 10),
    diastolic: parseInt(match[2], 10)
  };
}

function getLevelMeta(collection, value) {
  return collection.find((item) => item.value === value) || null;
}

function getWoundLabel(woundKey) {
  return CONFIG.woundOptions.find((w) => w.value === woundKey)?.label || woundKey;
}

function getBestBandage(woundKey) {
  let best = null;
  let bestScore = -1;

  CONFIG.bandages.forEach((bandage) => {
    const score = bandage.effectivenessModifiers[woundKey] ?? -1;
    if (score > bestScore) {
      bestScore = score;
      best = bandage;
    }
  });

  return best || {
    itemName: "field_dressing",
    label: "Field dressing",
    effectivenessModifiers: {}
  };
}

function dedupeArray(items) {
  return [...new Set(items.filter(Boolean))];
}

function valueOrDash(value) {
  return value === null || value === undefined || value === "" ? "-" : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
