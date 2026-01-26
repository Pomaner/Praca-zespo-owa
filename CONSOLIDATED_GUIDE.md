# Przewodnik Kompletny Projektu - Skrócona Dokumentacja

## Spis Treści
1. [Inicjalizacja i Konfiguracja](#inicjalizacja-i-konfiguracja)
2. [Struktura Projektu i Zespół](#struktura-projektu-i-zespół)
3. [Implementacja Backend i Frontend](#implementacja-backend-i-frontend)
4. [Testowanie, CI/CD i Wdrożenie](#testowanie-cicd-i-wdrożenie)
5. [Zarządzanie Wersjami i Dokumentacja](#zarządzanie-wersjami-i-dokumentacja)

---

## Inicjalizacja i Konfiguracja

### Git Setup

```bash
# Inicjalizacja nowego repozytorium
git init
git config user.name "Imię Nazwisko"
git config user.email "email@example.com"

# Klonowanie istniejącego repozytorium
git clone https://github.com/username/repository.git
cd repository
```

### Główne Gałęzie (Branches)

- **main** - Produkcja, zawiera stabilny kod
- **develop** - Gałąź deweloperska dla integracji features
- **feature/nazwa** - Nowe funkcjonalności
- **bugfix/nazwa** - Poprawy błędów
- **hotfix/nazwa** - Pilne poprawy produkcji

### Reguły Brancha Ochronnego (Branch Protection)

Na GitHub skonfiguruj:
- Wymagane recenzje pull requestów (minimum 2 osoby)
- Wymagane statusy CI/CD do przejścia
- Wymuszenie aktualności przed merge'em
- Status checks muszą przejść

### Konwencje Commitów

```
feat: Nowa funkcjonalność
fix: Naprawa błędu
docs: Aktualizacja dokumentacji
style: Formatowanie kodu
refactor: Reorganizacja kodu bez zmian funkcjonalnych
test: Dodanie testów
chore: Aktualizacje zależności
```

---

## Struktura Projektu i Zespół

### Organizacja Katalogów

```
project-root/
├── docs/                    # Dokumentacja projektu
├── src/
│   ├── backend/            # Kod serwera (API)
│   │   ├── routes/         # Ścieżki API
│   │   ├── controllers/    # Logika biznesowa
│   │   ├── models/         # Modele bazy danych
│   │   └── middleware/     # Middleware Express
│   ├── frontend/           # Aplikacja kliencka
│   │   ├── components/     # Komponenty React/Vue
│   │   ├── pages/          # Strony aplikacji
│   │   ├── services/       # Serwisy API
│   │   └── styles/         # Stylizacja CSS
│   └── shared/             # Wspólne utilities
├── tests/                  # Testy jednostkowe i integracyjne
├── .github/workflows/      # Automacja CI/CD
├── .env.example            # Szablon zmiennych środowiskowych
├── .gitignore              # Reguły ignorowania Git
├── README.md               # Opis projektu
└── package.json            # Dependencje Node.js
```

### Role i Odpowiedzialności Zespołu

| Rola | Odpowiedzialność |
|------|------------------|
| **Project Manager** | Koordynacja sprintów, zarządzanie priorytetami, komunikacja |
| **Backend Developers** | API endpoints, baza danych, autentykacja, bezpieczeństwo |
| **Frontend Developers** | Komponenty UI, state management, responsywność |
| **QA Engineers** | Testy, raportowanie bugów, weryfikacja fixes |

### Przepływ Pracy (Workflow)

1. **Tworzenie Issue'a** - Opisanie zadania/błędu w GitHub Issues
2. **Feature Branch** - Stwórz gałąź z `develop`: `git checkout -b feature/nazwa`
3. **Commitowanie** - Regularne commity: `git commit -m "feat: opis"`
4. **Push i Pull Request** - `git push origin feature/nazwa` + utwórz PR
5. **Code Review** - Czekaj na recenzje (minimum 2 osoby)
6. **Merge** - Po zatwierdzeniu, scal do `develop`

### Synchronizacja Danych

- **API Communication** - JSON format, RESTful endpoints
- **State Management** - Redux/Vuex dla globalnego stanu
- **Real-time Updates** - WebSockets dla live synchronizacji
- **Caching Strategy** - Lokalne cache'owanie z invalidacją
- **Error Handling** - Retry logic i fallback mechanizmy

---

## Implementacja Backend i Frontend

### Backend Setup

```bash
npm init -y
npm install express cors dotenv bcrypt jsonwebtoken
npm install --save-dev nodemon jest
```

### Podstawowy Express Server

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Obsługa błędów
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on :${PORT}`));
```

### Połączenie z Bazą Danych

```javascript
const sqlite3 = require('sqlite3').verbose();

function initDB() {
  const db = new sqlite3.Database('./data.db', (err) => {
    if (err) console.error('DB error:', err);
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  return db;
}
```

### Frontend - Komponenty Kluczowe

- **Layout Components** - Header, Footer, Navigation
- **Form Components** - Input, Button, Select, Textarea
- **Data Display** - Table, List, Card components
- **Modals & Dialogs** - Potwierdzenia i formularze
- **Error & Loading States** - Spinner, Error messages

### Uwierzytelnianie i Bezpieczeństwo

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Hash hasła
const hashedPassword = await bcrypt.hash(password, 10);

// Generowanie JWT tokenu
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Middleware weryfikacji
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
}
```

---

## Testowanie, CI/CD i Wdrożenie

### Testowanie Jednostkowe

```javascript
// Przykład z Jest
describe('User Service', () => {
  test('should create user', async () => {
    const user = await createUser({
      email: 'test@test.com',
      password: 'password123'
    });
    expect(user.email).toBe('test@test.com');
  });

  test('should validate email format', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('valid@email.com')).toBe(true);
  });
});
```

### CI/CD GitHub Actions

```yaml
# filepath: .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - run: npm install && npm run build
      - run: npm run deploy
```

### Wdrożenie (Deployment)

1. **Development** - Branch `develop`, automatycznie deployuj na staging
2. **Production** - Branch `main`, manualnie lub auto-deploy na prod
3. **Monitorowanie** - Logi, metryki wydajności, alerty
4. **Rollback Plan** - Procedura cofania zmian w razie problemu

### Checklist przed Release'em

- [ ] Wszystkie testy przechodzą
- [ ] Code review zatwierdzony
- [ ] Dokumentacja zaktualizowana
- [ ] Changelog uzupełniony
- [ ] Wersja bumped (semantic versioning)
- [ ] Manualne testy na staging

---

## Zarządzanie Wersjami i Dokumentacja

### Semantic Versioning

Nadawaj wersje w formacie: **MAJOR.MINOR.PATCH**

```
v1.2.3
│ │ └─ PATCH (bugfixes, patches)
│ └─── MINOR (new features, backwards compatible)
└───── MAJOR (breaking changes)
```

**Tagging:**
```bash
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

### Dokumentacja Projektu

**Struktura dokumentacji:**
- `README.md` - Opis, setup, quick start
- `CONTRIBUTING.md` - Wytyczne dla contributors
- `API.md` - Dokumentacja API endpoints
- `CHANGELOG.md` - Historia zmian
- `docs/` folder - Szczegółowa dokumentacja

**API Dokumentacja - Swagger/OpenAPI**

```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

### Changelog Format

```markdown
## [1.2.3] - 2025-01-26

### Added
- Nowa funkcjonalność X
- Nowy endpoint /api/resource

### Fixed
- Naprawiono błąd Y
- Poprawiono wydajność

### Changed
- Zaktualizowano zależności
- Refactoring modułu Z

### Removed
- Usunięto deprecated API endpoint
```

### Best Practices Zespołu

✅ **DO:**
- Dokumentuj kod zaraz po napisaniu
- Komunikuj się regularnie w zespole
- Robi code review dla wszystkich PR
- Testuj przed commit'em
- Utrzymuj czystą historię commitów

❌ **DON'T:**
- Nie commituj do `main` bezpośrednio
- Nie push'uj sekretów do repozytorium
- Nie ignoruj failing testów
- Nie merge'uj bez recenzji
- Nie commituj node_modules czy .env

---

**Ostatnia aktualizacja:** Styczeń 2026 | **Wersja:** 1.0