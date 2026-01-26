# 3. Zarządzanie Pracą w Zespole z Git

## Cel
Stworzenie struktury do efektywnej współpracy zespołowej z wykorzystaniem Git, issues i pull requests.

## 3.1 Tworzenie Issues w Repozytorium

### GitHub Issues Setup

1. Przejdź do repozytorium na GitHub
2. **Issues** tab → **New Issue**

### Szablon Issue

Utwórz `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Zgłoś znaleziony błąd
title: "[BUG] "
labels: bug
---

## Opis Błędu
Jasny i zwięzły opis problemu.

## Kroki do Reprodukcji
1. Przejdź na '...'
2. Kliknij na '...'
3. Scroll do '...'
4. Błąd: '...'

## Oczekiwane Zachowanie
Opis tego, co powinno się stać.

## Środowisko
- OS: [np. Windows 11]
- .NET Version: [np. 7.0]
- Przeglądarki: [np. Chrome 120]

## Dodatkowy Kontekst
```

Utwórz `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Zaproponuj nową funkcjonalność
title: "[FEATURE] "
labels: enhancement
---

## Opis Funkcji
Jasny opis nowej funkcji.

## Motywacja
Dlaczego ta funkcja jest potrzebna?

## Proponowane Rozwiązanie
Jak powinna działać?

## Alternatywy
Inne podejścia?
```

### Tworzenie Issues do Projektów

| ID | Zadanie | Zespół | Priorytet | Gałąź |
|---|---|---|---|---|
| #1 | Konfiguracja bazy danych (SQL Server) | Backend | High | `feature/database-setup` |
| #2 | Implementacja kontrolerów CRUD użytkowników | Backend | High | `feature/user-crud` |
| #3 | Implementacja JWT Authentication | Backend | High | `feature/jwt-auth` |
| #4 | Setup Swagger/OpenAPI | Backend | Medium | `feature/swagger-docs` |
| #5 | SignalR dla synchronizacji real-time | Sync | High | `feature/signalr-sync` |
| #6 | gRPC endpoints | Sync | Medium | `feature/grpc-sync` |
| #7 | RabbitMQ Message Queue | Sync | High | `feature/rabbitmq-queue` |
| #8 | Detekcja konfliktów synchronizacji | Sync | Medium | `feature/conflict-detection` |
| #9 | WPF/Blazor UI Bootstrap | Frontend | High | `feature/ui-bootstrap` |
| #10 | Formularze rejestracji i logowania | Frontend | High | `feature/auth-forms` |
| #11 | Unit Tests API | QA | High | `feature/api-tests` |
| #12 | Integration Tests Sync | QA | Medium | `feature/sync-tests` |

## 3.2 Workflow Git dla Zespołu

### Krok 1: Przypisanie Zadania

1. Członek zespołu wyznacza sobie issue
2. GitHub: **Issues → [Issue] → Assignees → Select yourself**
3. Zmień status na **In Progress**

### Krok 2: Tworzenie Feature Branch

```bash
# Pobierz najnowsze zmiany z develop
git checkout develop
git pull origin develop

# Utwórz nową feature branch
git checkout -b feature/user-crud

# Nazewnictwo:
# - feature/user-crud
# - bugfix/auth-token-leak
# - hotfix/critical-db-error
```

### Krok 3: Implementacja Funkcji

Przykład struktury commita:

```bash
# Inicjalna struktura
git add src/DistributedSync.Data/Entities/User.cs
git commit -m "feat: Add User entity model"

# Logika dostępu
git add src/DistributedSync.Data/Repositories/UserRepository.cs
git commit -m "feat: Implement UserRepository for CRUD operations"

# Kontroler API
git add src/DistributedSync.API/Controllers/UsersController.cs
git commit -m "feat: Add UsersController with GET, POST, PUT, DELETE endpoints"

# Testy
git add tests/DistributedSync.API.Tests/UsersControllerTests.cs
git commit -m "test: Add unit tests for UsersController"
```

### Krok 4: Konwencja Commit Messages

Wymaga konwencji **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Typy:**
- `feat`: Nowa funkcjonalność
- `fix`: Poprawka błędu
- `docs`: Dokumentacja
- `style`: Formatowanie kodu
- `refactor`: Refaktoryzacja kodu
- `perf`: Optymalizacja wydajności
- `test`: Dodanie testów
- `chore`: Zadania budowania, zależności

**Przykłady:**

```
feat(auth): implement JWT token generation

Added JWT token generation for user authentication.
Tokens expire after 24 hours and include user claims.

Closes #3

---

fix(sync): resolve data conflict detection issue

Fixed race condition in conflict resolution logic.
Now properly handles concurrent updates.

Closes #8

---

docs(readme): add installation instructions

Closes #15
```

### Krok 5: Regularny Push

```bash
# Upewnij się, że wszystkie zmiany są zacommitowane
git status

# Wyślij branch na serwer (pierwszy raz)
git push -u origin feature/user-crud

# Następne pushy
git push origin feature/user-crud
```

### Krok 6: Tworzenie Pull Request (PR)

1. Przejdź do repozytorium na GitHub
2. Kliknij **Pull requests → New pull request**
3. Ustaw:
   - **Base**: `develop`
   - **Compare**: `feature/user-crud`

4. Wypełnij szablon PR:

```markdown
## Opis
Krótki opis zmian w tym PR.

## Typ Zmiany
- [ ] Bug fix
- [x] Nowa funkcjonalność
- [ ] Breaking change
- [ ] Zmiana dokumentacji

## Jak to Testować?
Kroki do testowania:
1. Przejdź na '/register'
2. Wypełnij formularz
3. Kliknij 'Register'
4. ...

## Checklist
- [x] Kod następuje konwencje zespołu
- [x] Dodane/zaktualizowane testy
- [x] Dokumentacja zaktualizowana
- [x] Nie ma nowych warningów
- [x] Zmienia się tylko co zamierzone

## Odnośniki do Issues
Closes #2
```

### Krok 7: Code Review

#### Dla Recenzenta:

1. Przejrzyj kod:
   ```
   Files changed → Review each file
   ```

2. Dodaj komentarze:
   ```
   Click line number → Add comment
   ```

3. Zatwierdź lub żądaj zmian:
   ```
   Review changes → Approve / Request changes / Comment
   ```

#### Dla Autora:

```bash
# Zmień kod na podstawie feedback
git add .
git commit -m "refactor(auth): improve token validation per review feedback"
git push origin feature/user-crud

# PR automatycznie się aktualizuje
```

### Krok 8: Merge do Develop

1. Po zatwierdzeniu wszystkich reviewerów
2. Upewnij się, że automatyczne testy przeszły
3. Kliknij **Merge pull request**
4. Wybierz **Create a merge commit** (zachowuje historię)

```bash
# Lokalnie, zsynchronizuj develop
git checkout develop
git pull origin develop
```

## 3.3 Konfiguracja GitHub Actions (CI/CD)

Utwórz `.github/workflows/build-test.yml`:

```yaml
name: Build and Test

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '7.0.x'
    
    - name: Restore dependencies
      run: dotnet restore
    
    - name: Build
      run: dotnet build --no-restore --configuration Release
    
    - name: Run Tests
      run: dotnet test --no-build --verbosity normal --configuration Release
    
    - name: Code Analysis (optional)
      run: |
        dotnet add package StyleCop.Analyzers
        dotnet build /p:EnforceCodeStyleInBuild=true
```

## 3.4 Przywracanie Commitów (Jeśli Coś Pójdzie Nie Tak)

### Wycofanie Ostatniego Commita (Niewypchnięty)

```bash
# Wycofaj ostatni commit, ale zachowaj zmiany
git reset --soft HEAD~1

# Wycofaj ostatni commit i odrzuć zmiany
git reset --hard HEAD~1
```

### Cofnięcie Zmian w Konkretnym Pliku

```bash
git checkout origin/develop -- src/DistributedSync.API/Controllers/UsersController.cs
```

### Revert Mergniętego PR

```bash
# Znajdź commit merge
git log --oneline develop

# Revert
git revert -m 1 <merge-commit-hash>
git push origin develop
```

## 3.5 Lokalny Setup Dla Każdego Zespołu

### Backend Developer

```bash
git clone https://github.com/team/distributed-sync-system.git
cd distributed-sync-system
git checkout develop

# Zainstaluj zależności
dotnet restore

# Ustaw bazę danych (patrz sekcja 4)
cd src/DistributedSync.Data
dotnet ef database update

# Uruchom API
cd ../DistributedSync.API
dotnet run
# API dostępny na http://localhost:5000
```

### Frontend Developer

```bash
git clone https://github.com/team/distributed-sync-system.git
cd distributed-sync-system
git checkout develop

# WPF
cd src/DistributedSync.UI.WPF
dotnet restore
dotnet run

# lub Blazor
cd src/DistributedSync.UI.Blazor
dotnet restore
dotnet run
# UI dostępny na https://localhost:7000
```

### Sync Module Developer

```bash
git clone https://github.com/team/distributed-sync-system.git
cd distributed-sync-system
git checkout develop

cd src/DistributedSync.Sync
dotnet restore
dotnet test
```

## 3.6 Skanowanie Bezpieczeństwa (Opcjonalnie)

Dodaj do `.github/workflows/security.yml`:

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
```

## Checklist Podsumowujący

- [ ] Issue utworzony i przypisany
- [ ] Feature branch utworzony z nazw `feature/...`
- [ ] Kod zacommitowany z konwencją Conventional Commits
- [ ] Testy dodane/zaktualizowane
- [ ] PR utworzony z opisem
- [ ] Code review przeprowadzony
- [ ] Wszystkie testy (CI/CD) przeszły
- [ ] PR zmergowany do develop
- [ ] Feature branch usunięty

## Następne Kroki
→ Przejdź do [4. Implementacja backendu](04_IMPLEMENTACJA_BACKEND.md)
