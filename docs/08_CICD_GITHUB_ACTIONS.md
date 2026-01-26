# 8. CI/CD - GitHub Actions

## Cel
Automatyczne budowanie, testowanie i wdrażanie projektu za pomocą GitHub Actions.

## 8.1 Tworzenie Workflow'u Build i Test

Utwórz `.github/workflows/build-test.yml`:

```yaml
name: Build and Test

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ develop, main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    name: Build and Test (.NET)
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0 # Pobierz całą historię dla SonarQube
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '7.0.x'
        cache: true
        cache-dependency-path: '**/packages.lock.json'
    
    - name: Restore dependencies
      run: dotnet restore
    
    - name: Check code style with StyleCop
      run: |
        dotnet build --configuration Release --no-restore \
          /p:EnforceCodeStyleInBuild=true \
          /p:TreatWarningsAsErrors=true
    
    - name: Build solution
      run: dotnet build --configuration Release --no-restore
    
    - name: Run unit tests
      run: dotnet test \
        --configuration Release \
        --no-build \
        --logger "trx;LogFileName=test-results.trx" \
        --collect:"XPlat Code Coverage" \
        -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=lcov
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: '**/TestResults/**'
    
    - name: Upload coverage reports
      uses: actions/upload-artifact@v3
      with:
        name: coverage-reports
        path: '**/coverage.lcov'
    
    - name: Publish test results
      if: always()
      uses: EnricoMi/publish-unit-test-result-action@v2
      with:
        files: '**/test-results.trx'
        check_name: Test Results
    
    - name: Create coverage report
      if: always()
      uses: codecov/codecov-action@v3
      with:
        files: '**/coverage.lcov'
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  codeql:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    
    strategy:
      fail-fast: false
      matrix:
        language: [ 'csharp' ]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: ${{ matrix.language }}
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '7.0.x'
    
    - name: Build
      run: dotnet build --configuration Release
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
```

## 8.2 Workflow Pull Request Checks

Utwórz `.github/workflows/pull-request-checks.yml`:

```yaml
name: Pull Request Checks

on:
  pull_request:
    branches: [ develop, main ]
    types: [ opened, synchronize, reopened ]

jobs:
  pr-validation:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Check PR title format
      uses: deepakputnam/action-pr-title@v1
      with:
        regex: '^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?!?:.+'
        message: 'PR title must follow Conventional Commits format'
    
    - name: Validate branch name
      run: |
        BRANCH_NAME=${{ github.head_ref }}
        if ! [[ $BRANCH_NAME =~ ^(feature|bugfix|hotfix|release)/ ]]; then
          echo "Branch name must start with feature/, bugfix/, hotfix/, or release/"
          exit 1
        fi
    
    - name: Check for merge conflicts markers
      run: |
        if grep -r "<<<<<<\|======\|>>>>>>" --include="*.cs" --include="*.json" .; then
          echo "Merge conflict markers found!"
          exit 1
        fi
    
    - name: Verify tests exist for changes
      run: |
        git diff --name-only origin/${{ github.base_ref }} | grep -E '\.cs$' | while read file; do
          if ! grep -q "Tests" <<< "$file"; then
            echo "Warning: Changes in $file - ensure tests are added"
          fi
        done

  enforce-labels:
    runs-on: ubuntu-latest
    
    steps:
    - name: Require labels
      uses: mheap/github-action-required-labels@v5
      with:
        labels: "type, priority"
        mode: exactly
        count: 2

  auto-approve:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    
    steps:
    - name: Approve dependabot PR
      uses: actions/github-script@v6
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          github.rest.pulls.createReview({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.issue.number,
            event: 'APPROVE'
          })
```

## 8.3 Workflow Merging na Develop

Utwórz `.github/workflows/merge-to-develop.yml`:

```yaml
name: Auto-Merge to Develop

on:
  pull_request:
    types: [closed]
    branches: [ develop, main ]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.event.pull_request.merged == true
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Configure git
      run: |
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
    
    - name: Sync develop branch
      run: |
        git fetch origin develop
        git checkout develop
        git pull origin develop
    
    - name: Create auto-release notes
      if: contains(github.event.pull_request.labels.*.name, 'release')
      uses: actions/github-script@v6
      with:
        script: |
          const { data: pullRequest } = await github.rest.pulls.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            pull_number: context.issue.number,
          });
          
          const releaseNotes = `## Changes in ${pullRequest.title}\n\n${pullRequest.body}`;
          console.log(releaseNotes);
    
    - name: Post merge comment
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '✅ Merged successfully! Changes are now in develop branch.'
          })
```

## 8.4 Workflow Deployment

Utwórz `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging-api.example.com
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '7.0.x'
    
    - name: Publish API
      run: |
        dotnet publish src/DistributedSync.API \
          -c Release \
          -o ./publish/api
    
    - name: Publish UI
      run: |
        dotnet publish src/DistributedSync.UI.Blazor \
          -c Release \
          -o ./publish/ui
    
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'distributed-sync-api'
        slot-name: 'staging'
        publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
        package: ./publish/api
    
    - name: Run smoke tests
      run: |
        curl -f https://staging-api.example.com/health || exit 1
    
    - name: Notify deployment
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '🚀 Deployed to staging: https://staging-api.example.com'
          })
      if: always()
```

## 8.5 Workflow Release Production

Utwórz `.github/workflows/release.yml`:

```yaml
name: Release to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Extract version from tag
      id: version
      run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '7.0.x'
    
    - name: Build release
      run: |
        dotnet build -c Release
        dotnet test -c Release --no-build
    
    - name: Publish artifacts
      run: |
        dotnet publish src/DistributedSync.API -c Release -o ./publish/api
        dotnet publish src/DistributedSync.UI.Blazor -c Release -o ./publish/ui
    
    - name: Create GitHub Release
      uses: softprops/action-gh-release@v1
      with:
        body: |
          ## Release ${{ steps.version.outputs.VERSION }}
          
          ### Features
          - Feature 1
          - Feature 2
          
          ### Fixes
          - Fixed issue with authentication
          - Improved sync performance
          
          ### Deployment
          - API: https://api.example.com
          - UI: https://app.example.com
        files: |
          publish/api/**
          publish/ui/**
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Deploy to production
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'distributed-sync-api'
        slot-name: 'production'
        publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE_PROD }}
        package: ./publish/api
    
    - name: Notify production deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        text: 'Production Deployment: ${{ steps.version.outputs.VERSION }}'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

## 8.6 Konfiguracja Secrets

Dodaj do GitHub Settings → Secrets and variables → Actions:

```
AZURE_PUBLISH_PROFILE=<publish_profile_xml>
AZURE_PUBLISH_PROFILE_PROD=<publish_profile_xml>
SONAR_TOKEN=<sonar_token>
SLACK_WEBHOOK=<slack_webhook_url>
```

## 8.7 Branch Protection Rules

Przejdź do Settings → Branches → Branch protection rules:

**Dla `main`:**
- Require pull request reviews before merging (2 people)
- Require approval of the most recent reviewable push
- Require status checks to pass before merging
  - build-test (Build and Test)
  - codeql
  - CodeQL / analyze
- Require branches to be up to date before merging
- Require code reviews from code owners
- Dismiss stale pull request approvals when new commits are pushed

**Dla `develop`:**
- Require pull request reviews before merging (1 person)
- Require status checks to pass before merging
- Dismiss stale pull request approvals when new commits are pushed

## 8.8 CODEOWNERS

Utwórz `.github/CODEOWNERS`:

```
# Domyślny właściciel
* @lead-developer

# Backend
src/DistributedSync.API/ @backend-team
src/DistributedSync.Data/ @backend-team
src/DistributedSync.Sync/ @backend-team

# Frontend
src/DistributedSync.UI.* @frontend-team

# Tests
tests/ @qa-team

# Documentation
docs/ @tech-lead
*.md @tech-lead
```

## 8.9 Monitoring CI/CD

### 8.9.1 Status Badge

Dodaj do `README.md`:

```markdown
![Build and Test](https://github.com/your-org/repo/workflows/Build%20and%20Test/badge.svg)
![Deploy](https://github.com/your-org/repo/workflows/Deploy%20to%20Staging/badge.svg)
![Release](https://github.com/your-org/repo/workflows/Release%20to%20Production/badge.svg)
[![codecov](https://codecov.io/gh/your-org/repo/branch/develop/graph/badge.svg)](https://codecov.io/gh/your-org/repo)
```

## 8.10 Troubleshooting

### Workflow Fails on Build

```yaml
# Dodaj debugging
- name: Debug information
  if: failure()
  run: |
    dotnet --version
    dotnet --list-sdks
    ls -la
```

### Secrets Not Found

```bash
# Weryfikuj secrets
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repo/actions/secrets
```

## Następne Kroki
→ Przejdź do [9. Zarządzanie wersjami](09_ZARZĄDZANIE_WERSJAMI.md)
