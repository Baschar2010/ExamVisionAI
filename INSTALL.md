# Installation und Start

ExamVision AI wird aus einer gemeinsamen Codebasis als PC-Website und als Android-App ausgeliefert. Beide Versionen speichern Daten standardmäßig nur lokal. Eine automatische Cloud-Synchronisierung gibt es nicht; der Austausch erfolgt manuell per JSON-Datei.

## 1. Website auf dem PC starten

Voraussetzungen: **Node.js 20 oder neuer** und npm.

```bash
npm install
npm run dev
```

Die lokale Adresse steht anschließend im Terminal, üblicherweise `http://localhost:5173`. Die Ende-zu-Ende-Prüfung dieses Standes lief mit:

```bash
npm run dev -- --port 4180 --strictPort
```

Für einen Produktionsbuild und dessen Vorschau:

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

**Wichtig:** Browser-Speicher ist an den Origin gebunden. `http://localhost:5173` und `http://localhost:4180` sind unterschiedliche Origins und sehen daher unterschiedliche Daten. Für einen Wechsel **Einstellungen → Daten exportieren** und auf der anderen Seite **Daten importieren** verwenden.

## 2. Android-APK installieren

### Geprüfte Datei

| Merkmal | Wert |
|---|---|
| Datei | `release/ExamVisionAI-1.1-debug.apk` |
| Paket | `ai.examvision.app` |
| Version | 1.1 (versionCode 2) |
| minSdk / targetSdk | 24 (Android 7.0) / 36 |
| Größe | 5.275.495 Bytes |
| Datei-SHA-256 | `323f6089cfaf346f9d312e652901f1c0e5ca9fba966dfbb4dca822872c1385a4` |
| Signer | `C=US, O=Android, CN=Android Debug` |
| Signer-SHA-256 | `5cb13602e7a003d61c9739842f74e32d869fe84ae8f7b68f1b2ecc42ac1947cd` |

Der Roh-Build liegt unter `android/app/build/outputs/apk/debug/app-debug.apk`. Das Verzeichnis `release/` ist im Git ignorierte Ablage für das fertige Artefakt.

### Schritte

1. `ExamVisionAI-1.1-debug.apk` auf das Android-Gerät kopieren oder dort herunterladen.
2. Die APK in einem Dateimanager öffnen.
3. Falls Android fragt, dem Dateimanager oder Browser einmalig das Installieren unbekannter Apps erlauben.
4. Installationsdialog bestätigen. Eine Warnung von Play Protect ist bei debug-signierten APKs möglich und muss bewusst bestätigt werden.
5. App öffnen und zuerst die gewünschte Sprache unter **Einstellungen → Sprache** prüfen.

Diese Schritte beschreiben den üblichen Android-Weg. **Die Installation und der Start wurden in diesem Projekt nicht auf einem echten Gerät oder Emulator ausgeführt**, weil keines verfügbar war; siehe [TEST-REPORT.md](TEST-REPORT.md#4-nicht-durchgeführt--nicht-verifiziert).

### Hinweise zur Debug-Signatur

Die APK ist mit dem Android-Debug-Schlüssel signiert und für Tests gedacht, nicht für den Play Store. Ein Update auf eine anderswo gebaute Debug-APK kann scheitern, weil der Debug-Schlüssel abweicht. Exportiere vorher die Daten, deinstalliere bei Bedarf die alte Version und importiere danach die JSON-Datei. Die importierte Datei ersetzt alle lokalen Daten nach Bestätigung.

## 3. Daten zwischen Website und App übernehmen

1. Auf dem Quellgerät: **Einstellungen → Daten exportieren**. Es entsteht eine `examvision-ai-profile`-JSON-Datei.
2. Datei auf das Zielgerät übertragen (z. B. USB, Cloud-Speicher, E-Mail).
3. Auf dem Zielgerät: **Einstellungen → Daten importieren**, Datei auswählen und den Bestätigungsdialog lesen.
4. Nach dem Import sind Dokumente, Artefakte, Chat, Arbeiten und Einstellungen aus der Datei wiederhergestellt. Der Import ersetzt die vorhandenen lokalen Daten vollständig.

Die JSON-Datei enthält unter anderem Unterrichtsmaterialien, Arbeitsergebnisse, Chatverlauf, Prüfungen, Sprach- und Noteneinstellungen sowie optional den selbst konfigurierten KI-Endpunkt und Modellnamen. API-Schlüssel werden nicht in der App gespeichert und sind daher nicht enthalten. Behandle die Datei als vertraulich, da sie deine Unterrichtsinhalte enthält.

## 4. Selbst bauen

Voraussetzungen: Node.js 20+, Android Studio/SDK, JDK 21 und gesetztes `ANDROID_HOME`. Pfade im Beispiel an die eigene Installation anpassen (PowerShell unter Windows):

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\openjdk\jdk-21.0.8'
$env:ANDROID_HOME = 'C:\Users\BAHAA\AppData\Local\Android\Sdk'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

npm install
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug --no-daemon
```

Danach die APK aus `android/app/build/outputs/apk/debug/app-debug.apk` nach `release/ExamVisionAI-1.1-debug.apk` kopieren. Für einen echten Release einen eigenen Keystore verwenden und diesen nie versionieren.

## 5. Probleme

- **Installation blockiert:** Installationsberechtigung für die verwendete Datei-App erlauben; Play Protect-Warnung bewusst bestätigen.
- **Update fehlgeschlagen:** Andere Debug-Signatur. Daten exportieren, alte Version deinstallieren, neu installieren, Daten importieren.
- **Daten nach Portwechsel weg:** Unterschiedlicher Browser-Origin. Export/Import verwenden.
- **OCR lädt zum ersten Mal Daten:** Tesseract.js bezieht beim ersten OCR-Lauf kostenlos Bibliotheks- und Sprachdaten aus dem Tesseract-CDN. Danach läuft die Erkennung lokal. Details in [PRIVACY.md](PRIVACY.md).
