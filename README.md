# Kicktipp Plattform (Phase 1)

Phase 1 implementiert:
- Registrierung, Login, Logout
- Passwort-Reset per E-Mail (SMTP oder Console-Fallback)
- Persönliches Punktekonto mit Historie
- Basis-Seiten: Startseite, Dashboard, So funktioniert's, Regelwerk

## Voraussetzungen
- Node.js 20+
- PostgreSQL

## Setup
1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. Umgebungsvariablen setzen:
   ```bash
   copy .env.example .env
   ```
3. Datenbank-Migration ausführen:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Entwicklung starten:
   ```bash
   npm run dev
   ```

## Nützliche Commands
- `npm run lint` - ESLint ausführen
- `npm run test` - Vitest-Tests ausführen
- `npx prisma studio` - Datenbank visuell prüfen
