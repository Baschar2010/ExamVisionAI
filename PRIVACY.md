# Datenschutzhinweise – ExamVision AI

ExamVision AI benötigt kein Konto. Unterrichtstexte, Antworten, Arbeitsergebnisse und Lernfortschritt werden lokal im Browser-Speicher (IndexedDB, mit localStorage-Fallback) auf dem Gerät abgelegt. Mit **Einstellungen → Alle Daten löschen** können die App-Daten entfernt werden; zusätzlich lassen sie sich in den Website-Daten des Browsers löschen.

PDF-Dateien werden lokal durch PDF.js ausgelesen. Seiten ohne brauchbaren Textlayer werden gerastert und lokal per Tesseract.js-OCR nachgelesen. Bei Bildern läuft die OCR ebenfalls lokal über Tesseract.js. Beim erstmaligen Laden eines OCR-Sprachmodells lädt die App Bibliotheksdateien und Sprachdaten aus dem Tesseract.js-CDN. Dabei wird eine Netzwerkverbindung zum CDN hergestellt; Bildinhalte werden nicht an einen Erkennungsserver gesendet.

## Optionaler KI-Connector

Der KI-Connector ist standardmäßig deaktiviert. Es werden keine Daten an einen KI-Dienst übertragen, solange nicht alle folgenden Bedingungen erfüllt sind:

1. In **Einstellungen → KI-Verbindung (optional)** wurden ein eigener HTTPS-Endpunkt und ein Modellname eingegeben. Andere Protokolle als HTTPS werden abgewiesen.
2. Auf der Erstellungs- oder Auswertungsseite wurde **KI-Vorschau anzeigen** betätigt; die konkret zu übertragenden Textauszüge werden angezeigt.
3. Die ausdrückliche Zustimmung wurde für genau diese Anfrage aktiv gesetzt. Die Zustimmung wird nicht dauerhaft gespeichert und nach der Anfrage zurückgesetzt.
4. Für Fragen werden nur markierte Textstellen aus den aktuellen Unterrichtsmaterialien übermittelt. Die Antworten werden auf wörtliche Belege, Thema und Punkte geprüft; bei Fehlern bleibt die lokale Erstellung aktiv.
5. Für eine KI-Korrektur werden nur Musterlösung und Antworttext der jeweiligen Aufgabe übermittelt. Das Ergebnis wird als Vorschlag gekennzeichnet; die lokale Bewertung bleibt erhalten, wenn die Anfrage scheitert.

API-Schlüssel gehören ausschließlich in die Konfiguration des selbst betriebenen Servers und werden nie in der App gespeichert. Es ist kein kostenpflichtiger Dienst vorkonfiguriert.

Die App enthält keine Konten, Werbung oder eigene Analytik. Die Website lädt die Schriftfamilien DM Sans und Manrope über Google Fonts. Diese Hinweise sind ein technischer Projektentwurf und ersetzen keine rechtliche Prüfung vor einer öffentlichen Verteilung.
