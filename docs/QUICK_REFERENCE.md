# 🚀 Quick Reference Card

Szybka karta referencyjna dla rozproszonej aplikacji do synchronizacji danych.

---

## 🎯 Quick Links

| Potrzeba | Link |
|---------|------|
| **Zacznij tutaj** | [docs/README.md](README.md) |
| **Git setup** | [docs/01_INICJALIZACJA_GIT.md](01_INICJALIZACJA_GIT.md) |
| **Project setup** | [docs/02_STRUKTURA_PROJEKTU.md](02_STRUKTURA_PROJEKTU.md) |
| **Team workflow** | [docs/03_ZARZĄDZANIE_ZESPOŁEM.md](03_ZARZĄDZANIE_ZESPOŁEM.md) |
| **Backend** | [docs/04_IMPLEMENTACJA_BACKEND.md](04_IMPLEMENTACJA_BACKEND.md) |
| **Sync module** | [docs/05_SYNCHRONIZACJA_DANYCH.md](05_SYNCHRONIZACJA_DANYCH.md) |
| **UI/Frontend** | [docs/06_INTERFEJS_UZYTKOWNIKA.md](06_INTERFEJS_UZYTKOWNIKA.md) |
| **Testing** | [docs/07_TESTOWANIE.md](07_TESTOWANIE.md) |
| **CI/CD** | [docs/08_CICD_GITHUB_ACTIONS.md](08_CICD_GITHUB_ACTIONS.md) |
| **Releases** | [docs/09_ZARZĄDZANIE_WERSJAMI.md](09_ZARZĄDZANIE_WERSJAMI.md) |
| **Docs & API** | [docs/10_DOKUMENTACJA.md](10_DOKUMENTACJA.md) |
| **Full index** | [docs/INDEX.md](INDEX.md) |

---

## ⚡ Essential Commands

### Git
```bash
# Setup
git clone https://github.com/your-org/repo.git
git checkout develop

# Feature work
git checkout -b feature/my-feature
git add .
git commit -m "feat: description"
git push origin feature/my-feature

# Sync with develop
git fetch origin develop
git merge origin/develop
```

### .NET
```bash
# Restore & Build
dotnet restore
dotnet build

# Run
cd src/DistributedSync.API && dotnet run
cd src/DistributedSync.UI.Blazor && dotnet run

# Test
dotnet test
dotnet test /p:CollectCoverage=true

# Migrations
dotnet ef database update
dotnet ef migrations add NameOfMigration
```

### Docker (RabbitMQ)
```bash
# Start
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  rabbitmq:3.12-management

# Management
# http://localhost:15672 (guest:guest)

# Stop
docker stop rabbitmq
```

---

## 📁 Project Structure

```
DistributedSyncSystem/
├── src/
│   ├── DistributedSync.API/              # REST API
│   ├── DistributedSync.Data/             # EF Core & Repositories
│   ├── DistributedSync.Sync/             # SignalR, gRPC, RabbitMQ
│   └── DistributedSync.UI.Blazor/        # Web UI
├── tests/
│   ├── DistributedSync.API.Tests/        # Unit & Integration
│   └── DistributedSync.Sync.Tests/       # Sync module tests
├── docs/                                  # Documentation
├── .github/
│   └── workflows/                        # CI/CD workflows
├── .editorconfig
├── .gitignore
└── DistributedSyncSystem.sln
```

---

## 🔑 Key Ports

| Serwis | Port | URL |
|--------|------|-----|
| API | 5000 | https://localhost:5000 |
| Swagger | 5000 | https://localhost:5000/swagger |
| UI (Blazor) | 7000 | https://localhost:7000 |
| SQL Server | 1433 | localhost:1433 |
| RabbitMQ AMQP | 5672 | localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |

---

## 🔐 Authentication

```csharp
// Default JWT
SecretKey: "your-very-secret-key-at-least-32-characters-long"
Expiration: 24 hours (1440 minutes)

// Login request
POST /api/auth/login
{
  "username": "john_doe",
  "password": "SecurePassword123!"
}

// Response
{
  "token": "eyJhbGc...",
  "user": { ... }
}

// Use token
Authorization: Bearer eyJhbGc...
```

---

## 🧪 Testing

```bash
# Unit tests
dotnet test tests/DistributedSync.API.Tests

# Sync tests
dotnet test tests/DistributedSync.Sync.Tests

# With coverage
dotnet test /p:CollectCoverage=true

# Specific test
dotnet test --filter "FullyQualifiedName~AuthServiceTests"

# Watch mode
dotnet watch test
```

---

## 📊 Git Workflow

```
main (production)
  ├── v1.0.0 (tag)
  └── ← PR from release/v1.0.0

develop (integration)
  ├── feature/user-crud ← PR & merge
  ├── feature/sync-module ← PR & merge
  └── feature/ui-bootstrap ← PR & merge
```

**Konwencja commits:**
```
feat(scope): description      # New feature
fix(scope): description       # Bug fix
docs: description            # Documentation
refactor(scope): description # Code refactor
perf(scope): description     # Performance
test: description            # Tests
chore: description           # Maintenance
```

---

## 🌊 API Endpoints Summary

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
```

### Users
```
GET    /api/users/me
GET    /api/users/{id}
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Resources
```
GET    /api/resources
GET    /api/resources/{id}
POST   /api/resources
PUT    /api/resources/{id}
DELETE /api/resources/{id}
```

### SignalR
```
WebSocket: /hubs/sync
  • JoinUserGroup()
  • NotifyResourceChanged(change)
```

---

## 🔄 Development Cycle

```
1. FIND ISSUE
   → GitHub Issues

2. CREATE BRANCH
   git checkout -b feature/issue-name

3. IMPLEMENT
   → Write code
   → Write tests
   → Verify locally

4. COMMIT & PUSH
   git commit -m "feat: ..."
   git push origin feature/issue-name

5. PULL REQUEST
   → GitHub → Create PR
   → Describe changes
   → Link issue (#123)

6. CODE REVIEW
   → Wait for review
   → Address feedback
   → Push updates

7. CI/CD CHECKS
   → Tests pass ✓
   → Code quality ✓
   → Coverage > 75% ✓

8. MERGE
   → Maintainer merges to develop
   → Branch auto-deleted

9. DEPLOY
   → CI/CD deploys to staging
   → Manual approval for prod
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | Change port in appsettings.json |
| DB connection fails | Check SQL Server running, verify connection string |
| RabbitMQ error | Start Docker container, check port 5672 |
| CORS errors | Configure in Program.cs appsettings |
| Token invalid | Check JWT secret key, token expiration |
| Tests failing | Check DB setup, mock data, environment |

---

## 📋 Pre-Commit Checklist

Before pushing:
- [ ] Code compiles without errors
- [ ] All tests pass locally
- [ ] No console warnings/errors
- [ ] Code follows style guide
- [ ] Comments added for complex logic
- [ ] No secrets in code

---

## 🎓 Learning Path

**Beginner:**
1. Read 01_INICJALIZACJA_GIT.md
2. Read 02_STRUKTURA_PROJEKTU.md
3. Setup local environment
4. Run existing tests

**Intermediate:**
1. Read 04_IMPLEMENTACJA_BACKEND.md
2. Add a simple API endpoint
3. Write unit test for it
4. Create PR

**Advanced:**
1. Read 05_SYNCHRONIZACJA_DANYCH.md
2. Implement sync feature
3. Add integration test
4. Performance optimization

---

## 📞 Getting Help

```
ERROR: ____________
↓
Check docs/10_DOKUMENTACJA.md 
Troubleshooting section
↓
Search GitHub Issues
↓
Create new Issue with:
  • Description
  • Steps to reproduce
  • Error message / stacktrace
  • Environment (.NET version, OS)
```

---

## 🔗 Important Links

- **Repository**: https://github.com/your-org/distributed-sync-system
- **Issues**: https://github.com/your-org/distributed-sync-system/issues
- **Docs**: https://github.com/your-org/distributed-sync-system/tree/develop/docs
- **API Swagger**: https://localhost:5000/swagger (local)
- **RabbitMQ UI**: http://localhost:15672 (local)

---

## 📊 Tech Stack

```
┌─────────────────────────────────────┐
│    Frontend: Blazor Server          │
│    Language: C# / HTML / CSS        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Backend: ASP.NET Core 7.0         │
│   Database: SQL Server / EF Core    │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
  ┌───▼───────┐   ┌────▼────────┐
  │ SignalR   │   │ gRPC/RabbitMQ│
  │ Real-time │   │ Inter-node   │
  └───────────┘   └─────────────┘
```

---

## ⏱️ Common Tasks

| Task | Command/Link |
|------|-----|
| Start development | `dotnet run` in API & UI folders |
| Run tests | `dotnet test` |
| Create migration | `dotnet ef migrations add Name` |
| Apply migration | `dotnet ef database update` |
| View logs | Check `appsettings.Development.json` |
| Debug | F5 in Visual Studio |
| Push changes | `git push origin branch-name` |
| Create PR | GitHub web interface |

---

## 💡 Tips & Tricks

```csharp
// Async operations
await service.GetAsync();
await _repository.SaveChangesAsync();

// Error handling
try {
    // code
} catch (Exception ex) {
    _logger.LogError($"Error: {ex.Message}");
}

// Testing
[Fact]
public async Task Method_Condition_Expected() { }

// Dependency Injection
public Service(IRepository repo, ILogger logger) { }
```

---

## 📅 Important Dates

- **Project Started**: January 15, 2024
- **Documentation Complete**: January 17, 2024
- **Target Release**: TBD

---

**Print this card and keep it nearby! 📌**

For full details, see the complete documentation in `/docs` folder.

---

Version: 1.0  
Last Updated: 17 January 2024
