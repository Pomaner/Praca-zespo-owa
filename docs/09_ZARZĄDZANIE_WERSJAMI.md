# 9. Zarządzanie Wersjami i Release Management

## Cel
Systematyczne zarządzanie wersjami, tworzenie wydań i dokumentowanie zmian.

## 9.1 Semantic Versioning

Projekt powinien śledzić wersje używając **Semantic Versioning** (SemVer):

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

np. 1.2.3, 2.0.0-beta.1, 1.5.2+build.123
```

**Reguły:**
- **MAJOR**: Inkompatybilne zmiany API (v1 → v2)
- **MINOR**: Nowe funkcjonalności wstecznie kompatybilne (v1.0 → v1.1)
- **PATCH**: Poprawki błędów (v1.0.0 → v1.0.1)
- **Prerelease**: alpha, beta, rc (v1.0.0-rc.1)

## 9.2 Przygotowanie Release

### 9.2.1 Tworzenie Release Branch

```bash
# Utwórz gałąź release
git checkout -b release/v1.0.0 develop

# Na gałęzi release - bump wersje
# Edytuj src/DistributedSync.API/DistributedSync.API.csproj
```

Edytuj `.csproj` files:

```xml
<PropertyGroup>
  <TargetFramework>net7.0</TargetFramework>
  <Version>1.0.0</Version>
  <AssemblyVersion>1.0.0</AssemblyVersion>
  <FileVersion>1.0.0</FileVersion>
  <InformationalVersion>1.0.0</InformationalVersion>
</PropertyGroup>
```

### 9.2.2 Aktualizacja CHANGELOG

Utwórz `CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature in development

### Changed
- Pending changes

## [1.0.0] - 2024-01-15

### Added
- Initial release
- User authentication with JWT
- Resource management (CRUD operations)
- Real-time synchronization via SignalR
- gRPC inter-node communication
- RabbitMQ message queue integration
- Conflict detection and resolution
- Blazor Server UI with login/register
- Comprehensive unit tests
- API documentation with Swagger
- GitHub Actions CI/CD pipeline
- Code quality analysis with SonarCloud
- Security scanning with CodeQL

### Security
- Password hashing with SHA-256
- JWT token validation
- CORS configuration

## Format Template

### Added
- Nowe funkcjonalności

### Changed
- Zmiany w istniejących funkcjonalnościach

### Deprecated
- Funkcjonalności wkrótce do usunięcia

### Removed
- Usunięte funkcjonalności

### Fixed
- Poprawione błędy

### Security
- Zmiany bezpieczeństwa

[Unreleased]: https://github.com/your-org/repo/compare/v1.0.0...develop
[1.0.0]: https://github.com/your-org/repo/releases/tag/v1.0.0
```

### 9.2.3 Release Notes Template

Utwórz `docs/RELEASE_NOTES_TEMPLATE.md`:

```markdown
# Release Notes - Version X.Y.Z

**Release Date:** YYYY-MM-DD

## Overview
Krótki opis ogólny tego wydania.

## New Features ✨

### Feature 1
Opis feature 1 z użytkownika perspektywy.

**Example:**
```csharp
var newFeature = new Feature();
```

### Feature 2
Opis feature 2.

## Improvements 🚀

- Zwiększona wydajność synchronizacji o 20%
- Zmniejszone zużycie pamięci w module sync
- Lepsze obsługę błędów w API

## Bug Fixes 🐛

- Fixed authentication token expiration issue (#42)
- Resolved race condition in conflict detection (#55)
- Fixed UI crash when offline (#63)

## Breaking Changes ⚠️

- Zmieniony format JWT payload
- Usunięty endpoint `/api/old-resources`
- Wymagana migracja bazy danych

## Migration Guide

### Dla upgradu z v0.9.0:

1. Backup bazy danych:
```sql
BACKUP DATABASE DistributedSyncDb TO DISK = 'backup.bak'
```

2. Uruchom migration:
```bash
cd src/DistributedSync.API
dotnet ef database update
```

3. Restart API

## Performance Metrics

| Metrika | Przed | Po | Zmiana |
|---------|-------|-----|---------|
| Czas synchronizacji | 500ms | 400ms | -20% |
| Użycie RAM | 200MB | 150MB | -25% |
| Request/sec | 100 | 150 | +50% |

## Known Issues

- ⚠️ UI may freeze temporarily during large sync operations
- ⚠️ gRPC connection drops after 1 hour idle time

## Deprecations

Następujące funkcjonalności będą usunięte w v2.0.0:
- `LegacyAuthService` - use `JwtAuthService` instead
- `/api/v1/` endpoints - use `/api/` instead

## Thank You

Dziękujemy dla following contributors:
- @user1
- @user2
- @user3

## Download

- [Source code (zip)](https://github.com/org/repo/archive/v1.0.0.zip)
- [Source code (tar.gz)](https://github.com/org/repo/archive/v1.0.0.tar.gz)
```

### 9.2.4 Commits Release

```bash
# Commita zmiany na release branch
git add CHANGELOG.md src/
git commit -m "chore(release): prepare v1.0.0"
git push origin release/v1.0.0

# Stwórz PR do main
# https://github.com/org/repo/compare/main...release/v1.0.0

# Po przejrzeniu, merge do main
# Merge do develop
git checkout develop
git merge --no-ff release/v1.0.0
git push origin develop

# Wymaż release branch
git push origin --delete release/v1.0.0
git branch -d release/v1.0.0
```

## 9.3 Tagging i GitHub Release

### 9.3.1 Tworzenie Tag

```bash
# Utwórz annotated tag
git tag -a v1.0.0 -m "Release v1.0.0: Initial production release"

# Wyślij tag na serwer
git push origin v1.0.0

# Wyślij wszystkie tagi
git push origin --tags

# Sprawdzenie tagów
git tag -l
git show v1.0.0
```

### 9.3.2 GitHub Release UI

1. Przejdź do **Releases** na GitHub
2. Kliknij **Draft a new release**
3. Wybierz tag: `v1.0.0`
4. Tytuł: `Release v1.0.0`
5. Opis (wklej zawartość `RELEASE_NOTES_TEMPLATE.md`)
6. **Publish release**

### 9.3.3 Automatyczne Release via GitHub Actions

Workflow `release.yml` już tworzy release automatycznie. Dodaj do `.github/workflows/auto-release.yml`:

```yaml
name: Create Release Notes

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Generate release notes
      id: notes
      run: |
        VERSION=${GITHUB_REF#refs/tags/}
        PREVIOUS_TAG=$(git describe --tags --abbrev=0 ${GITHUB_REF}^ 2>/dev/null || echo "")
        
        echo "VERSION=$VERSION" >> $GITHUB_OUTPUT
        echo "PREVIOUS_TAG=$PREVIOUS_TAG" >> $GITHUB_OUTPUT
        
        # Generate changelog
        if [ -z "$PREVIOUS_TAG" ]; then
          CHANGELOG=$(git log --oneline | head -20)
        else
          CHANGELOG=$(git log --oneline ${PREVIOUS_TAG}..${GITHUB_REF})
        fi
        
        echo "CHANGELOG<<EOF" >> $GITHUB_OUTPUT
        echo "$CHANGELOG" >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        tag_name: ${{ steps.notes.outputs.VERSION }}
        body: |
          ## Release ${{ steps.notes.outputs.VERSION }}
          
          ### Changes
          ${{ steps.notes.outputs.CHANGELOG }}
          
          [Full Changelog](https://github.com/${{ github.repository }}/compare/${{ steps.notes.outputs.PREVIOUS_TAG }}...${{ steps.notes.outputs.VERSION }})
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 9.4 Hotfixes z Production

### 9.4.1 Tworzenie Hotfix Branch

```bash
# Utwórz hotfix branch z main
git checkout -b hotfix/v1.0.1 main
git pull origin main

# Napraw błąd
git add .
git commit -m "fix: critical authentication bug in login endpoint"

# Bump patch version
# Edytuj .csproj files: 1.0.0 → 1.0.1

git add .
git commit -m "chore: bump version to v1.0.1"

# Push
git push origin hotfix/v1.0.1
```

### 9.4.2 Merge Hotfix

```bash
# Stwórz PR do main
# Po approvals, merge

# Merge do develop
git checkout develop
git merge --no-ff hotfix/v1.0.1
git push origin develop

# Usuń hotfix branch
git push origin --delete hotfix/v1.0.1
```

## 9.5 Version Bumping Script

Utwórz `scripts/bump-version.ps1`:

```powershell
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Type
)

# Pobierz bieżącą wersję
$csprojFile = "src/DistributedSync.API/DistributedSync.API.csproj"
[xml]$xml = Get-Content $csprojFile

$currentVersion = $xml.Project.PropertyGroup.Version
Write-Host "Current version: $currentVersion"

# Parse wersja
$parts = $currentVersion.Split('.')
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

# Bump wersję
switch($Type) {
    'major' {
        $major++
        $minor = 0
        $patch = 0
    }
    'minor' {
        $minor++
        $patch = 0
    }
    'patch' {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Write-Host "New version: $newVersion"

# Update wszystkie .csproj files
Get-ChildItem -Recurse -Filter "*.csproj" -Path "src", "tests" | ForEach-Object {
    [xml]$xml = Get-Content $_.FullName
    $xml.Project.PropertyGroup.Version = $newVersion
    $xml.Project.PropertyGroup.AssemblyVersion = $newVersion
    $xml.Project.PropertyGroup.FileVersion = $newVersion
    $xml.Save($_.FullName)
    Write-Host "Updated: $($_.Name)"
}

# Update CHANGELOG.md
$changelog = Get-Content "CHANGELOG.md" -Raw
$newChangelog = $changelog -replace "## \[Unreleased\]", "## [Unreleased]`n`n## [$newVersion] - $(Get-Date -Format 'yyyy-MM-dd')"
Set-Content "CHANGELOG.md" $newChangelog

Write-Host "Version bump complete: $newVersion"
```

Użycie:

```bash
.\scripts\bump-version.ps1 -Type patch
```

## 9.6 Release Checklist

Przed wydaniem sprawdź:

- [ ] Wszystkie testy przechodzą
- [ ] Code review przeprowadzony
- [ ] CHANGELOG.md zaktualizowany
- [ ] Wersja w .csproj zaktualizowana
- [ ] README.md ma aktualną instrukcję instalacji
- [ ] API documentation (Swagger) zaktualizowana
- [ ] Nie ma open issues dla tej wersji
- [ ] Performance tests przechodzą
- [ ] Security scan (CodeQL) zakończony
- [ ] Coverage > 75%
- [ ] Release notes przygotowane
- [ ] Staging deployment successful

## 9.7 Distribution

### Nuget Package (dla bibliotek)

Utwórz `.github/workflows/nuget-publish.yml`:

```yaml
name: Publish to NuGet

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '7.0.x'
    
    - name: Build package
      run: dotnet pack src/DistributedSync.Data -c Release -o ./packages
    
    - name: Publish to NuGet
      run: dotnet nuget push ./packages/*.nupkg \
        --api-key ${{ secrets.NUGET_API_KEY }} \
        --source https://api.nuget.org/v3/index.json
```

### Docker Image (dla API)

Utwórz `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["src/DistributedSync.API/DistributedSync.API.csproj", "src/DistributedSync.API/"]
COPY ["src/DistributedSync.Data/DistributedSync.Data.csproj", "src/DistributedSync.Data/"]
COPY ["src/DistributedSync.Sync/DistributedSync.Sync.csproj", "src/DistributedSync.Sync/"]

RUN dotnet restore "src/DistributedSync.API/DistributedSync.API.csproj"

COPY . .
WORKDIR "/src/src/DistributedSync.API"
RUN dotnet build "DistributedSync.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "DistributedSync.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DistributedSync.API.dll"]
```

Publish:

```bash
docker build -t distributed-sync-api:1.0.0 .
docker tag distributed-sync-api:1.0.0 myregistry.azurecr.io/distributed-sync-api:1.0.0
docker push myregistry.azurecr.io/distributed-sync-api:1.0.0
```

## Następne Kroki
→ Przejdź do [10. Dokumentacja](10_DOKUMENTACJA.md)
