from flask import Flask, render_template, request, jsonify
import requests, json
from datetime import datetime

app = Flask(__name__) 

# Gibt zurück, ob das Ablaufdatum überschritten wurde:
def ist_abgelaufen(ablaufdatum):
    ablaufdatum = datetime.strptime(ablaufdatum, "%Y-%m-%d").date()
    heute = datetime.today().date()
    if ablaufdatum < heute:
        return True
    else:
        return False

anzahl_produkte = 0
anzahl_abgelaufene_produkte = 0

# Falls bereits Daten gespeichert sind:
try:
    with open('produkte.json', 'r') as datei:
        produkte = json.load(datei)
    
    for produkt in produkte.values():
        anzahl_produkte += produkt["anzahl"]

        if ist_abgelaufen(produkt["ablaufdatum"]):
            produkt["abgelaufen"] = True
            anzahl_abgelaufene_produkte += produkt["anzahl"]

# Falls noch keine Daten gespeichert wurden:
except FileNotFoundError:
    # Falls die Datei nicht existiert, erstelle ein leeres Dictionary und setze die Produktanzahl auf 0:
    produkte = {}

# Einzigartige ID für jedes unterschiedliche Produkt:
aktuelle_id = 0
 
# Findet zu einem Barcode den passenden Produktnamen und gibt ihn zurück:
def produktname_finden(barcode):
    url = f'https://world.openfoodfacts.org/api/v2/product/{barcode}.json'
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        if 'product' in data and 'product_name' in data['product']:
            return data['product']['product_name']
    
    # Falls kein Eintrag gefunden wurde, das Produkt als unbekannt anzeigen:    
    return f'Unbekannt ({barcode})'

# Wenn auf der Website ein Produkt gescannt und hinzugefügt wird: 
@app.route("/produkt_hinzufuegen", methods=['POST'])
def produkt_hinzufuegen():
    # Daten aus der Anfrage entnehmen:
    global anzahl_produkte, anzahl_abgelaufene_produkte, aktuelle_id
    daten = request.get_json()
    
    barcode = daten["barcode"]
    name = produktname_finden(barcode)
    ablaufdatum = daten["ablaufdatum"]
    anzahl = int(daten["anzahl"])
    abgelaufen = ist_abgelaufen(ablaufdatum)

    produkt = {
        'name': name,
        'anzahl': anzahl,
        'barcode': barcode,
        'ablaufdatum': ablaufdatum,
        'abgelaufen': abgelaufen
    }

    # Dem Produkt wird eine ID zugewiesen:
    produkte[aktuelle_id] = produkt
    aktuelle_id += 1
    
    # Gesamtprodktanzahl und Anzahl abgelaufener Produkte aktualisieren:
    anzahl_produkte += anzahl
    if (abgelaufen):
        anzahl_abgelaufene_produkte += anzahl
        
    with open('produkte.json', 'w') as datei:
        json.dump(produkte, datei)

    # Verarbeitete Produktdaten zurückgeben:
    return jsonify({'success': True, 'product': produkt})

# Aktualisierung der Produktanzahl:
@app.route('/anzahl_produkte')
def anzahl():
    return jsonify({'anzahl_produkte': anzahl_produkte})

# Aktualisierung der Anzahl der abgelaufenen Produkte:
@app.route('/anzahl_abgelaufene_produkte')
def anzahl_abgelaufen():
    return jsonify({'anzahl_abgelaufene_produkte': anzahl_abgelaufene_produkte})

# Wenn die Startseite geöffnet wird:
@app.route('/')
def index():
    # Zeige dem Besucher die HTML Seite an:
    return render_template('index.html', produkte=produkte)

# Starte die Flask App:
app.run(host = '0.0.0.0', port = 5000, debug = True)