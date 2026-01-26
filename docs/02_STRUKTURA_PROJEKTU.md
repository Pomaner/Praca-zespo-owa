# 2. Tworzenie Struktury Projektu

## Cel
Stworzenie trzech niezależnych projektów w jednej Visual Studio Solution z prawidłowymi referencjami i konfiguracją NuGet.

## 2.1 Przygotowanie Środowiska

### Wymagania
- Visual Studio 2022 (Community Edition wystarczy)
- .NET 7.0 lub wyższy SDK
- SQL Server Express (lub LocalDB)
- NuGet Package Manager

### Weryfikacja Instalacji

```bash
# Sprawdź wersję .NET
dotnet --version

# Listaż zainstalowanych SDK
dotnet --list-sdks

# Sprawdzenie SQL Server (jeśli zainstalowany)
sqllocaldb info
```

## 2.2 Tworzenie Solution

### Metoda 1: Wiersz Poleceń

```bash
# Utwórz folder projektu
mkdir DistributedSyncSystem
cd DistributedSyncSystem

# Utwórz pustą solucję
dotnet new sln -n DistributedSyncSystem

# Wynik
mkdir DistributedSyncSystem.sln
```

### Metoda 2: Visual Studio

1. Uruchom **Visual Studio 2022**
2. **File → New → Project...**
3. Szukaj **Blank Solution**
4. **Project name**: `DistributedSyncSystem`
5. **Location**: `C:\Users\roman\OneDrive\Documents\GitHub\Praca-zespo-owa`
6. Kliknij **Create**

## 2.3 Tworzenie Projektów

### 2.3.1 API Project (ASP.NET Core Web API)

```bash
# Klasa katalog solucji
cd DistributedSyncSystem

# Utwórz folder dla API
mkdir src/DistributedSync.API
cd src/DistributedSync.API

# Utwórz projekt Web API
dotnet new webapi -n DistributedSync.API --framework net7.0

# Wróć do korzenia
cd ../..

# Dodaj projekt do solucji
dotnet sln add src/DistributedSync.API/DistributedSync.API.csproj
```

**Struktura:**
```
DistributedSync.API/
├── Controllers/
├── Models/
├── Services/
├── appsettings.json
├── Program.cs
└── DistributedSync.API.csproj
```

### 2.3.2 Data Access Project (Class Library)

```bash
# Utwórz folder dla dostępu do danych
mkdir src/DistributedSync.Data
cd src/DistributedSync.Data

# Utwórz bibliotekę klas
dotnet new classlib -n DistributedSync.Data --framework net7.0

# Wróć do korzenia
cd ../..

# Dodaj projekt do solucji
dotnet sln add src/DistributedSync.Data/DistributedSync.Data.csproj
```

**Struktura:**
```
DistributedSync.Data/
├── Contexts/
├── Entities/
├── Migrations/
├── Repositories/
├── UnitOfWork/
└── DistributedSync.Data.csproj
```

### 2.3.3 Synchronization Module Project (Class Library)

```bash
# Utwórz folder dla modułu synchronizacji
mkdir src/DistributedSync.Sync
cd src/DistributedSync.Sync

# Utwórz bibliotekę klas
dotnet new classlib -n DistributedSync.Sync --framework net7.0

# Wróć do korzenia
cd ../..

# Dodaj projekt do solucji
dotnet sln add src/DistributedSync.Sync/DistributedSync.Sync.csproj
```

**Struktura:**
```
DistributedSync.Sync/
├── Services/
├── SignalR/
├── gRPC/
├── Queues/
├── ConflictDetection/
└── DistributedSync.Sync.csproj
```

### 2.3.4 UI Project (WPF lub Blazor)

#### Opcja A: WPF
```bash
mkdir src/DistributedSync.UI.WPF
cd src/DistributedSync.UI.WPF

dotnet new wpf -n DistributedSync.UI.WPF --framework net7.0-windows

cd ../..

dotnet sln add src/DistributedSync.UI.WPF/DistributedSync.UI.WPF.csproj
```

#### Opcja B: Blazor Server
```bash
mkdir src/DistributedSync.UI.Blazor
cd src/DistributedSync.UI.Blazor

dotnet new blazorserver -n DistributedSync.UI.Blazor --framework net7.0

cd ../..

dotnet sln add src/DistributedSync.UI.Blazor/DistributedSync.UI.Blazor.csproj
```

### 2.3.5 Tests Projects

```bash
# Unit Tests dla API
mkdir tests/DistributedSync.API.Tests
cd tests/DistributedSync.API.Tests

dotnet new xunit -n DistributedSync.API.Tests --framework net7.0

cd ../..

dotnet sln add tests/DistributedSync.API.Tests/DistributedSync.API.Tests.csproj

# Integration Tests dla Sync
mkdir tests/DistributedSync.Sync.Tests
cd tests/DistributedSync.Sync.Tests

dotnet new xunit -n DistributedSync.Sync.Tests --framework net7.0

cd ../..

dotnet sln add tests/DistributedSync.Sync.Tests/DistributedSync.Sync.Tests.csproj
```

## 2.4 Konfiguracja Referencji Między Projektami

### Diagram Zależności
```
DistributedSync.UI (WPF/Blazor)
    ↓
DistributedSync.API
    ↓
DistributedSync.Sync → DistributedSync.Data
    ↓
Database (SQL Server)
```

### Dodawanie Referencji

```bash
# API → Data
cd src/DistributedSync.API
dotnet add reference ../DistributedSync.Data/DistributedSync.Data.csproj
dotnet add reference ../DistributedSync.Sync/DistributedSync.Sync.csproj

# Sync → Data
cd ../DistributedSync.Sync
dotnet add reference ../DistributedSync.Data/DistributedSync.Data.csproj

# Tests → API & Sync
cd ../../tests/DistributedSync.API.Tests
dotnet add reference ../../src/DistributedSync.API/DistributedSync.API.csproj

cd ../DistributedSync.Sync.Tests
dotnet add reference ../../src/DistributedSync.Sync/DistributedSync.Sync.csproj
```

## 2.5 Konfiguracja NuGet

### Edycja Global.json (opcjonalnie)

Utwórz `global.json` w korzeniu solucji:

```json
{
  "sdk": {
    "version": "7.0.0",
    "rollForward": "feature"
  }
}
```

### Pakiety Wymagane

#### Projekt API
```bash
cd src/DistributedSync.API

# Entity Framework Core
dotnet add package Microsoft.EntityFrameworkCore --version 7.0.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 7.0.0
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 7.0.0

# JWT Authentication
dotnet add package System.IdentityModel.Tokens.Jwt --version 7.0.0
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 7.0.0

# Swagger/OpenAPI
dotnet add package Swashbuckle.AspNetCore --version 6.5.0

# SignalR
dotnet add package Microsoft.AspNetCore.SignalR --version 7.0.0

# Validation
dotnet add package FluentValidation --version 11.5.0
dotnet add package FluentValidation.DependencyInjectionExtensions --version 11.5.0

# Logging
dotnet add package Serilog --version 3.0.0
dotnet add package Serilog.AspNetCore --version 7.0.0
```

#### Projekt Data
```bash
cd ../DistributedSync.Data

# Entity Framework Core
dotnet add package Microsoft.EntityFrameworkCore --version 7.0.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 7.0.0
dotnet add package Microsoft.EntityFrameworkCore.Design --version 7.0.0

# Logging
dotnet add package Microsoft.Extensions.Logging.Abstractions --version 7.0.0
```

#### Projekt Sync
```bash
cd ../DistributedSync.Sync

# SignalR
dotnet add package Microsoft.AspNetCore.SignalR.Client --version 7.0.0

# gRPC
dotnet add package Grpc.AspNetCore --version 2.52.0
dotnet add package Google.Protobuf --version 3.22.0
dotnet add package Grpc.Tools --version 2.52.0

# Message Queue (RabbitMQ)
dotnet add package RabbitMQ.Client --version 6.4.0

# Newtonsoft.Json
dotnet add package Newtonsoft.Json --version 13.0.3

# Logging
dotnet add package Microsoft.Extensions.Logging --version 7.0.0
```

## 2.6 EditorConfig i Code Standards

### Tworzenie .editorconfig

Utwórz plik `.editorconfig` w korzeniu solucji:

```ini
# EditorConfig for C# projects
root = true

# All files
[*]
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true

# C# files
[*.cs]
indent_size = 4
indent_style = space
max_line_length = 120

# Code style rules (StyleCop Analyzers)
csharp_indent_case_contents = true
csharp_indent_switch_labels = true
csharp_space_after_cast = false
csharp_space_after_keywords_in_control_flow_statements = true

# Naming conventions
dotnet_naming_style.pascal_case_style.required_prefix = 
dotnet_naming_style.pascal_case_style.capitalization = pascal_case

# Classes, Interfaces, Properties
dotnet_naming_rule.class_interface_property_naming.severity = suggestion
dotnet_naming_rule.class_interface_property_naming.symbols = class_interface_property
dotnet_naming_rule.class_interface_property_naming.style = pascal_case_style

dotnet_naming_symbols.class_interface_property.applicable_kinds = class,interface,property
dotnet_naming_symbols.class_interface_property.applicable_accessibilities = *

# Local variables
dotnet_naming_rule.local_variable_naming.severity = suggestion
dotnet_naming_rule.local_variable_naming.symbols = local_variable
dotnet_naming_rule.local_variable_naming.style = camel_case_style

dotnet_naming_style.camel_case_style.capitalization = camel_case
dotnet_naming_symbols.local_variable.applicable_kinds = local,local_function
```

### Instalacja StyleCop

```bash
# Dodaj do każdego projektu C#
cd src/DistributedSync.API
dotnet add package StyleCop.Analyzers --version 1.2.0-beta.435

cd ../DistributedSync.Data
dotnet add package StyleCop.Analyzers --version 1.2.0-beta.435

cd ../DistributedSync.Sync
dotnet add package StyleCop.Analyzers --version 1.2.0-beta.435
```

Utwórz `.stylecop.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/DotNetAnalyzers/StyleCopAnalyzers/master/StyleCop.Analyzers/StyleCop.Analyzers/Settings/stylecop.schema.json",
  "settings": {
    "documentationRules": {
      "documentInternalElements": true,
      "companyName": "YourCompanyName"
    },
    "namingRules": {
      "allowCommonHungarianPrefixes": false
    }
  }
}
```

## 2.7 Struktura Finalna

```
DistributedSyncSystem/
├── .editorconfig
├── .gitignore
├── .stylecop.json
├── global.json
├── DistributedSyncSystem.sln
├── src/
│   ├── DistributedSync.API/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── Program.cs
│   │   └── DistributedSync.API.csproj
│   │
│   ├── DistributedSync.Data/
│   │   ├── Contexts/
│   │   ├── Entities/
│   │   ├── Migrations/
│   │   ├── Repositories/
│   │   └── DistributedSync.Data.csproj
│   │
│   ├── DistributedSync.Sync/
│   │   ├── Services/
│   │   ├── SignalR/
│   │   ├── gRPC/
│   │   ├── Queues/
│   │   └── DistributedSync.Sync.csproj
│   │
│   └── DistributedSync.UI.WPF/ (lub Blazor)
│       ├── Views/
│       ├── ViewModels/
│       └── DistributedSync.UI.csproj
│
├── tests/
│   ├── DistributedSync.API.Tests/
│   │   └── DistributedSync.API.Tests.csproj
│   └── DistributedSync.Sync.Tests/
│       └── DistributedSync.Sync.Tests.csproj
│
└── docs/
    └── (pliki dokumentacji)
```

## 2.8 Budowanie i Testowanie

```bash
# Przebuild całej solucji
dotnet build

# Uruchomienie testów
dotnet test

# Publikacja
dotnet publish src/DistributedSync.API -c Release -o ./publish/api
```

## 2.9 Konfiguracja Visual Studio

### Settings.json (dla VS Code)

Jeśli używasz VS Code, utwórz `.vscode/settings.json`:

```json
{
  "omnisharp.enableRoslynAnalyzers": true,
  "omnisharp.enableEditorConfigSupport": true,
  "files.exclude": {
    "**/bin": true,
    "**/obj": true
  },
  "dotnet.automaticallyUseLocalVersionSdkIfAvailable": true,
  "editor.formatOnSave": true,
  "[csharp]": {
    "editor.defaultFormatter": "ms-dotnettools.csharp",
    "editor.formatOnSave": true
  }
}
```

## Następne Kroki
→ Przejdź do [3. Zarządzanie pracą w zespole](03_ZARZĄDZANIE_ZESPOŁEM.md)
