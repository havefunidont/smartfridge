let html5QrCode = null;
let gescannterBarcode = null;
let zuletztEingetrageneAnzahl = null;

async function startScanner() {
  const resultContainer = document.getElementById("qr-reader-results");
  resultContainer.innerHTML = ""; // Reset

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qr-reader");
  }

  const config = {
    fps: 10,
    qrbox: 250,
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39
    ]
  };

  const devices = await Html5Qrcode.getCameras();
  if (!devices.length) {
    alert("Keine Kamera gefunden.");
    return;
  }

  // Wähle Kamera 1 falls verfügbar (Rückkamera am Smartphone)
  if (devices.length > 1) {
    const cameraId = devices[1].id;
  }
  // Wähle sonst die einzig verfügbare Kamera:
  else {
    const cameraId = devices[0].id;
  }

  html5QrCode.start(
    { deviceId: { exact: cameraId } },
    config,
    (decodedText) => {
      console.log("Scan erfolgreich:", decodedText);
      const ergebnisContainer = document.getElementById("qr-reader-results");
      ergebnisContainer.innerHTML = `Barcode: ${decodedText}`
      gescannterBarcode = decodedText;
    },
    (error) => {
      if (!error.includes("No MultiFormat Readers")) {
        console.log("Scan-Fehler: ", error);
      }
    }
  );
}

// Sendet Produktdaten ans Backend:
function datenSenden(barcode) {
  // Sammle die benötigten Informationen:
  var anzahlEingabe = document.getElementById('anzahl-eingabe').value;
  var ablaufdatumEingabe = document.getElementById('mhd-eingabe').value;

  fetch('/produkt_hinzufuegen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({barcode: barcode, anzahl: anzahlEingabe, ablaufdatum: ablaufdatumEingabe})
  })
  .then (response => response.json())
  .then (result => {
    if (result.success) {
      produktDivHinzufügen(result.product);
      const resultContainer = document.getElementById("qr-reader-results");
      resultContainer.innerHTML = 'Produkt hinzugefügt';
      
      // Aktualisiere die Produktanzahl, sobald ein neues Produkt hinzugefügt wird:
      ladeProduktanzahl();
      ladeAbgelaufeneProduktanzahl();
    }
    else {
      alert("Fehler!");
    }
  })
  .catch(error => {
    console.error('Fehler beim Senden: ', error);
  })
}

// Neues Produkt-div hinzufügen
function produktDivHinzufügen(produkt) {
  const kachelLayout = document.querySelector('.kachel-layout');
  const neuesDiv = document.createElement('div');
  neuesDiv.className = 'kachel';

  const ablaufdatum = new Date(produkt.ablaufdatum);
  const heute = new Date();

  var abgelaufen = produkt.abgelaufen;

  // Zeitunterschied vom heutigen Datum zum Ablaufdatum in ms:
  const diff_ms = ablaufdatum - heute;

  // Tage, die übrig sind, bis das Produkt abläuft:
  const tage = Math.ceil(diff_ms / (1000 * 60 * 60 * 24));
  
  var ablaufdatum_div = "";

  // Produkt ist abgelaufen:
  if (tage < 0) {
    ablaufdatum_div = `<div class="ablaufdatum abgelaufen"> Seit ${tage*-1}T abgelaufen`;
  }
  else if (tage == 0) {
    ablaufdatum_div = `<div class="ablaufdatum bald"> Läuft heute ab`;
  }
  else {
    ablaufdatum_div = `<div class="ablaufdatum ok"> Läuft in ${tage}T ab`;
  }

  var anzahl_einheit;

  if (produkt.anzahl == 1) {
    anzahl_einheit = "Produkt";
  }
  else {
    anzahl_einheit = "Produkte"
  }

  neuesDiv.innerHTML = `
  <div class="titel">${produkt.name}</div> 
  <div class="daten">${produkt.anzahl} ${anzahl_einheit}</div>
  ${ablaufdatum_div}`;

  kachelLayout.appendChild(neuesDiv);
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop()
      .then(() => html5QrCode.clear())
      .catch(err => console.error("Fehler beim Stoppen:", err));
  }
}

function produktHinzufuegen() {
  popupSchliessen();
  datenSenden(gescannterBarcode);
}

// Lade die Produktanzahl vom Backend:
async function ladeProduktanzahl() {
  try {
    // Erhalte die Produktanzahl aus dem Backend:
    const response = await fetch('/anzahl_produkte');
    const data = await response.json();

    var anzeige_text = "";

    // Zeige entweder die Anzahl, oder falls
    // keine Produkte registriert sind "keine" an:
    if (data.anzahl_produkte == 0) {
      anzeige_text = "keine Produkte";
    }
    else if (data.anzahl_produkte == 1) {
      anzeige_text = data.anzahl_produkte + " Produkt";
    }
    else {
      anzeige_text = data.anzahl_produkte + " Produkte";
    }
    
    // Zeige den Text auf der Website an:
    document.getElementById("anzahl_produkte").innerText = anzeige_text;
  }  
  catch (error) {
    console.log("Error: " + error);
  }
}

// Lade die Produktanzahl vom Backend:
async function ladeAbgelaufeneProduktanzahl() {
  try {
    // Erhalte die Produktanzahl aus dem Backend:
    const response = await fetch('/anzahl_abgelaufene_produkte');
    const data = await response.json();

    var anzeige_text = "";

    // Zeige entweder die Anzahl, oder falls
    // keine Produkte registriert sind "keine" an:
    if (data.anzahl_abgelaufene_produkte == 0) {
      anzeige_text = "keine Produkte";
    }
    else if (data.anzahl_abgelaufene_produkte == 1) {
      anzeige_text = data.anzahl_abgelaufene_produkte + " Produkt";
    }
    else {
      anzeige_text = data.anzahl_abgelaufene_produkte + " Produkte";
    }
    
    // Zeige den Text auf der Website an:
    document.getElementById("anzahl_abgelaufene_produkte").innerText = anzeige_text;
  }  
  catch (error) {
    console.log("Error: " + error);
  }
}

// Zu Beginn die Produktanzahl laden:
ladeProduktanzahl();
ladeAbgelaufeneProduktanzahl();

window.addEventListener('DOMContentLoaded', () => {
  if (typeof gespeicherteProdukte !== 'undefined') {
    for (const id in gespeicherteProdukte) {
      const produkt = gespeicherteProdukte[id];
      produktDivHinzufügen(produkt);
    }
  }
});