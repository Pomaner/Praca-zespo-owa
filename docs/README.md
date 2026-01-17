# Dokumentacja - Distributed Sync System

Kompleksowa dokumentacja dla projektu rozproszonej aplikacji do synchronizacji danych z architekturą microservices.

## 📑 Spis Treści

### 🔧 Konfiguracja Projektu

1. **[Inicjalizacja Git](01_INICJALIZACJA_GIT.md)**
   - Utworzenie repozytorium GitHub/GitLab
   - Konfiguracja gałęzi (main, develop, feature)
   - Setup .gitignore dla projektu C#
   - Polityka ochrony gałęzi

2. **[Struktura Projektu](02_STRUKTURA_PROJEKTU.md)**
   - Tworzenie Visual Studio Solution
   - Projekty: API, Data Access, Sync Module, UI
   - Konfiguracja referencji między projektami
   - Setup NuGet i zależności (.NET 7.0)
   - EditorConfig i StyleCop

### 👥 Praca Zespołowa

3. **[Zarządzanie Pracą w Zespole](03_ZARZĄDZANIE_ZESPOŁEM.md)**
   - Tworzenie Issues i Pull Requests
   - Feature branch workflow
   - Conventional Commits format
   - Code Review proces
   - GitHub Actions dla CI/CD
   - Przywracanie commitów

### 🔨 Implementacja

4. **[Backend API](04_IMPLEMENTACJA_BACKEND.md)**
   - Entity Framework Core i baza SQL Server
   - Repository Pattern
   - Kontrolery CRUD (Users, Resources)
   - JWT Authentication
   - Swagger/OpenAPI dokumentacja
   - DTO models

5. **[Synchronizacja Danych](05_SYNCHRONIZACJA_DANYCH.md)**
   - SignalR dla real-time updates
   - gRPC dla inter-node communication
   - RabbitMQ message queue
   - Detekcja konfliktów
   - Rozwiązywanie konfliktów (Last-Write-Wins)

6. **[Interfejs Użytkownika](06_INTERFEJS_UZYTKOWNIKA.md)**
   - ASP.NET Core Blazor Server
   - Strony: Login, Register, Resources
   - WebSocket komunikacja
   - API Client service
   - Komponenty Bootstrap

### ✅ Testowanie

7. **[Testowanie](07_TESTOWANIE.md)**
   - Unit tests (xUnit, Moq, FluentAssertions)
   - Integration tests z In-Memory DB
   - E2E tests (Playwright)
   - Code coverage (75%+)
   - Test resultsreporting

### 🚀 Wdrażanie

8. **[CI/CD - GitHub Actions](08_CICD_GITHUB_ACTIONS.md)**
   - Build i Test workflow
   - Pull Request checks
   - Auto-merge na develop
   - Deployment na staging
   - Release do production
   - Branch protection rules

9. **[Zarządzanie Wersjami](09_ZARZĄDZANIE_WERSJAMI.md)**
   - Semantic Versioning (SemVer)
   - Release branches i hotfixes
   - CHANGELOG management
   - GitHub Releases
   - Docker image distribution
   - NuGet package publishing

10. **[Dokumentacja Projektu](10_DOKUMENTACJA.md)**
    - README.md
    - API Documentation
    - Installation Guide
    - Contributing Guide
    - Troubleshooting

---

## 🚀 Quick Start

### Dla Nowych Developerów

```bash
# 1. Clone repo
git clone https://github.com/your-org/distributed-sync-system.git
cd distributed-sync-system

# 2. Checkout develop
git checkout develop

# 3. Restore dependencies
dotnet restore

# 4. Setup database
cd src/DistributedSync.API
dotnet ef database update

# 5. Run API
dotnet run

# 6. Run UI (nowy terminal)
cd src/DistributedSync.UI.Blazor
dotnet run

# 7. Tests
cd tests/DistributedSync.API.Tests
dotnet test
```

### Dla Team Leads

- Przejrzyj [03_ZARZĄDZANIE_ZESPOŁEM.md](03_ZARZĄDZANIE_ZESPOŁEM.md) dla Git workflow
- Ustal branch protection rules: [08_CICD_GITHUB_ACTIONS.md](08_CICD_GITHUB_ACTIONS.md#86-branch-protection-rules)
- Przydziel issues zespołowi

### Dla QA

- Patrz [07_TESTOWANIE.md](07_TESTOWANIE.md) dla strategii testowania
- Uruchamiaj testy lokalnie przed PR
- Używaj API documentation: [10_DOKUMENTACJA.md](10_DOKUMENTACJA.md#api-documentation)

---

## 📊 Architektura Wysokiego Poziomu

```
┌───────────────────────────────────────────────────────────────┐
│                     Frontend (Blazor)                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Pages: Login, Register, Resources                       │ │
│  │ Services: ApiClient, AuthService, SyncHubConnection    │ │
│  │ URL: https://localhost:7000                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────┬─────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────────┐   ┌──────▼─────────┐
    │  HTTP REST   │   │  WebSocket     │
    │  API         │   │  (SignalR)     │
    └────┬─────────┘   └──────┬─────────┘
         │                     │
    ┌────▼─────────────────────▼─────────────────────┐
    │   Backend API (ASP.NET Core)                   │
    │   ┌──────────────────────────────────────────┐ │
    │   │ Controllers: Auth, Users, Resources      │ │
    │   │ Services: AuthService, SyncHubService   │ │
    │   │ Port: 5000                              │ │
    │   └──────────────────────────────────────────┘ │
    │   ┌──────────────────────────────────────────┐ │
    │   │ Data Layer (EF Core)                     │ │
    │   │ Repositories: IRepository<T>, IUserRepo  │ │
    │   └──────────────────────────────────────────┘ │
    │   ┌──────────────────────────────────────────┐ │
    │   │ Sync Module                              │ │
    │   │ • gRPC Service                           │ │
    │   │ • ConflictResolver                       │ │
    │   │ • RabbitMQ Client                        │ │
    │   └──────────────────────────────────────────┘ │
    └────┬──────────────────────────────┬────────────┘
         │                              │
    ┌────▼─────────┐           ┌───────▼────────┐
    │  SQL Server  │           │   RabbitMQ     │
    │  Database    │           │  Message Queue │
    │  Port: 1433  │           │  Port: 5672    │
    └──────────────┘           └────────────────┘
```

---

## 🔑 Key Technologies

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| **Backend** | ASP.NET Core | 7.0 |
| **Frontend** | Blazor Server | 7.0 |
| **Database** | SQL Server | 2019+ |
| **ORM** | Entity Framework Core | 7.0 |
| **Real-time** | SignalR | 7.0 |
| **RPC** | gRPC | 2.52 |
| **Queue** | RabbitMQ | 3.12 |
| **Auth** | JWT | - |
| **Testing** | xUnit | 2.4+ |
| **CI/CD** | GitHub Actions | - |

---

## 📈 Development Timeline

| Faza | Czas | Status |
|------|------|--------|
| **1. Setup** | Week 1 | ✅ |
| **2. Backend API** | Week 2-3 | 🔄 |
| **3. Sync Module** | Week 4 | 🔄 |
| **4. Frontend UI** | Week 5 | ⏳ |
| **5. Testing** | Week 6 | ⏳ |
| **6. CI/CD** | Week 7 | ⏳ |
| **7. Release v1.0** | Week 8 | ⏳ |

---

## 🔗 Ważne Linki

- **Repository**: https://github.com/your-org/distributed-sync-system
- **Issues**: https://github.com/your-org/distributed-sync-system/issues
- **Discussions**: https://github.com/your-org/distributed-sync-system/discussions
- **Wiki**: https://github.com/your-org/distributed-sync-system/wiki
- **API Docs**: https://api.example.com/swagger (after deploy)

---

## ❓ FAQ

**P: Jaka jest minimalna wersja .NET?**
O: .NET 7.0 SDK jest wymagany. Pobranie: https://dotnet.microsoft.com/download

**P: Mogę używać innej bazy danych?**
O: Tak, ale dokumentacja zakłada SQL Server. Zmień connection string i provider EF Core.

**P: Czy muszę instalować RabbitMQ?**
O: Nie dla development. Ale jest wymagany dla pełnej funkcjonalności synchronizacji.

**P: Jak uruchomić projekt w Visual Studio Code?**
O: Otwórz folder, zainstaluj C# extension, `dotnet restore`, `dotnet run`

**P: Gdzie znaleźć przykłady API calls?**
O: Patrz [10_DOKUMENTACJA.md - API Endpoints](10_DOKUMENTACJA.md#api-endpoints)

---

## 🤝 Wsparcie

- **Pytania**: Otwórz Issue na GitHub
- **Sugestie**: Dyskusje na GitHub Discussions
- **Błędy**: Report w Issues z stacktrace
- **Email**: support@example.com
- **Slack**: #distributed-sync-system (jeśli dostępny)

---

## 📝 Konwencje Projektu

### Naming
- **Classes/Interfaces**: `PascalCase` (e.g., `UserRepository`)
- **Methods**: `PascalCase` (e.g., `GetByIdAsync`)
- **Variables**: `camelCase` (e.g., `userId`)
- **Constants**: `UPPER_CASE` (e.g., `MAX_RETRIES`)

### Commits
```
feat: nowa funkcjonalność
fix: poprawka błędu
docs: dokumentacja
style: formatowanie
refactor: refaktoryzacja
perf: wydajność
test: testy
chore: maintenance
```

### Branches
```
feature/user-crud
bugfix/auth-issue
hotfix/critical-bug
release/v1.0.0
```

---

## 📄 Zmiana Logów (Log)

**v1.0.0** (17.01.2024)
- ✅ Kompletna dokumentacja
- ✅ Wszystkie 10 sekcji uzupełnione
- ✅ Code samples i konfiguracja
- ✅ Guidelines dla zespołu

---

**Last Updated**: 17 January 2024
**Maintained by**: @your-team
