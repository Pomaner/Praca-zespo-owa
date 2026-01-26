# 10. Dokumentacja Projektu

## Cel
Kompleksowa dokumentacja dla zespołu i użytkowników końcowych.

## 10.1 README Główny

Utwórz `README.md` w korzeniu projektu:

```markdown
# Distributed Sync System

[![Build and Test](https://github.com/your-org/distributed-sync-system/workflows/Build%20and%20Test/badge.svg?branch=develop)](https://github.com/your-org/distributed-sync-system/actions?query=workflow%3A%22Build+and+Test%22)
[![Deploy](https://github.com/your-org/distributed-sync-system/workflows/Deploy%20to%20Staging/badge.svg)](https://github.com/your-org/distributed-sync-system/actions?query=workflow%3ADeploy)
[![codecov](https://codecov.io/gh/your-org/distributed-sync-system/branch/develop/graph/badge.svg)](https://codecov.io/gh/your-org/distributed-sync-system)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Rozproszona aplikacja do synchronizacji danych w czasie rzeczywistym z obsługą konfliktów, bezpieczną autentykacją JWT i nowoczesnym interfejsem web.

## 🌟 Cechy

- **Real-time Synchronization**: SignalR dla instant updates między klientami
- **Inter-Node Communication**: gRPC dla high-performance komunikacji między serwerami
- **Message Queue**: RabbitMQ dla asynchronicznego przetwarzania
- **Conflict Resolution**: Automatyczna detekcja i rozwiązywanie konfliktów danych
- **JWT Authentication**: Bezpieczna autentykacja z tokenami
- **Blazor Server UI**: Nowoczesny interfejs web
- **Comprehensive API**: REST API z dokumentacją Swagger
- **Test Coverage**: 75%+ coverage z unit, integration i E2E tests
- **CI/CD Pipeline**: Automatyczne budowanie, testowanie i wdrażanie
- **Code Quality**: SonarCloud analysis, CodeQL security scanning

## 📋 Wymagania

- **.NET 7.0 SDK** lub wyższy
- **SQL Server** (Express wystarczy) lub **LocalDB**
- **RabbitMQ** 3.8+
- **Visual Studio 2022** (opcjonalnie, VS Code też OK)

### Weryfikacja:
```bash
dotnet --version
# Output: 7.0.x

sqlcmd -S localhost -E -Q "SELECT @@VERSION"
# SQL Server zainstalowany

docker --version
# Dla RabbitMQ w kontenerze
```

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/distributed-sync-system.git
cd distributed-sync-system
git checkout develop
```

### 2. Zainstaluj Zależności

```bash
dotnet restore
```

### 3. Konfiguracja Bazy Danych

```bash
# Edytuj connection string w appsettings.json
# Domyślnie: (localdb)\\mssqllocaldb

cd src/DistributedSync.API
dotnet ef database update
```

### 4. Start RabbitMQ (Docker)

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.12-management

# Management Console: http://localhost:15672 (guest:guest)
```

### 5. Uruchom API

```bash
cd src/DistributedSync.API
dotnet run

# API dostępne: https://localhost:5000
# Swagger: https://localhost:5000/swagger
```

### 6. Uruchom UI (w nowym terminalu)

```bash
cd src/DistributedSync.UI.Blazor
dotnet run

# UI dostępne: https://localhost:7000
```

### 7. Przetestuj

```bash
# W innym terminalu
cd tests/DistributedSync.API.Tests
dotnet test

# Powinno pokazać: Passed X, Failed 0
```

## 📚 Dokumentacja

| Dokument | Opis |
|----------|------|
| [1. Inicjalizacja Git](docs/01_INICJALIZACJA_GIT.md) | Setup repozytorium i gałęzi |
| [2. Struktura Projektu](docs/02_STRUKTURA_PROJEKTU.md) | Tworzenie Visual Studio Solution |
| [3. Zarządzanie Zespołem](docs/03_ZARZĄDZANIE_ZESPOŁEM.md) | Git workflow i Pull Requests |
| [4. Backend API](docs/04_IMPLEMENTACJA_BACKEND.md) | REST API i Entity Framework Core |
| [5. Synchronizacja](docs/05_SYNCHRONIZACJA_DANYCH.md) | SignalR, gRPC, RabbitMQ |
| [6. Interfejs UI](docs/06_INTERFEJS_UZYTKOWNIKA.md) | Blazor Server application |
| [7. Testowanie](docs/07_TESTOWANIE.md) | Unit, Integration, E2E tests |
| [8. CI/CD](docs/08_CICD_GITHUB_ACTIONS.md) | GitHub Actions workflows |
| [9. Release Management](docs/09_ZARZĄDZANIE_WERSJAMI.md) | Versioning i deployment |
| [10. Dokumentacja](docs/10_DOKUMENTACJA.md) | API docs, guides |

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser                          │
│            (Blazor Server - https://localhost:7000)     │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴──────────────┐
          │                           │
    ┌─────▼──────┐          ┌────────▼──────┐
    │   HTTP     │          │   WebSocket   │
    │ REST API   │          │   SignalR     │
    └─────┬──────┘          └────────┬──────┘
          │                          │
    ┌─────▼──────────────────────────▼──────┐
    │   ASP.NET Core API                     │
    │   DistributedSync.API                  │
    │   (https://localhost:5000)             │
    └─────┬────────────┬──────────────────────┘
          │            │
    ┌─────▼──────┐  ┌──▼──────────────────┐
    │  EF Core   │  │ Sync Module         │
    │  + SQL     │  │ • SignalR Hub       │
    │  Server    │  │ • gRPC Service      │
    │            │  │ • RabbitMQ Client   │
    └──────────────┘  └──────────┬──────────┘
                                 │
                         ┌───────▼──────────┐
                         │   RabbitMQ       │
                         │   Message Queue  │
                         │  (localhost:5672)│
                         └──────────────────┘
```

## 🔐 Bezpieczeństwo

- **JWT Tokens**: 24-hour expiration, HMAC-SHA256 signing
- **Password Hashing**: SHA-256 with salt
- **CORS**: Konfigurować dla produkcji
- **SQL Injection**: Chronione przez EF Core parameterized queries
- **Code Scanning**: GitHub CodeQL

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login and get JWT token
```

### Users
```
GET    /api/users/me             Get current user profile
GET    /api/users/{id}           Get user by ID
PUT    /api/users/{id}           Update user profile
DELETE /api/users/{id}           Delete user (admin)
```

### Resources
```
GET    /api/resources            Get all resources
GET    /api/resources/{id}       Get resource by ID
POST   /api/resources            Create new resource
PUT    /api/resources/{id}       Update resource
DELETE /api/resources/{id}       Delete resource
```

### Real-time (SignalR)
```
WebSocket /hubs/sync             Connect to sync hub
  - JoinUserGroup()              Subscribe to user's updates
  - NotifyResourceChanged()      Broadcast resource changes
```

## 🧪 Testing

```bash
# Unit tests
dotnet test tests/DistributedSync.API.Tests

# Integration tests
dotnet test tests/DistributedSync.Sync.Tests

# With coverage report
dotnet test /p:CollectCoverage=true /p:CoverageFormat=lcov

# Specific test
dotnet test --filter "FullyQualifiedName~AuthServiceTests"
```

## 📈 Performance

| Operacja | Czas | Throughput |
|----------|------|-----------|
| User Login | ~50ms | 100 req/sec |
| Resource Sync | ~200ms | 50 req/sec |
| Conflict Detection | ~10ms | 1000 ops/sec |
| gRPC Endpoint | ~5ms | 2000 req/sec |

## 🤝 Contributing

1. Fork repository
2. Checkout `develop` branch
3. Create feature branch: `git checkout -b feature/new-feature`
4. Commit using conventional commits: `git commit -m "feat: add new feature"`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request to `develop`
7. Wait for reviews i CI/CD checks

## 📝 Commit Convention

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (formatting)
refactor: Code refactoring
perf:     Performance improvement
test:     Adding tests
chore:    Build, deps, tools
```

Example:
```bash
git commit -m "feat(auth): add two-factor authentication

- Implement TOTP-based 2FA
- Add backup codes
- Update login flow

Closes #42"
```

## 🐛 Issue Reporting

Kiedy raportujesz błąd, podaj:
- Opis problemu
- Kroki reprodukcji
- Oczekiwane zachowanie
- Rzeczywiste zachowanie
- Środowisko (.NET version, OS, browser)
- Stacktrace (jeśli dostępny)

## 📦 Deployment

### Staging
```bash
git push origin develop
# GitHub Actions auto-deploys to staging
```

### Production
```bash
# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actions:
# 1. Builds and tests
# 2. Creates GitHub Release
# 3. Pushes Docker image
# 4. Deploys to production
```

## 🔧 Configuration

### appsettings.json

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;..."
  },
  "Jwt": {
    "SecretKey": "your-secret-key-min-32-chars",
    "Issuer": "api-issuer",
    "Audience": "api-audience",
    "ExpirationMinutes": 1440
  },
  "RabbitMQ": {
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "guest",
    "Password": "guest"
  }
}
```

## 📞 Support

- **Issues**: https://github.com/your-org/distributed-sync-system/issues
- **Discussions**: https://github.com/your-org/distributed-sync-system/discussions
- **Wiki**: https://github.com/your-org/distributed-sync-system/wiki
- **Email**: support@example.com

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- .NET Foundation
- SignalR community
- RabbitMQ team
- Contributors

---

**Last Updated:** January 17, 2024
**Maintained by:** @your-team
```

## 10.2 API Documentation

Utwórz `docs/API.md`:

```markdown
# API Documentation

## Base URL

```
Development:  https://localhost:5000
Staging:      https://staging-api.example.com
Production:   https://api.example.com
```

## Authentication

Wszystkie endpoints (poza /auth) wymagają JWT token w header:

```
Authorization: Bearer <token>
```

### Get Token

**POST** `/api/auth/login`

Request:
```json
{
  "username": "john_doe",
  "password": "SecurePassword123!"
}
```

Response (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-01-17T14:25:00Z"
  }
}
```

## Resources Endpoints

### List Resources

**GET** `/api/resources`

Query Parameters:
- `page` (int, default: 1)
- `pageSize` (int, default: 10)
- `sortBy` (string, default: "createdAt")
- `sortOrder` (string, values: "asc", "desc")

Response (200 OK):
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Important Document",
      "description": "My important document",
      "size": 102400,
      "version": 1,
      "checksum": "abc123...",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T15:45:00Z"
    }
  ],
  "totalCount": 1,
  "page": 1,
  "pageSize": 10
}
```

### Get Resource

**GET** `/api/resources/{resourceId}`

Response (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Important Document",
  "description": "My important document",
  "contentType": "application/pdf",
  "size": 102400,
  "version": 1,
  "checksum": "abc123...",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T15:45:00Z"
}
```

### Create Resource

**POST** `/api/resources`

Request:
```json
{
  "name": "New Document",
  "description": "Document description",
  "contentType": "application/pdf"
}
```

Response (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "New Document",
  "description": "Document description",
  "version": 1,
  "createdAt": "2024-01-17T10:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": [
    {
      "field": "username",
      "message": "Username is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token or expired"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "traceId": "0HN1GHBOGR5QM:00000001"
}
```

## Rate Limiting

- **Limit**: 100 requests per minute per user
- **Header**: `X-RateLimit-Remaining`
- **Exceeded**: HTTP 429 Too Many Requests

## Examples

### Register and Login

```bash
# 1. Register
curl -X POST https://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "new@example.com",
    "password": "SecurePass123!",
    "firstName": "New",
    "lastName": "User"
  }'

# 2. Login
curl -X POST https://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "SecurePass123!"
  }'

# Save token from response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get Resources
curl -X GET https://localhost:5000/api/resources \
  -H "Authorization: Bearer $TOKEN"
```

See [Swagger UI](https://localhost:5000/swagger) for interactive documentation.
```

## 10.3 Installation Guide

Utwórz `docs/INSTALLATION.md`:

```markdown
# Installation Guide

## Prerequisites

- Windows 10/11 or Linux/macOS
- .NET 7.0 SDK (https://dotnet.microsoft.com/download)
- SQL Server Express (https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- Git (https://git-scm.com/)
- Docker (optional, for RabbitMQ)

## Step 1: Install .NET SDK

```bash
# Verify installation
dotnet --version
# Output should be 7.0.x or higher
```

## Step 2: Install SQL Server

### Option A: SQL Server Express (Recommended)
1. Download from: https://www.microsoft.com/en-us/sql-server/sql-server-2022-express
2. Run installer
3. Choose: Express Edition
4. Accept defaults

### Option B: LocalDB
```bash
# Already included with Visual Studio
sqllocaldb start mssqllocaldb
```

### Option C: Docker
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 \
  mcr.microsoft.com/mssql/server:2022-latest
```

## Step 3: Clone Repository

```bash
git clone https://github.com/your-org/distributed-sync-system.git
cd distributed-sync-system
```

## Step 4: Restore Dependencies

```bash
dotnet restore
```

## Step 5: Configure Database

Edit `src/DistributedSync.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=DistributedSyncDb;Trusted_Connection=true;"
  }
}
```

Examples:
- LocalDB: `(localdb)\\mssqllocaldb`
- Express: `COMPUTER_NAME\\SQLEXPRESS`
- Docker: `localhost,1433`

## Step 6: Create Database

```bash
cd src/DistributedSync.API
dotnet ef database update
```

## Step 7: Install RabbitMQ (Optional)

### Docker:
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.12-management
```

### or Direct Installation:
https://www.rabbitmq.com/download.html

## Step 8: Verify Installation

```bash
# Test API build
cd src/DistributedSync.API
dotnet build

# Run tests
cd ../../tests/DistributedSync.API.Tests
dotnet test
```

## Step 9: Start Application

Terminal 1 - API:
```bash
cd src/DistributedSync.API
dotnet run
```

Terminal 2 - UI:
```bash
cd src/DistributedSync.UI.Blazor
dotnet run
```

Terminal 3 - RabbitMQ (if Docker):
```bash
docker start rabbitmq
```

## Verification

- API: https://localhost:5000
- Swagger: https://localhost:5000/swagger
- UI: https://localhost:7000
- RabbitMQ Management: http://localhost:15672

All should be accessible!

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 5000 already in use | Change port in `appsettings.json` |
| DB connection fails | Check SQL Server is running, connection string |
| RabbitMQ connection error | Start RabbitMQ, check port 5672 |
| CORS errors | Check `appsettings.json` CORS settings |

## IDE Setup

### Visual Studio 2022
1. Open `DistributedSyncSystem.sln`
2. Build → Clean Solution
3. Build → Build Solution
4. Test Explorer → Run All Tests

### VS Code
1. Install C# extension
2. Open folder
3. `dotnet restore` in terminal
4. Debug → Run (or F5)
```

## 10.4 Contributing Guide

Utwórz `docs/CONTRIBUTING.md`:

```markdown
# Contributing Guide

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## How to Contribute

### 1. Find an Issue

- Check [Issues](https://github.com/your-org/distributed-sync-system/issues)
- Look for `good-first-issue` label for beginners
- Assign to yourself

### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Write Code

- Follow C# naming conventions
- Keep functions small and focused
- Add meaningful comments
- Write tests!

### 4. Commit with Convention

```bash
git commit -m "feat: description of what you added"
git commit -m "fix: description of bug fix"
git commit -m "docs: description of docs update"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create PR on GitHub.

### 6. Address Feedback

- Respond to code review comments
- Make requested changes
- Push updates (PR auto-updates)

### 7. Merge

Once approved, maintainers will merge to develop.

## Code Standards

- Use 4-space indentation
- Follow `PascalCase` for class/method names
- Use `camelCase` for variables
- Max line length: 120 characters
- Aim for 75%+ test coverage

## Testing Requirements

Every PR must include:
- Unit tests for new logic
- Integration tests for API changes
- Updated documentation

Run tests before pushing:
```bash
dotnet test
```

## Style Guide

See `.editorconfig` for automatic formatting.

Manual checks:
```bash
dotnet build /p:EnforceCodeStyleInBuild=true
```

## Documentation

Update relevant docs when making changes:
- README.md
- API.md
- Installation.md
- Inline code comments

## Need Help?

- Ask in Issues/Discussions
- Check existing documentation
- Reach out to maintainers
```

## 10.5 Troubleshooting Guide

Utwórz `docs/TROUBLESHOOTING.md`:

```markdown
# Troubleshooting Guide

## Common Issues

### 1. Build Failures

**Error**: "The target framework 'net7.0' is not installed"

**Solution**:
```bash
dotnet --version
# If not 7.0, install:
# https://dotnet.microsoft.com/download/dotnet/7.0
```

### 2. Database Connection

**Error**: "Cannot open database 'DistributedSyncDb'"

**Solution**:
```bash
# Check SQL Server is running
# Windows:
net start "SQL Server (SQLEXPRESS)"

# Verify connection string in appsettings.json
# Then run migrations:
dotnet ef database update
```

### 3. Port Already in Use

**Error**: "Address already in use port 5000"

**Solution**:
```bash
# Option 1: Change port in appsettings.json
"Kestrel": {
  "Endpoints": {
    "Http": { "Url": "http://localhost:5001" }
  }
}

# Option 2: Kill process using port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux:
lsof -i :5000
kill -9 <PID>
```

### 4. JWT Token Errors

**Error**: "Invalid token" or "Token expired"

**Solution**:
```json
// Check appsettings.json
"Jwt": {
  "SecretKey": "must-be-at-least-32-characters-long!",
  "ExpirationMinutes": 1440
}
```

### 5. RabbitMQ Connection

**Error**: "RabbitMQ connection failed"

**Solution**:
```bash
# Start RabbitMQ
docker start rabbitmq

# Or check if running:
docker ps | grep rabbitmq

# Check config in appsettings.json:
"RabbitMQ": {
  "HostName": "localhost",
  "Port": 5672
}
```

### 6. Test Failures

**Error**: "Multiple implementations of interface"

**Solution**:
- Ensure dependency injection is configured
- Check for duplicate registrations in Program.cs

**Error**: "Database already exists" (during testing)

**Solution**:
```csharp
// In test setup, use new DB name for each test:
var options = new DbContextOptionsBuilder<AppDbContext>()
  .UseInMemoryDatabase(Guid.NewGuid().ToString())
  .Options;
```

### 7. CORS Errors

**Error**: "Access-Control-Allow-Origin header missing"

**Solution**:
```csharp
// In Program.cs, ensure CORS is configured:
builder.Services.AddCors(options =>
{
  options.AddPolicy("AllowAll", builder =>
  {
    builder.AllowAnyOrigin()
           .AllowAnyMethod()
           .AllowAnyHeader();
  });
});

// And middleware order matters:
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
```

## Performance Issues

### High CPU Usage

Check for:
- Infinite loops
- Blocking synchronous calls
- Missing `.ConfigureAwait(false)`

### Memory Leaks

```bash
# Profile with dotnet-trace:
dotnet trace collect --duration 00:01:00 --output trace.nettrace

# Analyze with PerfView or dotTrace
```

### Slow Database Queries

```sql
-- Enable slow query logging
DBCC TRACEON (3604, 1222, -1);

-- Or use EF Core logging:
options.LogTo(Console.WriteLine);
```

## Getting Help

1. Check this guide
2. Search [Issues](https://github.com/your-org/distributed-sync-system/issues)
3. Ask in [Discussions](https://github.com/your-org/distributed-sync-system/discussions)
4. Contact: support@example.com
```

## Podsumowanie

Utworzyłem kompleksową dokumentację dla systemu rozproszonej synchronizacji danych obejmującą:

1. **Inicjalizacja Git** - Setup repozytorium i gałęzi
2. **Struktura projektu** - Tworzenie Visual Studio Solution
3. **Zarządzanie zespołem** - Git workflow i Pull Requests
4. **Backend API** - REST API, JWT, Entity Framework
5. **Synchronizacja danych** - SignalR, gRPC, RabbitMQ
6. **Interfejs UI** - Blazor Server
7. **Testowanie** - Unit, Integration, E2E tests
8. **CI/CD** - GitHub Actions workflows
9. **Release management** - Versioning i deployment
10. **Dokumentacja** - README, API docs, guides

Wszystkie pliki znajdują się w folderze [docs/](docs/) w workspace.
