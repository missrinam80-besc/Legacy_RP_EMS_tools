/**
 * EMS Evaluatieformulier Tool
 * ---------------------------
 * Doel:
 * - Lokale webtool voor het invullen van personeels- of trainee-evaluaties.
 * - Geen database, geen backend, enkel browserlogica.
 * - Automatische scoreberekening en tekstgeneratie.
 *
 * Bestemd voor:
 * - GitHub Pages
 * - Rechtstreekse link of embed in een interne website
 */

const criteria = [
  {
    key: "professionalism",
    title: "Professionaliteit",
    help: "Houding, respectvolle omgang, representatief optreden en verantwoordelijkheidszin."
  },
  {
    key: "communication",
    title: "Communicatie",
    help: "Duidelijkheid naar collega's, patiënten, dispatch en leidinggevenden."
  },
  {
    key: "medicalSkills",
    title: "Medische handelingen",
    help: "Correct uitvoeren van basis- en/of gespecialiseerde handelingen binnen de functie."
  },
  {
    key: "reporting",
    title: "Rapportage",
    help: "Volledigheid, nauwkeurigheid en structuur van verslagen en MDT-notities."
  },
  {
    key: "teamwork",
    title: "Teamwork",
    help: "Samenwerking binnen ploeg, discipline en ondersteuning van collega's."
  },
  {
    key: "initiative",
    title: "Initiatief & leerhouding",
    help: "Zelfstandig meedenken, feedback opnemen en bereidheid om bij te leren."
  }
];

const form = document.getElementById("evaluationForm");
const criteriaGrid = document.getElementById("criteriaGrid");
const averageScoreEl = document.getElementById("averageScore");
const scoreVerdictEl = document.getElementById("scoreVerdict");
const reportOutput = document.getElementById("reportOutput");
const btnCopyReport = document.getElementById("btnCopyReport");
const btnDownloadTxt = document.getElementById("btnDownloadTxt");
const btnReset = document.getElementById("btnReset");

/** Bouwt de scorekaarten dynamisch op. */
function renderCriteria() {
  criteriaGrid.innerHTML = criteria.map((criterion) => `
    <article class="criterion-card">
      <div class="criterion-title">${criterion.title}</div>
      <p class="criterion-help">${criterion.help}</p>
      <select class="score-select" data-score-key="${criterion.key}">
        <option value="">Score</option>
        <option value="1">1 - Zwak</option>
        <option value="2">2 - Onvoldoende</option>
        <option value="3">3 - Voldoende</option>
        <option value="4">4 - Goed</option>
        <option value="5">5 - Zeer goed</option>
      </select>
    </article>
  `).join("");
}

/** Leest alle formulierdata en scores uit. */
function getFormData() {
  const scoreEntries = {};

  document.querySelectorAll("[data-score-key]").forEach((select) => {
    scoreEntries[select.dataset.scoreKey] = Number(select.value || 0);
  });

  return {
    employeeName: document.getElementById("employeeName").value.trim(),
    employeeRank: document.getElementById("employeeRank").value.trim(),
    department: document.getElementById("department").value,
    evaluationType: document.getElementById("evaluationType").value,
    evaluatorName: document.getElementById("evaluatorName").value.trim(),
    evaluationDate: document.getElementById("evaluationDate").value,
    period: document.getElementById("period").value.trim(),
    attendance: document.getElementById("attendance").value.trim(),
    strengths: document.getElementById("strengths").value.trim(),
    improvements: document.getElementById("improvements").value.trim(),
    goals: document.getElementById("goals").value.trim(),
    finalAdvice: document.getElementById("finalAdvice").value,
    scores: scoreEntries
  };
}

/** Geeft gemiddelde score en tekstuele beoordeling terug. */
function calculateScore(scores) {
  const values = Object.values(scores).filter((value) => value > 0);

  if (!values.length) {
    return { average: 0, verdict: "Nog niet bepaald" };
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  let verdict = "Nog niet bepaald";

  if (average >= 4.5) verdict = "Uitstekend";
  else if (average >= 3.75) verdict = "Sterk";
  else if (average >= 3) verdict = "Voldoende";
  else if (average >= 2) verdict = "Aandacht nodig";
  else verdict = "Onvoldoende";

  return { average, verdict };
}

/** Formatteert datum naar leesbare notatie. */
function formatDate(dateString) {
  if (!dateString) return "niet ingevuld";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("nl-BE");
}

/** Maakt nette regels voor score-overzicht. */
function buildScoreLines(scores) {
  return criteria.map((criterion) => {
    const value = scores[criterion.key] || 0;
    const label = value ? `${value}/5` : "niet gescoord";
    return `- ${criterion.title}: ${label}`;
  }).join("\n");
}

/** Bouwt de uiteindelijke evaluatietekst op. */
function buildReport(data, scoreData) {
  return [
    "EVALUATIEFORMULIER EMS",
    "====================",
    `Naam medewerker: ${data.employeeName || "niet ingevuld"}`,
    `Rang / functie: ${data.employeeRank || "niet ingevuld"}`,
    `Afdeling: ${data.department || "niet ingevuld"}`,
    `Type evaluatie: ${data.evaluationType || "niet ingevuld"}`,
    `Evaluator: ${data.evaluatorName || "niet ingevuld"}`,
    `Evaluatiedatum: ${formatDate(data.evaluationDate)}`,
    `Periode / context: ${data.period || "niet ingevuld"}`,
    "",
    "AANWEZIGHEID / INZET",
    "---------------------",
    data.attendance || "Geen extra opmerkingen ingevuld.",
    "",
    "SCORES PER CRITERIUM",
    "--------------------",
    buildScoreLines(data.scores),
    "",
    `Gemiddelde score: ${scoreData.average.toFixed(1)} / 5`,
    `Algemene beoordeling: ${scoreData.verdict}`,
    "",
    "STERKE PUNTEN",
    "-------------",
    data.strengths || "Geen sterke punten ingevuld.",
    "",
    "WERKPUNTEN / AANDACHTSPUNTEN",
    "----------------------------",
    data.improvements || "Geen werkpunten ingevuld.",
    "",
    "DOELEN VOOR VOLGENDE PERIODE",
    "----------------------------",
    data.goals || "Geen concrete doelen ingevuld.",
    "",
    "EINDADVIES",
    "----------",
    data.finalAdvice || "Geen eindadvies geselecteerd.",
    "",
    "SAMENVATTING",
    "-----------",
    `${data.employeeName || "De medewerker"} werd geëvalueerd in het kader van ${
      data.evaluationType ? data.evaluationType.toLowerCase() : "deze evaluatie"
    }. Op basis van de ingevulde criteria bedraagt de gemiddelde score ${scoreData.average.toFixed(1)} op 5, wat overeenkomt met een beoordeling van ${scoreData.verdict.toLowerCase()}. ${
      data.finalAdvice ? `Het geformuleerde eindadvies luidt: ${data.finalAdvice}.` : ""
    }`
  ].join("\n");
}

/** Slaat tijdelijke invoer lokaal op. */
function saveDraft(data) {
  localStorage.setItem("emsEvaluationDraft", JSON.stringify(data));
}

/** Herstelt lokale conceptdata indien aanwezig. */
function restoreDraft() {
  const raw = localStorage.getItem("emsEvaluationDraft");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);

    Object.entries(data).forEach(([key, value]) => {
      const input = document.getElementById(key);
      if (input && typeof value === "string") {
        input.value = value;
      }
    });

    if (data.scores) {
      document.querySelectorAll("[data-score-key]").forEach((select) => {
        const storedValue = data.scores[select.dataset.scoreKey];
        select.value = storedValue ? String(storedValue) : "";
      });
    }
  } catch (error) {
    console.error("Kon lokale conceptdata niet lezen", error);
  }
}

/** Toont een eenvoudige toastmelding. */
function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
}

/** Ververst score en rapport. */
function updateOutput() {
  const data = getFormData();
  const scoreData = calculateScore(data.scores);

  averageScoreEl.textContent = `${scoreData.average.toFixed(1)} / 5`;
  scoreVerdictEl.textContent = scoreData.verdict;
  reportOutput.value = buildReport(data, scoreData);
  saveDraft(data);
}

/** Kopieert de rapporttekst naar het klembord. */
async function copyReport() {
  try {
    await navigator.clipboard.writeText(reportOutput.value);
    showToast("Evaluatie gekopieerd naar klembord.");
  } catch (error) {
    console.error(error);
    showToast("Kopiëren is niet gelukt.");
  }
}

/** Downloadt het rapport als txt-bestand. */
function downloadTxt() {
  const fileContent = reportOutput.value;
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const name = (document.getElementById("employeeName").value || "evaluatie")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  link.href = url;
  link.download = `${name || "evaluatieformulier"}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Zet het volledige formulier terug leeg. */
function resetTool() {
  form.reset();
  document.querySelectorAll("[data-score-key]").forEach((select) => {
    select.value = "";
  });
  document.getElementById("strengths").value = "";
  document.getElementById("improvements").value = "";
  document.getElementById("goals").value = "";
  document.getElementById("finalAdvice").value = "";
  localStorage.removeItem("emsEvaluationDraft");
  updateOutput();
  showToast("Formulier werd gereset.");
}

/** Initialiseert de tool. */
function init() {
  renderCriteria();
  restoreDraft();
  updateOutput();

  document.addEventListener("input", updateOutput);
  document.addEventListener("change", updateOutput);

  btnCopyReport.addEventListener("click", copyReport);
  btnDownloadTxt.addEventListener("click", downloadTxt);
  btnReset.addEventListener("click", resetTool);
}

init();
