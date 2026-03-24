/**
 * EMS Afwezigheidsmelding Tool
 * ---------------------------------
 * Doel:
 * - Laat medewerkers een afwezigheid melden
 * - Stuurt de melding door naar een Discordkanaal via webhook
 *
 * Belangrijk:
 * - In een publieke GitHub Pages omgeving is een webhook-URL zichtbaar in de code.
 * - Dat is niet veilig voor productie.
 * - Gebruik dit dus enkel als testoplossing of vervang dit later door een kleine relay/proxy.
 */

const DISCORD_WEBHOOK_URL = "PLAK_HIER_JE_DISCORD_WEBHOOK_URL";

const form = document.getElementById("absenceForm");
const typeAfwezigheid = document.getElementById("typeAfwezigheid");
const andereTypeWrapper = document.getElementById("andereTypeWrapper");
const andereTypeInput = document.getElementById("andereType");
const statusBox = document.getElementById("statusBox");
const submitBtn = document.getElementById("submitBtn");

/**
 * Toont of verbergt het extra invulveld wanneer "Andere" gekozen wordt.
 */
function updateAndereVeld() {
  const isAndere = typeAfwezigheid.value === "Andere";

  andereTypeWrapper.classList.toggle("hidden", !isAndere);

  if (isAndere) {
    andereTypeInput.setAttribute("required", "required");
  } else {
    andereTypeInput.removeAttribute("required");
    andereTypeInput.value = "";
  }
}

/**
 * Zet een datum van YYYY-MM-DD om naar DD/MM/YYYY.
 * Als de input leeg is, geven we gewoon de originele waarde terug.
 */
function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

/**
 * Toont een statusmelding op het scherm.
 */
function showStatus(message, type = "success") {
  statusBox.textContent = message;
  statusBox.className = `status-box ${type}`;
}

/**
 * Verbergt de statusmelding.
 */
function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status-box";
}

/**
 * Haalt en normaliseert alle formulierdata.
 */
function getFormData() {
  const naam = document.getElementById("naam").value.trim();
  const roepnummer = document.getElementById("roepnummer").value.trim();
  const type = document.getElementById("typeAfwezigheid").value;
  const andereType = document.getElementById("andereType").value.trim();
  const beginDatum = document.getElementById("beginDatum").value;
  const eindDatum = document.getElementById("eindDatum").value;
  const reden = document.getElementById("reden").value.trim();

  const finaleType = type === "Andere" ? `Andere - ${andereType}` : type;

  return {
    naam,
    roepnummer,
    type,
    andereType,
    finaleType,
    beginDatum,
    eindDatum,
    reden
  };
}

/**
 * Controleert de formulierdata.
 */
function validateFormData(data) {
  if (!data.naam) {
    return "Gelieve een naam in te vullen.";
  }

  if (!data.roepnummer) {
    return "Gelieve een roepnummer in te vullen.";
  }

  if (!data.type) {
    return "Gelieve een type afwezigheid te kiezen.";
  }

  if (data.type === "Andere" && !data.andereType) {
    return "Gelieve de andere afwezigheid te specifiëren.";
  }

  if (!data.beginDatum) {
    return "Gelieve een begindatum in te vullen.";
  }

  if (!data.eindDatum) {
    return "Gelieve een einddatum in te vullen.";
  }

  if (data.eindDatum < data.beginDatum) {
    return "De einddatum kan niet vóór de begindatum liggen.";
  }

  if (!data.reden) {
    return "Gelieve een reden of toelichting in te vullen.";
  }

  if (
    !DISCORD_WEBHOOK_URL ||
    DISCORD_WEBHOOK_URL === "PLAK_HIER_JE_DISCORD_WEBHOOK_URL"
  ) {
    return "De Discord webhook-URL is nog niet ingevuld in script.js.";
  }

  return null;
}

/**
 * Bouwt de inhoud op zoals die in Discord moet verschijnen.
 * We gebruiken zowel content als embeds zodat de melding netjes leesbaar is.
 */
function buildDiscordPayload(data) {
  const begin = formatDate(data.beginDatum);
  const einde = formatDate(data.eindDatum);

  return {
    username: "EMS Afwezigheidsformulier",
    embeds: [
      {
        title: "Nieuwe afwezigheidsmelding",
        color: 9109504,
        fields: [
          {
            name: "Naam",
            value: data.naam,
            inline: true
          },
          {
            name: "Roepnummer",
            value: data.roepnummer,
            inline: true
          },
          {
            name: "Type",
            value: data.finaleType,
            inline: true
          },
          {
            name: "Begindatum",
            value: begin,
            inline: true
          },
          {
            name: "Einddatum",
            value: einde,
            inline: true
          },
          {
            name: "Reden / toelichting",
            value: data.reden
          }
        ],
        footer: {
          text: "Automatisch verzonden via EMS afwezigheidstool"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

/**
 * Verstuurt de melding naar Discord.
 */
async function sendToDiscord(payload) {
  const response = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Discord webhook gaf foutcode ${response.status}`);
  }
}

/**
 * Formulier verzenden
 */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const data = getFormData();
  const validationError = validateFormData(data);

  if (validationError) {
    showStatus(validationError, "error");
    return;
  }

  const payload = buildDiscordPayload(data);

  submitBtn.disabled = true;
  submitBtn.textContent = "Bezig met verzenden...";

  try {
    await sendToDiscord(payload);
    showStatus("De afwezigheidsmelding werd succesvol doorgestuurd naar Discord.", "success");
    form.reset();
    updateAndereVeld();
  } catch (error) {
    console.error("Fout bij verzenden naar Discord:", error);
    showStatus(
      "De melding kon niet naar Discord verzonden worden. Controleer de webhook-URL of gebruik later een veilige relay-oplossing.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Melding verzenden";
  }
});

/**
 * Reset zorgt ook voor correcte UI van het extra veld.
 */
form.addEventListener("reset", () => {
  clearStatus();
  setTimeout(() => {
    updateAndereVeld();
  }, 0);
});

typeAfwezigheid.addEventListener("change", updateAndereVeld);

/**
 * Init
 */
updateAndereVeld();
