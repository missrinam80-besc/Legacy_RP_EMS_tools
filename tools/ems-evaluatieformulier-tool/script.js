const STORAGE_KEY = "ems_evaluatieformulier_concept";

const fields = {
  employeeName: document.getElementById("employeeName"),
  employeeCallsign: document.getElementById("employeeCallsign"),
  employeeRank: document.getElementById("employeeRank"),
  department: document.getElementById("department"),
  evaluationType: document.getElementById("evaluationType"),
  evaluationDate: document.getElementById("evaluationDate"),
  evaluatorName: document.getElementById("evaluatorName"),
  evaluatorRank: document.getElementById("evaluatorRank"),
  periodCovered: document.getElementById("periodCovered"),
  strengths: document.getElementById("strengths"),
  improvements: document.getElementById("improvements"),
  goals: document.getElementById("goals"),
  generalNotes: document.getElementById("generalNotes"),

  scoreProfessional: document.getElementById("scoreProfessional"),
  scoreCommunication: document.getElementById("scoreCommunication"),
  scoreTeamwork: document.getElementById("scoreTeamwork"),
  scoreKnowledge: document.getElementById("scoreKnowledge"),
  scoreProtocol: document.getElementById("scoreProtocol"),
  scoreInitiative: document.getElementById("scoreInitiative"),
};

const averageScoreEl = document.getElementById("averageScore");
const finalVerdictEl = document.getElementById("finalVerdict");
const outputTextEl = document.getElementById("outputText");

const generateBtn = document.getElementById("generateBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const loadDraftBtn = document.getElementById("loadDraftBtn");
const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const scoreFieldKeys = [
  "scoreProfessional",
  "scoreCommunication",
  "scoreTeamwork",
  "scoreKnowledge",
  "scoreProtocol",
  "scoreInitiative",
];

function getValue(key) {
  return fields[key]?.value?.trim() || "";
}

function getNumericScores() {
  return scoreFieldKeys
    .map((key) => Number(fields[key].value))
    .filter((value) => !Number.isNaN(value) && value > 0);
}

function calculateAverage() {
  const scores = getNumericScores();

  if (!scores.length) {
    return null;
  }

  const total = scores.reduce((sum, value) => sum + value, 0);
  return total / scores.length;
}

function getVerdict(average) {
  if (average === null) return "Nog niet berekend";
  if (average >= 4.5) return "Uitstekend";
  if (average >= 3.5) return "Goed";
  if (average >= 2.5) return "Voldoende";
  if (average >= 1.5) return "Matig";
  return "Onvoldoende";
}

function updateSummary() {
  const average = calculateAverage();
  const verdict = getVerdict(average);

  averageScoreEl.textContent = average === null ? "-" : average.toFixed(2);
  finalVerdictEl.textContent = verdict;
}

function formatDate(dateString) {
  if (!dateString) return "Niet ingevuld";

  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function createGeneratedText() {
  const average = calculateAverage();
  const verdict = getVerdict(average);

  const employeeName = getValue("employeeName") || "Onbekende medewerker";
  const employeeCallsign = getValue("employeeCallsign") || "/";
  const employeeRank = getValue("employeeRank") || "/";
  const department = getValue("department") || "/";
  const evaluationType = getValue("evaluationType") || "/";
  const evaluationDate = formatDate(getValue("evaluationDate"));
  const evaluatorName = getValue("evaluatorName") || "/";
  const evaluatorRank = getValue("evaluatorRank") || "/";
  const periodCovered = getValue("periodCovered") || "/";

  const scoreProfessional = getValue("scoreProfessional") || "/";
  const scoreCommunication = getValue("scoreCommunication") || "/";
  const scoreTeamwork = getValue("scoreTeamwork") || "/";
  const scoreKnowledge = getValue("scoreKnowledge") || "/";
  const scoreProtocol = getValue("scoreProtocol") || "/";
  const scoreInitiative = getValue("scoreInitiative") || "/";

  const strengths = getValue("strengths") || "Geen specifieke sterke punten genoteerd.";
  const improvements = getValue("improvements") || "Geen specifieke werkpunten genoteerd.";
  const goals = getValue("goals") || "Geen concrete doelstellingen genoteerd.";
  const generalNotes = getValue("generalNotes") || "Geen bijkomende opmerkingen.";

  return [
    "EMS EVALUATIEFORMULIER",
    "========================================",
    "",
    "ALGEMENE GEGEVENS",
    `Naam medewerker: ${employeeName}`,
    `Roepnummer: ${employeeCallsign}`,
    `Rang: ${employeeRank}`,
    `Afdeling: ${department}`,
    `Type evaluatie: ${evaluationType}`,
    `Datum evaluatie: ${evaluationDate}`,
    `Beoordeelde periode: ${periodCovered}`,
    `Evaluator: ${evaluatorName}`,
    `Rang evaluator: ${evaluatorRank}`,
    "",
    "SCORES PER ONDERDEEL",
    `Professionaliteit: ${scoreProfessional}/5`,
    `Communicatie: ${scoreCommunication}/5`,
    `Teamwork: ${scoreTeamwork}/5`,
    `Medische kennis / vakkennis: ${scoreKnowledge}/5`,
    `Protocolkennis & opvolging: ${scoreProtocol}/5`,
    `Zelfstandigheid & initiatief: ${scoreInitiative}/5`,
    "",
    `Gemiddelde score: ${average === null ? "/" : average.toFixed(2)}/5`,
    `Eindbeoordeling: ${verdict}`,
    "",
    "STERKE PUNTEN",
    strengths,
    "",
    "WERKPUNTEN",
    improvements,
    "",
    "AFSPRAKEN / DOELSTELLINGEN",
    goals,
    "",
    "ALGEMENE OPMERKINGEN",
    generalNotes,
    "",
    "SAMENVATTING",
    `${employeeName} werd geëvalueerd in het kader van ${evaluationType.toLowerCase() !== "/" ? evaluationType.toLowerCase() : "deze evaluatie"}. `
      + `De medewerker behaalde een gemiddelde score van ${average === null ? "/" : average.toFixed(2)}/5, wat resulteert in de eindbeoordeling "${verdict}". `
      + `Tijdens het gesprek werden sterke punten, werkpunten en verdere afspraken besproken en vastgelegd.`,
    "",
    "========================================"
  ].join("\n");
}

function saveDraft() {
  const data = {};

  Object.keys(fields).forEach((key) => {
    data[key] = fields[key].value;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  alert("Concept opgeslagen in deze browser.");
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    alert("Er is geen opgeslagen concept gevonden.");
    return;
  }

  try {
    const data = JSON.parse(raw);

    Object.keys(fields).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        fields[key].value = data[key];
      }
    });

    updateSummary();
    alert("Concept geladen.");
  } catch (error) {
    alert("Het opgeslagen concept kon niet geladen worden.");
    console.error(error);
  }
}

function clearForm() {
  const confirmed = window.confirm("Wil je alle ingevulde gegevens leegmaken?");
  if (!confirmed) return;

  Object.keys(fields).forEach((key) => {
    fields[key].value = "";
  });

  averageScoreEl.textContent = "-";
  finalVerdictEl.textContent = "Nog niet berekend";
  outputTextEl.value = "";
}

async function copyOutput() {
  const text = outputTextEl.value.trim();

  if (!text) {
    alert("Er is nog geen evaluatietekst om te kopiëren.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("Evaluatietekst gekopieerd naar klembord.");
  } catch (error) {
    alert("Kopiëren is mislukt in deze browser.");
    console.error(error);
  }
}

function downloadOutput() {
  const text = outputTextEl.value.trim();

  if (!text) {
    alert("Er is nog geen evaluatietekst om te downloaden.");
    return;
  }

  const employeeName = getValue("employeeName") || "medewerker";
  const safeName = employeeName.toLowerCase().replace(/[^a-z0-9]+/gi, "-");
  const dateValue = getValue("evaluationDate") || "zonder-datum";
  const filename = `evaluatie-${safeName}-${dateValue}.txt`;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const tempLink = document.createElement("a");
  tempLink.href = url;
  tempLink.download = filename;
  document.body.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();

  URL.revokeObjectURL(url);
}

function generateOutput() {
  updateSummary();
  outputTextEl.value = createGeneratedText();
}

scoreFieldKeys.forEach((key) => {
  fields[key].addEventListener("change", updateSummary);
});

generateBtn.addEventListener("click", generateOutput);
saveDraftBtn.addEventListener("click", saveDraft);
loadDraftBtn.addEventListener("click", loadDraft);
clearBtn.addEventListener("click", clearForm);
copyBtn.addEventListener("click", copyOutput);
downloadBtn.addEventListener("click", downloadOutput);

updateSummary();
