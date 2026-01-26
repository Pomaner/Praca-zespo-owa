# 1. Inicjalizacja Projektu w Git

## Cel
Utworzenie repozytorium Git z podstawową strukturą gałęzi i konfiguracją dla zespołu.

## 1.1 Tworzenie Repozytorium

### GitHub
1. Przejdź na [github.com](https://github.com)
2. Kliknij **New Repository**
3. Zaznacz opcje:
   - **Repository name**: `distributed-sync-system`
   - **Description**: Rozproszona aplikacja do synchronizacji danych z architekturą microservices
   - **Public/Private**: Dostosuj do potrzeb
   - **Add .gitignore**: Wybierz **Visual Studio**
   - **Add a README file**: Zaznacz
4. Kliknij **Create repository**

### GitLab / Bitbucket
Analogicznie - przejdź do panelu tworzenia projektu i wypełnij dane.

## 1.2 Klonowanie Repozytorium

```bash
git clone https://github.com/twoj-uzytkownik/distributed-sync-system.git
cd distributed-sync-system
```

## 1.3 Konfiguracja Danych Użytkownika

```bash
git config --global user.name "Twoje Imię"
git config --global user.email "twoj.email@example.com"
```

## 1.4 Tworzenie Podstawowych Gałęzi

```bash
# Utwórz gałąź develop na bazie main
git checkout -b develop

# Wyślij gałąź na serwer
git push -u origin develop

# Utwórz gałąź feature (przykład)
git checkout -b feature/initial-setup

# Wróć na main
git checkout main
```

### Struktura gałęzi
```
main (produkcja)
  ├── develop (integracja)
  │   ├── feature/api-implementation
  │   ├── feature/sync-module
  │   ├── feature/ui-development
  │   └── bugfix/fix-database-issue
  └── release/v1.0.0
```

## 1.5 Konfiguracja .gitignore dla C#

Utwórz plik `.gitignore` w korzeniu repozytorium:

```gitignore
# Binarne pliki Visual Studio
*.exe
*.dll
*.pdb
bin/
obj/
.vs/

# User-specific files
*.suo
*.user
*.userosscache
*.sln.docstates

# Logi i tymczasowe pliki
logs/
*.log
*.log.*

# NuGet
*.nupkg
packages/
.nuget/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Bazy danych
*.mdf
*.ldf
*.db
*.sqlite
*.sqlite3

# Środowiskowe zmienne
.env
.env.local
appsettings.Development.json

# Artefakty kompilacji
dist/
build/
*.o
*.a

# Testowanie
TestResults/
coverage/
```

Weryfikacja:
```bash
git status
# Powinno pokazać tylko śledzone pliki
```

## 1.6 Polityka Gałęzi

### Konwencja Nazewnictwa
- `main` - produkcja (tylko stabilne releases)
- `develop` - główna linia rozwoju
- `feature/<feature-name>` - nowe funkcjonalności
- `bugfix/<bug-name>` - poprawki błędów
- `hotfix/<issue-name>` - nagłe poprawki na main
- `release/<version>` - przygotowanie wydania

### Reguły Ochrony Gałęzi

Na GitHub (Settings → Branches):
1. **main**
   - Wymagaj pull requestu
   - Wymagaj zatwierdzeń (1-2 osoby)
   - Automatyczne testy muszą przejść
   - Odrzuć merge do stale branches

2. **develop**
   - Wymagaj pull requestu
   - Wymagaj zatwierdzeń (1 osoba)
   - Automatyczne testy muszą przejść

## 1.7 Ustawienie Hook'ów Git (Opcjonalnie)

```bash
# Zainstaluj pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Sprawdź czy kod ma problemy
dotnet test --no-build
if [ $? -ne 0 ]; then
  echo "Testy nie przeszły. Commit anulowany."
  exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

## 1.8 Sprawdzenie Konfiguracji

```bash
# Wyświetl skonfigurowane gałęzie
git branch -a

# Sprawdź zdalny URL
git remote -v

# Wyświetl bieżącą gałąź i status
git status
```

Oczekiwany wynik:
```
On branch develop
Your branch is up to date with 'origin/develop'.

nothing to commit, working tree clean
```

## Następne Kroki
→ Przejdź do [2. Tworzenie struktury projektu](02_STRUKTURA_PROJEKTU.md)
