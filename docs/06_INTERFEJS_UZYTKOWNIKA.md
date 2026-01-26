# 6. Interfejs Użytkownika (UI)

## Cel
Stworzenie nowoczesnego interfejsu użytkownika w WPF lub ASP.NET Core Blazor z obsługą real-time komunikacji.

## 6.1 Wybór Platformy

### WPF (Windows Desktop)
- **Zaletę**: Desktopowa aplikacja, offline-first
- **Wady**: Tylko Windows, brak web support
- **Best for**: Corporate internal tools

### ASP.NET Core Blazor Server
- **Zaletę**: Web-based, cross-platform, real-time via SignalR
- **Wady**: Wymagany aktywny serwer
- **Best for**: Cloud-native applications

## Wybór: **Blazor Server** (bardziej nowoczesne, cross-platform)

## 6.2 Konfiguracja Blazor Server

### 6.2.1 Struktura Projektu

```
DistributedSync.UI.Blazor/
├── Pages/
│   ├── Index.razor
│   ├── Login.razor
│   ├── Register.razor
│   └── Resources.razor
├── Components/
│   ├── NavBar.razor
│   └── ResourceCard.razor
├── Services/
│   ├── ApiClient.cs
│   ├── AuthService.cs
│   └── SyncHubConnection.cs
├── Data/
│   └── Models/
├── wwwroot/
│   ├── css/
│   └── js/
├── App.razor
├── Program.cs
└── appsettings.json
```

### 6.2.2 Program.cs

Edytuj `src/DistributedSync.UI.Blazor/Program.cs`:

```csharp
using Microsoft.AspNetCore.Components.Authorization;
using DistributedSync.UI.Blazor.Services;

var builder = WebApplicationBuilder.CreateBuilder(args);

// Add Blazor components
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// HTTP Client
builder.Services.AddHttpClient<IApiClient, ApiClient>(client =>
{
    client.BaseAddress = new Uri("https://localhost:5000");
});

// Authentication
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthenticationStateProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISyncHubConnection, SyncHubConnection>();

// SignalR
builder.Services.AddScoped(sp =>
    new HubConnectionBuilder()
        .WithUrl(sp.GetRequiredService<NavigationManager>().ToAbsoluteUri("/hubs/sync"))
        .WithAutomaticReconnect()
        .Build());

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
```

## 6.3 Usługi UI

### 6.3.1 API Client

Utwórz `src/DistributedSync.UI.Blazor/Services/ApiClient.cs`:

```csharp
using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using DistributedSync.API.Models;

namespace DistributedSync.UI.Blazor.Services
{
    public interface IApiClient
    {
        Task<T> GetAsync<T>(string endpoint);
        Task<T> PostAsync<T>(string endpoint, object data);
        Task<T> PutAsync<T>(string endpoint, object data);
        Task DeleteAsync(string endpoint);
        void SetAuthToken(string token);
    }

    public class ApiClient : IApiClient
    {
        private readonly HttpClient _httpClient;

        public ApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<T> GetAsync<T>(string endpoint)
        {
            var response = await _httpClient.GetAsync(endpoint);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        public async Task<T> PostAsync<T>(string endpoint, object data)
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(endpoint, content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        public async Task<T> PutAsync<T>(string endpoint, object data)
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PutAsync(endpoint, content);
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }

        public async Task DeleteAsync(string endpoint)
        {
            var response = await _httpClient.DeleteAsync(endpoint);
            response.EnsureSuccessStatusCode();
        }

        public void SetAuthToken(string token)
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }
    }
}
```

### 6.3.2 Auth Service

Utwórz `src/DistributedSync.UI.Blazor/Services/AuthService.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Blazored.LocalStorage;
using DistributedSync.API.Models;

namespace DistributedSync.UI.Blazor.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(CreateUserDto createUserDto);
        Task<bool> LoginAsync(LoginDto loginDto);
        Task LogoutAsync();
        Task<string> GetTokenAsync();
        Task<UserDto> GetCurrentUserAsync();
    }

    public class AuthService : IAuthService
    {
        private readonly IApiClient _apiClient;
        private readonly ILocalStorageService _localStorageService;
        private const string TokenKey = "auth_token";

        public AuthService(IApiClient apiClient, ILocalStorageService localStorageService)
        {
            _apiClient = apiClient;
            _localStorageService = localStorageService;
        }

        public async Task<bool> RegisterAsync(CreateUserDto createUserDto)
        {
            try
            {
                var response = await _apiClient.PostAsync<AuthResponseDto>(
                    "/api/auth/register", createUserDto);

                await _localStorageService.SetItemAsync(TokenKey, response.Token);
                _apiClient.SetAuthToken(response.Token);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Registration failed: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> LoginAsync(LoginDto loginDto)
        {
            try
            {
                var response = await _apiClient.PostAsync<AuthResponseDto>(
                    "/api/auth/login", loginDto);

                await _localStorageService.SetItemAsync(TokenKey, response.Token);
                _apiClient.SetAuthToken(response.Token);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login failed: {ex.Message}");
                return false;
            }
        }

        public async Task LogoutAsync()
        {
            await _localStorageService.RemoveItemAsync(TokenKey);
            _apiClient.SetAuthToken(null);
        }

        public async Task<string> GetTokenAsync()
        {
            return await _localStorageService.GetItemAsync<string>(TokenKey);
        }

        public async Task<UserDto> GetCurrentUserAsync()
        {
            try
            {
                var token = await GetTokenAsync();
                if (string.IsNullOrEmpty(token))
                    return null;

                _apiClient.SetAuthToken(token);
                return await _apiClient.GetAsync<UserDto>("/api/users/me");
            }
            catch
            {
                return null;
            }
        }
    }
}
```

### 6.3.3 SignalR Hub Connection

Utwórz `src/DistributedSync.UI.Blazor/Services/SyncHubConnection.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR.Client;
using DistributedSync.API.Models;

namespace DistributedSync.UI.Blazor.Services
{
    public interface ISyncHubConnection
    {
        Task ConnectAsync();
        Task DisconnectAsync();
        Task JoinUserGroupAsync();
        Task NotifyResourceChangedAsync(ResourceChangeDto change);
        event EventHandler<ResourceChangeDto> OnResourceUpdated;
        bool IsConnected { get; }
    }

    public class SyncHubConnection : ISyncHubConnection
    {
        private readonly HubConnection _hubConnection;
        public event EventHandler<ResourceChangeDto> OnResourceUpdated;
        public bool IsConnected { get; private set; }

        public SyncHubConnection(NavigationManager navigationManager)
        {
            _hubConnection = new HubConnectionBuilder()
                .WithUrl(navigationManager.ToAbsoluteUri("/hubs/sync"))
                .WithAutomaticReconnect()
                .Build();

            _hubConnection.On<ResourceChangeDto>(
                "ResourceUpdated",
                resource => OnResourceUpdated?.Invoke(this, resource));
        }

        public async Task ConnectAsync()
        {
            try
            {
                await _hubConnection.StartAsync();
                IsConnected = true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"SignalR connection failed: {ex.Message}");
            }
        }

        public async Task DisconnectAsync()
        {
            if (_hubConnection?.State == HubConnectionState.Connected)
            {
                await _hubConnection.StopAsync();
                IsConnected = false;
            }
        }

        public async Task JoinUserGroupAsync()
        {
            if (IsConnected)
                await _hubConnection.InvokeAsync("JoinUserGroup");
        }

        public async Task NotifyResourceChangedAsync(ResourceChangeDto change)
        {
            if (IsConnected)
                await _hubConnection.InvokeAsync("NotifyResourceChanged", change);
        }
    }
}
```

## 6.4 Strony Blazor

### 6.4.1 Login Page

Utwórz `src/DistributedSync.UI.Blazor/Pages/Login.razor`:

```razor
@page "/login"
@using DistributedSync.API.Models
@inject IAuthService AuthService
@inject NavigationManager NavigationManager

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h3>Login</h3>
                </div>
                <div class="card-body">
                    <form @onsubmit="HandleLogin">
                        <div class="mb-3">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username"
                                @bind="loginDto.Username" required />
                        </div>

                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password"
                                @bind="loginDto.Password" required />
                        </div>

                        @if (!string.IsNullOrEmpty(errorMessage))
                        {
                            <div class="alert alert-danger">@errorMessage</div>
                        }

                        <button type="submit" class="btn btn-primary w-100">Login</button>
                    </form>

                    <p class="mt-3 text-center">
                        Don't have an account? <a href="/register">Register</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private LoginDto loginDto = new();
    private string errorMessage = string.Empty;

    private async Task HandleLogin()
    {
        try
        {
            var success = await AuthService.LoginAsync(loginDto);
            if (success)
            {
                NavigationManager.NavigateTo("/");
            }
            else
            {
                errorMessage = "Invalid username or password";
            }
        }
        catch (Exception ex)
        {
            errorMessage = $"Login error: {ex.Message}";
        }
    }
}
```

### 6.4.2 Register Page

Utwórz `src/DistributedSync.UI.Blazor/Pages/Register.razor`:

```razor
@page "/register"
@using DistributedSync.API.Models
@inject IAuthService AuthService
@inject NavigationManager NavigationManager

<div class="container mt-5">
    <div class="row justify-content-center">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h3>Register</h3>
                </div>
                <div class="card-body">
                    <form @onsubmit="HandleRegister">
                        <div class="mb-3">
                            <label for="username" class="form-label">Username</label>
                            <input type="text" class="form-control" id="username"
                                @bind="createUserDto.Username" required />
                        </div>

                        <div class="mb-3">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="email"
                                @bind="createUserDto.Email" required />
                        </div>

                        <div class="mb-3">
                            <label for="firstName" class="form-label">First Name</label>
                            <input type="text" class="form-control" id="firstName"
                                @bind="createUserDto.FirstName" />
                        </div>

                        <div class="mb-3">
                            <label for="lastName" class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="lastName"
                                @bind="createUserDto.LastName" />
                        </div>

                        <div class="mb-3">
                            <label for="password" class="form-label">Password</label>
                            <input type="password" class="form-control" id="password"
                                @bind="createUserDto.Password" required />
                        </div>

                        @if (!string.IsNullOrEmpty(errorMessage))
                        {
                            <div class="alert alert-danger">@errorMessage</div>
                        }

                        <button type="submit" class="btn btn-primary w-100">Register</button>
                    </form>

                    <p class="mt-3 text-center">
                        Already have an account? <a href="/login">Login</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

@code {
    private CreateUserDto createUserDto = new();
    private string errorMessage = string.Empty;

    private async Task HandleRegister()
    {
        try
        {
            var success = await AuthService.RegisterAsync(createUserDto);
            if (success)
            {
                NavigationManager.NavigateTo("/");
            }
            else
            {
                errorMessage = "Registration failed";
            }
        }
        catch (Exception ex)
        {
            errorMessage = $"Registration error: {ex.Message}";
        }
    }
}
```

### 6.4.3 Resources Page

Utwórz `src/DistributedSync.UI.Blazor/Pages/Resources.razor`:

```razor
@page "/resources"
@using DistributedSync.API.Models
@inject IApiClient ApiClient
@inject ISyncHubConnection SyncHubConnection

<div class="container mt-4">
    <div class="row">
        <div class="col">
            <h2>Resources</h2>
        </div>
        <div class="col text-end">
            <button class="btn btn-primary" @onclick="OpenCreateModal">
                <span class="oi oi-plus"></span> New Resource
            </button>
        </div>
    </div>

    @if (isLoading)
    {
        <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    }
    else if (resources == null || resources.Count == 0)
    {
        <div class="alert alert-info mt-3">No resources found</div>
    }
    else
    {
        <div class="row mt-4">
            @foreach (var resource in resources)
            {
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">@resource.Name</h5>
                            <p class="card-text">@resource.Description</p>
                            <p class="text-muted small">
                                Size: @(resource.Size / 1024) KB | Version: @resource.Version
                            </p>
                            <button class="btn btn-sm btn-warning" @onclick="() => EditResource(resource)">
                                Edit
                            </button>
                            <button class="btn btn-sm btn-danger" @onclick="() => DeleteResource(resource.Id)">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    }
</div>

@code {
    private List<ResourceDto> resources = new();
    private bool isLoading = true;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            // Pobierz zasoby użytkownika
            resources = new List<ResourceDto>(); // Placeholder
            
            // Połącz się z SignalR hub
            await SyncHubConnection.ConnectAsync();
            await SyncHubConnection.JoinUserGroupAsync();
            
            // Subskrybuj zmiany
            SyncHubConnection.OnResourceUpdated += OnResourceUpdated;
        }
        finally
        {
            isLoading = false;
        }
    }

    private void OnResourceUpdated(object sender, ResourceChangeDto change)
    {
        StateHasChanged();
    }

    private void OpenCreateModal()
    {
        // Otwórz modal do tworzenia zasobu
    }

    private void EditResource(ResourceDto resource)
    {
        // Otwórz modal do edycji zasobu
    }

    private async Task DeleteResource(Guid id)
    {
        if (await JS.InvokeAsync<bool>("confirm", "Are you sure?"))
        {
            try
            {
                await ApiClient.DeleteAsync($"/api/resources/{id}");
                resources.RemoveAll(r => r.Id == id);
            }
            catch (Exception ex)
            {
                // Obsłuż błąd
            }
        }
    }

    public void Dispose()
    {
        SyncHubConnection.OnResourceUpdated -= OnResourceUpdated;
    }
}
```

## 6.5 Komponenty Bootstrap

Utwórz `src/DistributedSync.UI.Blazor/appsettings.json`:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  },
  "ApiBaseUrl": "https://localhost:5000"
}
```

## 6.6 Zależności Blazor

Dodaj do `.csproj`:

```xml
<ItemGroup>
  <PackageReference Include="Blazored.LocalStorage" Version="4.4.0" />
  <PackageReference Include="Blazored.Modal" Version="7.1.0" />
  <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="7.0.0" />
</ItemGroup>
```

## Następne Kroki
→ Przejdź do [7. Testowanie](07_TESTOWANIE.md)
