let config = {};
let resultText = "";

async function loadConfig() {
  const res = await fetch("config.json");
  config = await res.json();

  document.getElementById("appTitle").innerText = config.appTitle;
  document.getElementById("appSubtitle").innerText = config.appSubtitle;

  initUI();
}

function initUI() {
  const painSelect = document.getElementById("painLevel");
  config.painLevels.forEach(p => {
    painSelect.innerHTML += `<option>${p}</option>`;
  });

  const bloodSelect = document.getElementById("bloodLoss");
  config.bloodLossLevels.forEach(b => {
    bloodSelect.innerHTML += `<option>${b}</option>`;
  });

  const container = document.getElementById("bodyPartsContainer");

  config.bodyParts.forEach(part => {
    container.innerHTML += `
      <div class="card">
        <h3>${part}</h3>
        <select id="${part}">
          <option value="">Geen</option>
          ${Object.keys(config.wounds).map(w => `<option>${w}</option>`).join("")}
        </select>
        <label>Fractuur</label>
        <input type="checkbox" id="${part}_fracture">
      </div>
    `;
  });
}

function analyze() {
  let output = "";
  let warnings = [];

  config.bodyParts.forEach(part => {
    const wound = document.getElementById(part).value;
    const fracture = document.getElementById(part + "_fracture").checked;

    if (wound) {
      const data = config.wounds[wound];

      output += `\n${part.toUpperCase()}\n`;

      if (data.bleeding > 0.5) {
        output += "- Ernstige bloeding → tourniquet / quick clot\n";
      } else if (data.bleeding > 0) {
        output += "- Verband aanbrengen\n";
      }

      if (data.needSewing) {
        output += "- Hechten nodig\n";
      }

      if (fracture) {
        output += "- Immobiliseren\n";
      }
    }
  });

  const pain = document.getElementById("painLevel").value;
  const blood = document.getElementById("bloodLoss").value;

  let general = "\nALGEMEEN\n";

  if (pain === "hoog" || pain === "extreem") {
    general += "- Morphine aanbevolen\n";
  }

  if (blood === "hoog" || blood === "extreem") {
    general += "- Bloedtransfusie aanbevolen\n";
    warnings.push("Ernstig bloedverlies");
  }

  document.getElementById("treatment").innerText = output;
  document.getElementById("general").innerText = general;
  document.getElementById("warnings").innerText = warnings.join("\n");

  resultText = output + general + warnings.join("\n");
}

function copyResult() {
  navigator.clipboard.writeText(resultText);
}

function downloadResult() {
  const blob = new Blob([resultText], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rapport.txt";
  a.click();
}

loadConfig();
