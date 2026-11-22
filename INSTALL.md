# Installation auf Android

## Vorbereitete Debug-APK

1. APK auf das Android-Gerät kopieren oder herunterladen.
2. `app-debug.apk` öffnen und den Android-Installationsdialog bestätigen.
3. Falls Android fragt, die Installation für die verwendete Datei-App einmalig erlauben.

Die Debug-APK wurde mit dem Android-Debug-Schlüssel signiert und eignet sich zum Ausprobieren. Sie ist kein Play-Store-Release. Builds aus anderen Rechnern/GitHub-Actions können einen anderen Debug-Schlüssel haben und deshalb nicht als nahtloses Update über diese Installation installiert werden.

Datei im Projekt: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Selbst bauen

Siehe [README.md](README.md#android-build-mit-capacitor). Benötigt Android Studio/SDK und JDK 21.
