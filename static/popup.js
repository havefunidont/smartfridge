const overlay = document.getElementById("overlay");

// Öffnet das Popup
function popupOeffnen() {
  overlay.style.display = "block";
  startScanner();
}

// Schließt das Popup
function popupSchliessen() {
  stopScanner();
  overlay.style.display = "none";
}