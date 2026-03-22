/**
 * EMS Behandelingsadviseur - logica
 * --------------------------------
 * Deze tool werkt volledig client-side en zonder database.
 * De beslissingen zijn afgeleid uit de aangeleverde EMS letsel- en medicatieconfiguraties.
 */

const bodypartContainer = document.getElementById('bodypart-container');
const treatmentForm = document.getElementById('treatment-form');
const clearInjuriesButton = document.getElementById('clear-injuries');
const resetFormButton = document.getElementById('reset-form');
const copySummaryButton = document.getElementById('copy-summary');
const downloadSummaryButton = document.getElementById('download-summary');

const urgencyBadge = document.getElementById('urgency-badge');
const urgencyText = document.getElementById('urgency-text');
const bodypartResults = document.getElementById('bodypart-results');
const generalTreatmentList = document.getElementById('general-treatment');
const materialsList = document.getElementById('materials-list');
const warningsList = document.getElementById('warnings-list');
const summaryOutput = document.getElementById('summary-output');

/** Bouwt de lichaamsdeelkaarten dynamisch op. */
function renderBodyPartCards() {
  const woundOptions = Object.entries(EMS_DATA.wounds)
    .filter(([id]) => id !== 'none')
    .map(([id, wound]) => `<option value="${id}">${wound.label}</option>`)
    .join('');

  bodypartContainer.innerHTML = EMS_DATA.bodyParts.map((part) => `
    <article class="bodypart-card">
      <h4>${part.label}</h4>
      <div class="injury-grid">
        <label class="field">
          <span>Verwonding 1</span>
          <select data-bodypart="${part.id}" data-type="wound">
            <option value="none">Geen letsel</option>
            ${woundOptions}
          </select>
        </label>

        <label class="field">
          <span>Verwonding 2</span>
          <select data-bodypart="${part.id}" data-type="wound">
            <option value="none">Geen letsel</option>
            ${woundOptions}
          </select>
        </label>

        <label class="field">
          <span>Verwonding 3</span>
          <select data-bodypart="${part.id}" data-type="wound">
            <option value="none">Geen letsel</option>
            ${woundOptions}
          </select>
        </label>
      </div>

      <div class="checkbox-wrap">
        <input type="checkbox" id="fracture-${part.id}" data-bodypart="${part.id}" data-type="fracture" />
        <label for="fracture-${part.id}" class="checkbox-label">Fractuur aanwezig</label>
      </div>

      <label class="field" style="margin-top: 14px;">
        <span>Extra opmerking</span>
        <textarea rows="2" data-bodypart="${part.id}" data-type="notes" placeholder="Optionele extra info..."></textarea>
      </label>
    </article>
  `).join('');
}

/** Leest alle invoerwaarden uit het formulier. */
function getFormData() {
  const bodyParts = {};

  EMS_DATA.bodyParts.forEach((part) => {
    const woundSelects = [...document.querySelectorAll(`select[data-bodypart="${part.id}"][data-type="wound"]`)];
    const wounds = woundSelects.map((select) => select.value).filter((value) => value !== 'none');
    const fracture = document.querySelector(`#fracture-${part.id}`).checked;
    const notes = document.querySelector(`textarea[data-bodypart="${part.id}"][data-type="notes"]`).value.trim();

    bodyParts[part.id] = { wounds, fracture, notes };
  });

  return {
    general: {
      heartRate: Number(document.getElementById('heartRate').value || 0),
      bloodPressure: document.getElementById('bloodPressure').value.trim(),
      temperature: Number(document.getElementById('temperature').value || 0),
      painLevel: document.getElementById('painLevel').value,
      bloodLoss: document.getElementById('bloodLoss').value
    },
    bodyParts
  };
}

/** Probeert systolische en diastolische bloeddruk uit een string te halen. */
function parseBloodPressure(value) {
  const match = /^(\d{2,3})\s*\/\s*(\d{2,3})$/.exec(value);
  if (!match) return { systolic: 0, diastolic: 0, valid: false };
  return {
    systolic: Number(match[1]),
    diastolic: Number(match[2]),
    valid: true
  };
}

/** Zoekt het meest geschikte verband voor een bepaald wondtype. */
function getBestBandage(woundType) {
  let bestBandage = null;
  let bestScore = -1;

  Object.entries(EMS_DATA.bandages).forEach(([id, bandage]) => {
    const score = bandage.effectivenessModifiers[woundType] ?? -1;
    if (score > bestScore) {
      bestBandage = { id, label: bandage.label, score };
      bestScore = score;
    }
  });

  return bestBandage;
}

/** Analyseert één lichaamsdeel en geeft lokale behandelingsstappen terug. */
function analyzeBodyPart(partId, partData) {
  const partLabel = EMS_DATA.bodyParts.find((part) => part.id === partId)?.label || partId;
  const advice = [];
  const warnings = [];
  const materials = new Set();
  const woundLabels = [];
  let severityScore = 0;
  let localBleedingScore = 0;

  partData.wounds.forEach((woundId) => {
    const wound = EMS_DATA.wounds[woundId];
    if (!wound) return;

    woundLabels.push(wound.label);
    severityScore += wound.pain + (wound.bleeding * 10);
    localBleedingScore += wound.bleeding;

    if (wound.bleeding >= 0.3) {
      advice.push(`Stelp de bloeding van ${wound.label.toLowerCase()} zo snel mogelijk.`);
      const bestBandage = getBestBandage(woundId);
      if (bestBandage) {
        advice.push(`Gebruik bij voorkeur ${bestBandage.label}.`);
        materials.add(bestBandage.label);
      }
      if (['leftArm', 'rightArm', 'leftLeg', 'rightLeg'].includes(partId)) {
        advice.push('Overweeg een tourniquet als de bloeding niet onder controle geraakt.');
        materials.add(EMS_DATA.tools.tourniquet);
      }
    } else if (wound.bleeding > 0) {
      const bestBandage = getBestBandage(woundId);
      if (bestBandage) {
        advice.push(`Dek de wond af met ${bestBandage.label}.`);
        materials.add(bestBandage.label);
      }
    } else {
      const bestBandage = getBestBandage(woundId);
      if (bestBandage && woundId !== 'contusion') {
        advice.push(`Bescherm en dek de wond af met ${bestBandage.label}.`);
        materials.add(bestBandage.label);
      }
    }

    if (wound.needSewing) {
      advice.push(`Plan wondsluiting / hechten voor ${wound.label.toLowerCase()}.`);
      materials.add(EMS_DATA.tools.sewing_kit);
    }

    if (woundId === 'burn') {
      advice.push('Koel de brandwonde, dek steriel af en volg de temperatuur op.');
    }

    if (['lowvelocitywound', 'mediumvelocitywound', 'highvelocitywound', 'velocitywound', 'puncturewound'].includes(woundId)) {
      warnings.push(`Controleer ${partLabel.toLowerCase()} op dieper of intern letsel.`);
    }

    wound.notes.forEach((note) => warnings.push(note));
  });

  if (partData.fracture) {
    severityScore += 4;
    advice.push(EMS_DATA.fractureCare[partId] || 'Immobiliseer het getroffen lichaamsdeel.');
    warnings.push(`Fractuur gemeld ter hoogte van ${partLabel.toLowerCase()}.`);
  }

  if (partData.notes) {
    warnings.push(`Opmerking medewerker: ${partData.notes}`);
  }

  if (partData.wounds.length === 0 && !partData.fracture) {
    return {
      partLabel,
      wounds: [],
      advice: ['Geen letsels geregistreerd voor dit lichaamsdeel.'],
      warnings: [],
      materials: [],
      severityScore: 0,
      localBleedingScore: 0,
      injured: false
    };
  }

  if (severityScore >= 7) {
    warnings.push(`${partLabel} bevat ernstig letsel en moet prioritair behandeld worden.`);
  }

  return {
    partLabel,
    wounds: woundLabels,
    advice: uniqueList(advice),
    warnings: uniqueList(warnings),
    materials: [...materials],
    severityScore,
    localBleedingScore,
    injured: true
  };
}

/** Analyseert de algemene toestand van de patiënt. */
function analyzeGeneralStatus(formData, bodyPartAnalyses) {
  const generalTreatment = [];
  const warnings = [];
  const materials = new Set();
  const { general } = formData;
  const bloodPressure = parseBloodPressure(general.bloodPressure);

  const totalLocalSeverity = bodyPartAnalyses.reduce((sum, part) => sum + part.severityScore, 0);
  const totalLocalBleeding = bodyPartAnalyses.reduce((sum, part) => sum + part.localBleedingScore, 0);
  const injuredPartsCount = bodyPartAnalyses.filter((part) => part.injured).length;

  if (general.painLevel === 'hoog' || general.painLevel === 'extreem' || totalLocalSeverity >= 10) {
    generalTreatment.push('Overweeg morphine voor sterke pijnstilling en monitor dosering zorgvuldig.');
    materials.add(EMS_DATA.tools.morphine);
  } else if (general.painLevel === 'gemiddeld') {
    generalTreatment.push('Voorzie pijncontrole en evalueer of zwaardere pijnstilling nodig is.');
  }

  if (general.bloodLoss === 'extreem' || general.bloodLoss === 'hoog' || totalLocalBleeding >= 0.6) {
    generalTreatment.push('Start bloedvolumeherstel met blood 500 ml indien beschikbaar.');
    materials.add(EMS_DATA.tools.blood500ml);
  } else if (general.bloodLoss === 'gemiddeld' || totalLocalBleeding >= 0.2) {
    generalTreatment.push('Overweeg blood 250 ml of saline 500 ml afhankelijk van de toestand.');
    materials.add(EMS_DATA.tools.blood250ml);
    materials.add(EMS_DATA.tools.saline500ml);
  } else if (general.bloodLoss === 'licht') {
    generalTreatment.push('Monitor bloedverlies en overweeg saline 250 ml als ondersteuning.');
    materials.add(EMS_DATA.tools.saline250ml);
  }

  if (general.heartRate >= 130) {
    warnings.push('Erg hoge hartslag / pols: patiënt kan instabiel zijn.');
    generalTreatment.push('Intensieve monitoring van circulatie en stressrespons aanbevolen.');
  } else if (general.heartRate > 0 && general.heartRate <= 45) {
    warnings.push('Lage hartslag / pols: opvolging noodzakelijk.');
  }

  if (bloodPressure.valid && bloodPressure.systolic < 90) {
    warnings.push('Lage systolische bloeddruk: denk aan shock of bloedverlies.');
    generalTreatment.push('Stabiliseer circulatie en overweeg epinephrine enkel indien klinisch passend.');
    materials.add(EMS_DATA.tools.epinephrine);
  }

  if (general.temperature >= 39) {
    warnings.push('Hoge lichaamstemperatuur gemeld.');
  } else if (general.temperature > 0 && general.temperature < 35) {
    warnings.push('Lage lichaamstemperatuur gemeld.');
  }

  if (injuredPartsCount >= 3) {
    warnings.push('Meerdere lichaamsdelen zijn getroffen.');
    generalTreatment.push('Overweeg opname, observatie en gefaseerde behandeling per prioriteit.');
  }

  if (general.painLevel === 'extreem' && (injuredPartsCount >= 2 || totalLocalSeverity >= 12)) {
    generalTreatment.push('Bij zware procedure of operatiecontext kan propofol overwogen worden in gecontroleerde setting.');
    materials.add(EMS_DATA.tools.propofol);
  }

  if (generalTreatment.length === 0) {
    generalTreatment.push('Blijf monitoren en voer lokale wondzorg uit volgens de letsels.');
  }

  const urgency = determineUrgency({
    painLevel: general.painLevel,
    bloodLoss: general.bloodLoss,
    totalLocalSeverity,
    injuredPartsCount,
    heartRate: general.heartRate,
    systolic: bloodPressure.systolic
  });

  return {
    generalTreatment: uniqueList(generalTreatment),
    warnings: uniqueList(warnings),
    materials: [...materials],
    urgency
  };
}

/** Bepaalt het urgentieniveau op basis van globale input en ernstscores. */
function determineUrgency({ painLevel, bloodLoss, totalLocalSeverity, injuredPartsCount, heartRate, systolic }) {
  if (
    bloodLoss === 'extreem' ||
    painLevel === 'extreem' ||
    totalLocalSeverity >= 14 ||
    injuredPartsCount >= 4 ||
    heartRate >= 140 ||
    (systolic > 0 && systolic < 85)
  ) {
    return { key: 'critical', label: 'Kritiek' };
  }

  if (
    bloodLoss === 'hoog' ||
    painLevel === 'hoog' ||
    totalLocalSeverity >= 9 ||
    injuredPartsCount >= 2 ||
    heartRate >= 120 ||
    (systolic > 0 && systolic < 95)
  ) {
    return { key: 'high', label: 'Dringend' };
  }

  if (bloodLoss === 'gemiddeld' || painLevel === 'gemiddeld' || totalLocalSeverity >= 4) {
    return { key: 'medium', label: 'Opvolgen' };
  }

  return { key: 'low', label: 'Stabiel' };
}

/** Zet resultaten op het scherm. */
function renderResults(formData, bodyPartAnalyses, generalAnalysis) {
  urgencyBadge.className = `urgency-badge urgency-${generalAnalysis.urgency.key}`;
  urgencyBadge.textContent = generalAnalysis.urgency.label;
  urgencyText.textContent = buildUrgencyText(generalAnalysis.urgency.key);

  const injuredParts = bodyPartAnalyses.filter((part) => part.injured);
  bodypartResults.classList.remove('empty-state');
  bodypartResults.innerHTML = injuredParts.length
    ? injuredParts.map((part) => `
        <article class="result-item">
          <h4>${part.partLabel}</h4>
          <p><strong>Letsels:</strong> ${part.wounds.join(', ') || 'n.v.t.'}</p>
          <ul>
            ${part.advice.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        </article>
      `).join('')
    : 'Geen letsels ingegeven.';

  renderList(generalTreatmentList, generalAnalysis.generalTreatment, false);

  const materialItems = uniqueList([
    ...generalAnalysis.materials,
    ...bodyPartAnalyses.flatMap((part) => part.materials)
  ]);
  renderList(materialsList, materialItems, true, 'Geen items.');

  const warningItems = uniqueList([
    ...generalAnalysis.warnings,
    ...bodyPartAnalyses.flatMap((part) => part.warnings)
  ]);
  renderList(warningsList, warningItems, false, 'Geen waarschuwingen.');

  summaryOutput.value = buildSummaryText(formData, injuredParts, generalAnalysis, materialItems, warningItems);
}

/** Bouwt een korte tekst bij het gekozen urgentieniveau. */
function buildUrgencyText(level) {
  const map = {
    low: 'Patiënt lijkt voorlopig stabiel. Lokale wondzorg en opvolging volstaan meestal.',
    medium: 'Opvolging en behandeling zijn nodig. De toestand is niet kritiek maar vraagt aandacht.',
    high: 'Dringende behandeling aanbevolen. Stabiliseer eerst bloeding, pijn en fracturen.',
    critical: 'Kritieke toestand. Prioriteit geven aan stabilisatie, bloedverlies, monitoring en verdere interventie.'
  };

  return map[level] || 'Geen urgentie-inschatting beschikbaar.';
}

/** Schrijft items naar een ul/div. */
function renderList(container, items, asTags = false, fallback = 'Nog geen data.') {
  container.classList.remove('empty-state');
  if (!items.length) {
    container.innerHTML = asTags ? `<li>${fallback}</li>` : `<li>${fallback}</li>`;
    return;
  }

  container.innerHTML = items.map((item) => `<li>${item}</li>`).join('');
}

/** Bouwt een kopieerbare samenvatting. */
function buildSummaryText(formData, injuredParts, generalAnalysis, materialItems, warningItems) {
  const bp = formData.general.bloodPressure || 'n.v.t.';
  const temp = formData.general.temperature || 'n.v.t.';
  const hr = formData.general.heartRate || 'n.v.t.';

  const localLines = injuredParts.length
    ? injuredParts.map((part) => {
        const adviceText = part.advice.map((item) => `- ${item}`).join('\n');
        return `${part.partLabel}: ${part.wounds.join(', ')}\n${adviceText}`;
      }).join('\n\n')
    : 'Geen letsels geregistreerd.';

  return [
    'EMS BEHANDELINGSADVIES',
    '=====================',
    `Urgentie: ${generalAnalysis.urgency.label}`,
    '',
    'Algemene toestand',
    `- Hartslag / pols: ${hr}`,
    `- Bloeddruk: ${bp}`,
    `- Lichaamstemperatuur: ${temp}`,
    `- Pijnlevel: ${formData.general.painLevel}`,
    `- Bloedverlies: ${formData.general.bloodLoss}`,
    '',
    'Behandeling per lichaamsdeel',
    localLines,
    '',
    'Algemene behandeling',
    ...generalAnalysis.generalTreatment.map((item) => `- ${item}`),
    '',
    'Benodigd materiaal / medicatie',
    ...materialItems.map((item) => `- ${item}`),
    '',
    'Waarschuwingen',
    ...(warningItems.length ? warningItems.map((item) => `- ${item}`) : ['- Geen waarschuwingen.'])
  ].join('\n');
}

/** Maakt dubbele items uniek en verwijdert lege waarden. */
function uniqueList(items) {
  return [...new Set(items.filter(Boolean))];
}

/** Leegt enkel de letselvelden. */
function clearInjuries() {
  document.querySelectorAll('select[data-type="wound"]').forEach((select) => {
    select.value = 'none';
  });

  document.querySelectorAll('input[data-type="fracture"]').forEach((checkbox) => {
    checkbox.checked = false;
  });

  document.querySelectorAll('textarea[data-type="notes"]').forEach((textarea) => {
    textarea.value = '';
  });
}

/** Zet alle resultaten terug op beginstatus. */
function resetResults() {
  urgencyBadge.className = 'urgency-badge urgency-neutral';
  urgencyBadge.textContent = 'Nog niet berekend';
  urgencyText.textContent = 'Vul het formulier in en klik op “Analyseer behandeling”.';
  bodypartResults.className = 'result-list empty-state';
  bodypartResults.textContent = 'Nog geen analyse beschikbaar.';
  generalTreatmentList.className = 'bullet-list empty-state';
  generalTreatmentList.innerHTML = '<li>Nog geen analyse beschikbaar.</li>';
  materialsList.className = 'tag-list empty-state';
  materialsList.innerHTML = '<li>Geen items.</li>';
  warningsList.className = 'bullet-list empty-state';
  warningsList.innerHTML = '<li>Geen waarschuwingen.</li>';
  summaryOutput.value = '';
}

/** Verwerkt het formulier en triggert de analyse. */
function handleSubmit(event) {
  event.preventDefault();
  const formData = getFormData();
  const bodyPartAnalyses = EMS_DATA.bodyParts.map((part) => analyzeBodyPart(part.id, formData.bodyParts[part.id]));
  const generalAnalysis = analyzeGeneralStatus(formData, bodyPartAnalyses);
  renderResults(formData, bodyPartAnalyses, generalAnalysis);
}

/** Kopieert de samenvatting naar het klembord. */
async function copySummary() {
  if (!summaryOutput.value.trim()) return;

  try {
    await navigator.clipboard.writeText(summaryOutput.value);
    copySummaryButton.textContent = 'Gekopieerd';
    setTimeout(() => {
      copySummaryButton.textContent = 'Kopieer';
    }, 1400);
  } catch (error) {
    alert('Kopiëren is mislukt.');
  }
}

/** Downloadt de samenvatting als TXT-bestand. */
function downloadSummary() {
  if (!summaryOutput.value.trim()) return;

  const blob = new Blob([summaryOutput.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ems-behandelingsadvies.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

renderBodyPartCards();
resetResults();

treatmentForm.addEventListener('submit', handleSubmit);
clearInjuriesButton.addEventListener('click', clearInjuries);
resetFormButton.addEventListener('click', () => {
  setTimeout(() => {
    clearInjuries();
    resetResults();
  }, 0);
});
copySummaryButton.addEventListener('click', copySummary);
downloadSummaryButton.addEventListener('click', downloadSummary);
