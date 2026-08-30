# Gemeinsame Einkaufslisten- & Kochbuch-App

Eine vollständig funktionsfähige, mobile-optimierte React Native App für gemeinsames Einkaufen und Kochen. Mit Echtzeit-Synchronisation für mehrere Geräte, Offline-First-Support und modernem Cyberpunk/Synthwave-Design.

## Features

- 🛒 **Gemeinsame Einkaufsliste** – mit Echtzeit-Sync zwischen mehreren Geräten
- 📖 **Kochbuch** – eigene Rezepte mit Fotos erstellen und verwalten
- ⚖️ **Rezeptskalierung** – automatische Mengenberechnung für beliebig viele Portionen
- 🔄 **Zutaten-Aggregation** – intelligentes Zusammenführen gleicher Zutaten
- ⭐ **Favoriten** – Lieblingsartikel mit einem Tap zur Liste hinzufügen
- 📅 **Wochenplaner** – Zufällige oder manuelle Wochenplanung
- 🛒 **Wochenplan → Einkaufsliste** – Alle Zutaten der Woche automatisch berechnet
- 🌐 **Offline-First** – Auch ohne Internet nutzbar, automatische Synchronisation

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | React Native + Expo (TypeScript) |
| Navigation | React Navigation (Bottom Tabs + Native Stack) |
| Auth | Firebase Authentication |
| Datenbank | Cloud Firestore (mit Offline-Persistence) |
| Storage | Firebase Cloud Storage |
| Bild-Upload | expo-image-picker + expo-image-manipulator |
| State | React Context + Hooks |
| Tests | Jest + ts-jest |

## Projektstruktur

```
e:\Programmierung\List\
├── src/
│   ├── context/
│   │   └── AuthContext.tsx        # Benutzer- und Haushalt-Zustand
│   ├── models/
│   │   └── types.ts               # TypeScript-Datenmodelle
│   ├── navigation/
│   │   └── AppNavigator.tsx       # Tab- und Stack-Navigation
│   ├── screens/
│   │   ├── LoginScreen.tsx        # Login + Registrierung
│   │   ├── HouseholdScreen.tsx    # Haushalt erstellen / beitreten
│   │   ├── DashboardScreen.tsx    # Startseite / Übersicht
│   │   ├── ShoppingListScreen.tsx # Einkaufsliste
│   │   ├── FavoritesScreen.tsx    # Favoriten-Verwaltung
│   │   ├── RecipeListScreen.tsx   # Kochbuch-Übersicht (Grid)
│   │   ├── RecipeDetailScreen.tsx # Rezept-Detailansicht mit Skalierung
│   │   ├── RecipeEditScreen.tsx   # Rezept erstellen / bearbeiten
│   │   ├── WeeklyPlanScreen.tsx   # Wochenplaner
│   │   └── ProfileScreen.tsx      # Profil / Haushalt-Management
│   ├── services/
│   │   ├── firebase.ts            # Firebase-Initialisierung (Offline-Persistence)
│   │   ├── shoppingRepository.ts  # Firestore-Zugriff: Einkaufsliste
│   │   ├── favoriteRepository.ts  # Firestore-Zugriff: Favoriten
│   │   ├── recipeRepository.ts    # Firestore-Zugriff: Rezepte + Storage
│   │   └── weeklyPlanRepository.ts# Firestore-Zugriff: Wochenplan
│   ├── utils/
│   │   ├── unitConverter.ts       # Einheitenumrechnung + Formatierung
│   │   ├── recipeScaler.ts        # Rezept-Skalierungsalgorithmus
│   │   └── ingredientAggregator.ts# Zutaten-Aggregation + Merge-Logik
│   └── __tests__/
│       ├── unitConverter.test.ts
│       ├── recipeScaler.test.ts
│       └── ingredientAggregator.test.ts
├── App.tsx                        # Einstiegspunkt
├── firestore.rules                # Firestore Security Rules
├── storage.rules                  # Firebase Storage Rules
├── jest.config.js                 # Jest-Konfiguration
├── .env.example                   # Vorlage für Umgebungsvariablen
└── package.json
```

## Installation und lokale Entwicklung

### 1. Voraussetzungen

- Node.js 18+
- npm oder yarn
- Expo CLI: `npm install -g @expo/cli`
- Android Studio (für Android-Emulator) oder Expo Go App (für physisches Gerät)

### 2. Repository klonen und Abhängigkeiten installieren

```bash
cd e:\Programmierung\List
npm install
```

### 3. Firebase einrichten (Backend)

#### a) Firebase-Projekt erstellen
1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com)
2. Erstelle ein neues Projekt (z.B. "familyliste")

#### b) Authentication aktivieren
1. Öffne **Authentication → Sign-in method**
2. Aktiviere **E-Mail/Passwort**

#### c) Cloud Firestore einrichten
1. Öffne **Firestore Database → Datenbank erstellen**
2. Wähle **Produktionsmodus** (Regeln werden separat konfiguriert)
3. Wähle eine Region (z.B. `europe-west3` für Europa)

#### d) Firebase Storage aktivieren
1. Öffne **Storage → Ersten Schritt ausführen**
2. Wähle **Produktionsmodus**
3. Wähle dieselbe Region wie Firestore

#### e) App-Konfiguration abrufen
1. Öffne **Projekteinstellungen → Allgemein → Deine Apps**
2. Klicke auf **Web-App hinzufügen** (auch für Expo verwendet)
3. Kopiere die Konfigurationswerte

### 4. Umgebungsvariablen setzen

```bash
# Kopiere die Vorlage
copy .env.example .env
```

Öffne `.env` und trage deine Firebase-Werte ein:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=dein-projekt.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=dein-projekt
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=dein-projekt.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> ⚠️ Committe niemals die `.env`-Datei in ein öffentliches Repository!

### 5. Security Rules deployen

Installiere die Firebase CLI, falls noch nicht vorhanden:
```bash
npm install -g firebase-tools
firebase login
firebase init  # Wähle Firestore und Storage
```

Deploye die Security Rules:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 6. App starten

#### A) Als Web-App / PWA (Empfohlen & am einfachsten)
Du kannst die App direkt in jedem Webbrowser auf deinem PC oder Smartphone nutzen, ohne Emulatoren oder Expo Go zu installieren:

```bash
# 1. Web-Version bauen
npm run build:web

# 2. Lokalen Web-Server starten und im Browser öffnen
npm run serve:web
```
Die App öffnet sich automatisch unter `http://localhost:5000`.

#### B) Über Expo (für native Entwicklung/Emulatoren)
```bash
# Entwicklungsserver starten
npm start

# Oder direkt auf einem Gerät/Emulator
npm run android
npm run ios     # Nur macOS
npm run web     # Im Metro Web Browser
```

## Tests ausführen

```bash
npm run test
```

Die Tests prüfen die Core-Algorithmen:
- Einheitenkonvertierung (`unitConverter.ts`)
- Rezeptskalierung (`recipeScaler.ts`)
- Zutaten-Aggregation (`ingredientAggregator.ts`)

## Deployment (Build)

### Android APK / AAB (Google Play)

```bash
# EAS Build installieren
npm install -g eas-cli
eas login

# Profil konfigurieren (eas.json wird erstellt)
eas build:configure

# Build starten
eas build --platform android
```

### iOS IPA (App Store)

```bash
eas build --platform ios  # Benötigt macOS und Apple Developer Account
```

### Web/PWA (Hosting auf GitHub Pages, Vercel oder Netlify)

Da die Web-Version nach dem Build vollkommen statisch ist, kann sie kostenlos auf fast allen Web-Hosting-Plattformen bereitgestellt werden.

#### Build erstellen:
```bash
npm run build:web
```
Dies erzeugt den optimierten Web-Build im Ordner `dist/`.

#### Option A: Hosten auf GitHub Pages
Um die App auf GitHub Pages zu deployen, kannst du das `gh-pages` Paket nutzen:
1. Installiere das Paket im Projekt:
   ```bash
   npm install -D gh-pages
   ```
2. Füge in deiner `package.json` unter `"scripts"` hinzu:
   ```json
   "deploy": "gh-pages -d dist"
   ```
3. Setze das `"homepage"`-Feld in deiner `package.json` auf deine GitHub-Pages-URL:
   ```json
   "homepage": "https://dein-benutzername.github.io/dein-repo-name"
   ```
4. Deploye die App mit einem Klick:
   ```bash
   npm run deploy
   ```

#### Option B: Hosten auf Vercel / Netlify (Empfohlen & extrem schnell)
1. Installiere das Vercel CLI oder Netlify CLI, oder verknüpfe dein GitHub-Repository direkt im Vercel/Netlify Dashboard.
2. Konfiguriere das Projekt wie folgt:
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
3. Die App wird bei jedem Push auf GitHub automatisch neu gebaut und live geschaltet.

## Datenmodell (Firestore)

```
users/{userId}
  - id, email, displayName, householdId, createdAt

households/{householdId}
  - id, name, createdBy, members: { [uid]: { role, name } }, createdAt
  
  /favorite_items/{favId}
    - name, defaultQuantity, defaultUnit, category
    
  /recipes/{recipeId}
    - name, description, imageUrl, servings, prepTime, category
    - ingredients: [{ name, quantity, unit }]
    - steps: [string]
    - notes, isFavorite, createdAt, updatedAt
    
  /weekly_plans/{YYYY-WW}
    - householdId, defaultServings
    - days: { monday: { recipeId, recipeName, servings }, ... }

shopping_lists/list_{householdId}
  /items/{itemId}
    - name, quantity, unit, category, isBought, boughtAt, boughtBy
    - addedBy, createdAt
```

## Sicherheit

- Alle Firestore-Zugriffe werden durch Security Rules auf Server-Seite gesichert
- Ein Benutzer kann nur Daten von Haushalten lesen/schreiben, in denen er Mitglied ist
- Storage-Zugriffe sind auf authentifizierte Benutzer beschränkt und auf 5 MB limitiert
- Firebase-Konfigurationswerte werden über Umgebungsvariablen eingebunden (nie hardcoded)

## Offline-Verhalten

Firestore ist mit `persistentLocalCache` konfiguriert. Das bedeutet:
- Alle gelesenen Daten werden lokal gecacht
- Schreiboperationen werden offline in einer Queue gespeichert
- Bei Wiederherstellung der Verbindung werden alle ausstehenden Operationen automatisch synchronisiert
- Konflikte werden nach dem "Last-Write-Wins"-Prinzip (mit Server-Timestamp) aufgelöst

## Troubleshooting

**`FirebaseError: permission-denied`**
→ Prüfe, ob du die Security Rules korrekt deployed hast (`firebase deploy --only firestore:rules`)

**Bilder laden nicht**
→ Prüfe die Storage Rules und stelle sicher, dass CORS für dein Projekt konfiguriert ist

**App startet nicht**
→ Prüfe, ob alle Werte in der `.env`-Datei korrekt sind (keine Leerzeichen vor/nach `=`)

**Offline-Sync funktioniert nicht**
→ Stelle sicher, dass `persistentLocalCache` in `firebase.ts` korrekt konfiguriert ist

## Bekannte Einschränkungen (Version 1.0)

- Rezept-Import (via URL/Foto) ist noch nicht implementiert (Datenmodell ist erweiterbar)
- Push-Benachrichtigungen sind nicht implementiert
- Keine Dark-Mode-System-Erkennung (App verwendet standardmäßig Dark Mode)
