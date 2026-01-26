# 7. Testowanie

## Cel
Implementacja kompleksowych testów jednostkowych, integracyjnych i end-to-end.

## 7.1 Testy Jednostkowe API (xUnit)

### 7.1.1 Setup Projektu Testów

```bash
cd tests/DistributedSync.API.Tests

# Dodaj zależności
dotnet add package Moq
dotnet add package FluentAssertions
```

### 7.1.2 Testy Auth Service

Utwórz `tests/DistributedSync.API.Tests/Services/AuthServiceTests.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using DistributedSync.API.Models;
using DistributedSync.API.Services;
using DistributedSync.Data.Entities;
using DistributedSync.Data.Repositories;

namespace DistributedSync.API.Tests.Services
{
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockConfiguration = new Mock<IConfiguration>();

            // Mock JWT configuration
            _mockConfiguration
                .Setup(x => x["Jwt:SecretKey"])
                .Returns("your-very-secret-key-at-least-32-characters-long");
            _mockConfiguration
                .Setup(x => x["Jwt:Issuer"])
                .Returns("test-issuer");
            _mockConfiguration
                .Setup(x => x["Jwt:Audience"])
                .Returns("test-audience");
            _mockConfiguration
                .Setup(x => x["Jwt:ExpirationMinutes"])
                .Returns("60");

            _authService = new AuthService(_mockUserRepository.Object, _mockConfiguration.Object);
        }

        [Fact]
        public async Task RegisterAsync_WithValidData_ShouldCreateUser()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "User"
            };

            _mockUserRepository
                .Setup(x => x.GetByUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync((User)null);

            // Act
            var result = await _authService.RegisterAsync(createUserDto);

            // Assert
            result.Should().NotBeNull();
            result.Token.Should().NotBeNullOrEmpty();
            result.User.Should().NotBeNull();
            result.User.Username.Should().Be("testuser");

            _mockUserRepository.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
            _mockUserRepository.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WithDuplicateUsername_ShouldThrowException()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                Username = "existinguser",
                Email = "test@example.com",
                Password = "Password123!",
                FirstName = "Test",
                LastName = "User"
            };

            var existingUser = new User { Username = "existinguser" };
            _mockUserRepository
                .Setup(x => x.GetByUsernameAsync("existinguser"))
                .ReturnsAsync(existingUser);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.RegisterAsync(createUserDto));
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnToken()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Username = "testuser",
                Password = "Password123!"
            };

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = AuthService.HashPassword("Password123!")
            };

            _mockUserRepository
                .Setup(x => x.GetByUsernameAsync("testuser"))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.LoginAsync(loginDto);

            // Assert
            result.Should().NotBeNull();
            result.Token.Should().NotBeNullOrEmpty();
            result.User.Username.Should().Be("testuser");
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ShouldThrowException()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Username = "testuser",
                Password = "WrongPassword"
            };

            var user = new User
            {
                Username = "testuser",
                PasswordHash = AuthService.HashPassword("CorrectPassword")
            };

            _mockUserRepository
                .Setup(x => x.GetByUsernameAsync("testuser"))
                .ReturnsAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.LoginAsync(loginDto));
        }
    }
}
```

### 7.1.3 Testy Controllers

Utwórz `tests/DistributedSync.API.Tests/Controllers/UsersControllerTests.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using DistributedSync.API.Controllers;
using DistributedSync.API.Models;
using DistributedSync.Data.Entities;
using DistributedSync.Data.Repositories;

namespace DistributedSync.API.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly UsersController _controller;

        public UsersControllerTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _controller = new UsersController(_mockUserRepository.Object);
        }

        [Fact]
        public async Task GetUserById_WithValidId_ShouldReturnUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                FirstName = "Test",
                LastName = "User",
                IsActive = true
            };

            _mockUserRepository
                .Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            // Act
            var result = await _controller.GetUserById(userId);

            // Assert
            result.Should().NotBeNull();
            var okResult = result.Result as OkObjectResult;
            okResult.Should().NotBeNull();

            var returnedUser = okResult.Value as UserDto;
            returnedUser.Username.Should().Be("testuser");
        }

        [Fact]
        public async Task GetUserById_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mockUserRepository
                .Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync((User)null);

            // Act
            var result = await _controller.GetUserById(userId);

            // Assert
            result.Should().NotBeNull();
            var notFoundResult = result.Result as NotFoundObjectResult;
            notFoundResult.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateUser_WithValidData_ShouldUpdateSuccessfully()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User { Id = userId, FirstName = "Old", LastName = "Name" };
            var updateDto = new UpdateUserDto { FirstName = "New", LastName = "Name" };

            _mockUserRepository
                .Setup(x => x.GetByIdAsync(userId))
                .ReturnsAsync(user);

            // Act
            var result = await _controller.UpdateUser(userId, updateDto);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();
            okResult.StatusCode.Should().Be(200);

            _mockUserRepository.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.Once);
        }

        [Fact]
        public async Task DeleteUser_ShouldCallRepository()
        {
            // Arrange
            var userId = Guid.NewGuid();

            // Act
            var result = await _controller.DeleteUser(userId);

            // Assert
            var okResult = result as OkObjectResult;
            okResult.Should().NotBeNull();

            _mockUserRepository.Verify(x => x.DeleteAsync(userId), Times.Once);
        }
    }
}
```

## 7.2 Testy Integracyjne Synchronizacji

### 7.2.1 Setup Testów Integracyjnych

Utwórz `tests/DistributedSync.Sync.Tests/ConflictResolutionTests.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using DistributedSync.Sync.ConflictDetection;
using DistributedSync.Sync.gRPC;

namespace DistributedSync.Sync.Tests
{
    public class ConflictResolutionTests
    {
        private readonly Mock<ILogger<ConflictResolver>> _mockLogger;
        private readonly ConflictResolver _resolver;

        public ConflictResolutionTests()
        {
            _mockLogger = new Mock<ILogger<ConflictResolver>>();
            _resolver = new ConflictResolver(_mockLogger.Object);
        }

        [Fact]
        public async Task ResolveAsync_WhenRemoteIsNewer_ShouldUseRemoteVersion()
        {
            // Arrange
            var localVersion = new ResourceData
            {
                Id = "res-1",
                Name = "Resource 1",
                Version = 1,
                Timestamp = 1000
            };

            var remoteVersion = new ResourceData
            {
                Id = "res-1",
                Name = "Resource 1 Updated",
                Version = 2,
                Timestamp = 2000
            };

            // Act
            var result = await _resolver.ResolveAsync(localVersion, remoteVersion);

            // Assert
            result.Should().NotBeNull();
            result.Strategy.Should().Be("RemoteWins");
            result.Resource.Timestamp.Should().Be(2000);
        }

        [Fact]
        public async Task ResolveAsync_WhenLocalIsNewer_ShouldUseLocalVersion()
        {
            // Arrange
            var localVersion = new ResourceData
            {
                Id = "res-1",
                Name = "Resource 1 Updated",
                Version = 2,
                Timestamp = 2000
            };

            var remoteVersion = new ResourceData
            {
                Id = "res-1",
                Name = "Resource 1",
                Version = 1,
                Timestamp = 1000
            };

            // Act
            var result = await _resolver.ResolveAsync(localVersion, remoteVersion);

            // Assert
            result.Should().NotBeNull();
            result.Strategy.Should().Be("LocalWins");
            result.Resource.Timestamp.Should().Be(2000);
        }
    }
}
```

### 7.2.2 Testy Detektora Konfliktów

Utwórz `tests/DistributedSync.Sync.Tests/ConflictDetectorTests.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using DistributedSync.Sync.ConflictDetection;

namespace DistributedSync.Sync.Tests
{
    public class ConflictDetectorTests
    {
        private readonly Mock<ILogger<ConflictDetector>> _mockLogger;
        private readonly ConflictDetector _detector;

        public ConflictDetectorTests()
        {
            _mockLogger = new Mock<ILogger<ConflictDetector>>();
            _detector = new ConflictDetector(_mockLogger.Object);
        }

        [Fact]
        public async Task DetectConflictAsync_WithDifferentChecksums_ShouldReturnTrue()
        {
            // Arrange
            var checksum1 = "abc123";
            var checksum2 = "xyz789";

            // Act
            var result = await _detector.DetectConflictAsync(checksum1, checksum2);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task DetectConflictAsync_WithSameChecksums_ShouldReturnFalse()
        {
            // Arrange
            var checksum1 = "abc123";
            var checksum2 = "abc123";

            // Act
            var result = await _detector.DetectConflictAsync(checksum1, checksum2);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task DetectMultipleConflictsAsync_ShouldIdentifyAllConflicts()
        {
            // Arrange
            var localChecksums = new Dictionary<string, string>
            {
                { "res-1", "hash-1-local" },
                { "res-2", "hash-2-local" },
                { "res-3", "hash-3-local" }
            };

            var remoteChecksums = new Dictionary<string, string>
            {
                { "res-1", "hash-1-local" },    // No conflict
                { "res-2", "hash-2-remote" },   // Conflict
                { "res-3", "hash-3-local" }     // No conflict
            };

            // Act
            var conflicts = await _detector.DetectMultipleConflictsAsync(
                localChecksums, remoteChecksums);

            // Assert
            conflicts.Should().HaveCount(1);
            conflicts[0].ResourceId.Should().Be("res-2");
        }
    }
}
```

## 7.3 Testy Integracyjne API (In-Memory Database)

Utwórz `tests/DistributedSync.API.Tests/Integration/UserIntegrationTests.cs`:

```csharp
using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using DistributedSync.API.Models;
using DistributedSync.Data.Contexts;
using DistributedSync.Data.Entities;

namespace DistributedSync.API.Tests.Integration
{
    public class UserIntegrationTests : IAsyncLifetime
    {
        private readonly HttpClient _httpClient;
        private readonly AppDbContext _dbContext;

        public UserIntegrationTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _dbContext = new AppDbContext(options);
            _httpClient = new HttpClient { BaseAddress = new Uri("http://localhost:5000") };
        }

        public async Task InitializeAsync()
        {
            await _dbContext.Database.EnsureCreatedAsync();
        }

        public async Task DisposeAsync()
        {
            await _dbContext.Database.EnsureDeletedAsync();
            _dbContext.Dispose();
            _httpClient.Dispose();
        }

        [Fact]
        public async Task Register_WithValidData_ShouldCreateUser()
        {
            // Arrange
            var createUserDto = new CreateUserDto
            {
                Username = "newuser",
                Email = "newuser@example.com",
                Password = "SecurePass123!",
                FirstName = "New",
                LastName = "User"
            };

            var json = JsonSerializer.Serialize(createUserDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync("/api/auth/register", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<AuthResponseDto>(responseContent);

            result.Should().NotBeNull();
            result.Token.Should().NotBeNullOrEmpty();
            result.User.Username.Should().Be("newuser");
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldReturnToken()
        {
            // Arrange
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashed_password",
                FirstName = "Test",
                LastName = "User"
            };

            await _dbContext.Users.AddAsync(user);
            await _dbContext.SaveChangesAsync();

            var loginDto = new LoginDto
            {
                Username = "testuser",
                Password = "Password123!"
            };

            var json = JsonSerializer.Serialize(loginDto);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _httpClient.PostAsync("/api/auth/login", content);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
```

## 7.4 Konfiguracja Test Runner

### 7.4.1 Uruchamianie Testów

```bash
# Uruchom wszystkie testy
dotnet test

# Uruchom testy z pokryciem kodu
dotnet test /p:CollectCoverage=true /p:CoverageFormat=lcov

# Uruchom konkretny test
dotnet test --filter "FullyQualifiedName~AuthServiceTests"

# Uruchom z logami
dotnet test --logger "console;verbosity=detailed"
```

### 7.4.2 Plik xUnit Configuration

Utwórz `tests/xunit.runner.json`:

```json
{
  "$schema": "https://xunit.net/schema/current/xunit.runner.schema.json",
  "shadowCopy": false,
  "appDomain": "denied",
  "diagnosticMessages": false,
  "methodDisplay": "method",
  "parallelizeAssembly": true,
  "parallelizeTestCollections": true,
  "maxParallelThreads": 4,
  "preEnumerateTheories": true
}
```

## 7.5 Testy UI (Selenium/Playwright)

### 7.5.1 Setup Playwright

```bash
# Zainstaluj Playwright
dotnet add package Microsoft.Playwright
dotnet add package Microsoft.Playwright.NUnit
```

Utwórz `tests/DistributedSync.UI.Tests/LoginTests.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Xunit;
using Microsoft.Playwright;

namespace DistributedSync.UI.Tests
{
    public class LoginTests : IAsyncLifetime
    {
        private IPlaywright _playwright;
        private IBrowser _browser;
        private IPage _page;

        public async Task InitializeAsync()
        {
            _playwright = await Playwright.CreateAsync();
            _browser = await _playwright.Chromium.LaunchAsync();
            _page = await _browser.NewPageAsync();
        }

        public async Task DisposeAsync()
        {
            await _browser.CloseAsync();
            _playwright.Dispose();
        }

        [Fact]
        public async Task Login_WithValidCredentials_ShouldNavigateToHome()
        {
            // Arrange
            await _page.GotoAsync("https://localhost:7000/login");

            // Act
            await _page.FillAsync("input[id='username']", "testuser");
            await _page.FillAsync("input[id='password']", "Password123!");
            await _page.ClickAsync("button[type='submit']");

            // Assert
            await _page.WaitForURLAsync("https://localhost:7000/");
            Assert.Equal("https://localhost:7000/", _page.Url);
        }

        [Fact]
        public async Task Login_WithInvalidCredentials_ShouldShowError()
        {
            // Arrange
            await _page.GotoAsync("https://localhost:7000/login");

            // Act
            await _page.FillAsync("input[id='username']", "wronguser");
            await _page.FillAsync("input[id='password']", "wrongpassword");
            await _page.ClickAsync("button[type='submit']");

            // Assert
            var errorMessage = await _page.GetByRole("Alert").TextContentAsync();
            Assert.Contains("Invalid username or password", errorMessage);
        }

        [Fact]
        public async Task Register_ShouldCreateNewUser()
        {
            // Arrange
            await _page.GotoAsync("https://localhost:7000/register");

            // Act
            await _page.FillAsync("input[id='username']", "newuser");
            await _page.FillAsync("input[id='email']", "newuser@example.com");
            await _page.FillAsync("input[id='firstName']", "New");
            await _page.FillAsync("input[id='lastName']", "User");
            await _page.FillAsync("input[id='password']", "SecurePass123!");
            await _page.ClickAsync("button[type='submit']");

            // Assert
            await _page.WaitForURLAsync("https://localhost:7000/");
            Assert.Equal("https://localhost:7000/", _page.Url);
        }
    }
}
```

## 7.6 Code Coverage

Dodaj do `.csproj`:

```xml
<ItemGroup>
  <PackageReference Include="coverlet.collector" Version="6.0.0" />
  <PackageReference Include="coverlet.msbuild" Version="6.0.0" />
</ItemGroup>
```

Uruchom z pokryciem:

```bash
dotnet test /p:CollectCoverage=true /p:CoverageFormat=lcov /p:CoverageThreshold=75
```

## Następne Kroki
→ Przejdź do [8. CI/CD GitHub Actions](08_CICD_GITHUB_ACTIONS.md)
