# 4. Implementacja Backendu (API)

## Cel
Stworzenie REST API z Entity Framework Core, autentykacją JWT i dokumentacją Swagger.

## 4.1 Konfiguracja Bazy Danych

### 4.1.1 Tworzenie Entity Classes

Utwórz `src/DistributedSync.Data/Entities/User.cs`:

```csharp
using System;
using System.Collections.Generic;

namespace DistributedSync.Data.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? LastLogin { get; set; }

        public ICollection<Resource> Resources { get; set; } = new List<Resource>();
    }
}
```

Utwórz `src/DistributedSync.Data/Entities/Resource.cs`:

```csharp
using System;

namespace DistributedSync.Data.Entities
{
    public class Resource
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public byte[] Content { get; set; }
        public string ContentType { get; set; }
        public long Size { get; set; }
        public int Version { get; set; } = 1
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public string Checksum { get; set; } // Dla detekcji konfliktów

        public User User { get; set; }
    }
}
```

### 4.1.2 DbContext

Utwórz `src/DistributedSync.Data/Contexts/AppDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using DistributedSync.Data.Entities;

namespace DistributedSync.Data.Contexts
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Resource> Resources { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();

                entity.HasMany(e => e.Resources)
                    .WithOne(r => r.User)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Resource configuration
            modelBuilder.Entity<Resource>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.ContentType).HasMaxLength(100);
                entity.Property(e => e.Checksum).HasMaxLength(64);
                entity.HasIndex(e => new { e.UserId, e.Id });
            });
        }
    }
}
```

### 4.1.3 Konfiguracja Connection String

Edytuj `src/DistributedSync.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=DistributedSyncDb;Trusted_Connection=true;"
  },
  "Jwt": {
    "SecretKey": "your-very-secret-key-at-least-32-characters-long",
    "Issuer": "distributed-sync-api",
    "Audience": "distributed-sync-client",
    "ExpirationMinutes": 1440
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    }
  }
}
```

### 4.1.4 EF Core Migrations

```bash
cd src/DistributedSync.API

# Dodaj EF Core tools
dotnet tool install --global dotnet-ef

# Utwórz initial migration
dotnet ef migrations add InitialCreate --project ../DistributedSync.Data --startup-project .

# Zastosuj migrations
dotnet ef database update --project ../DistributedSync.Data

# Weryfikacja
# Baza danych powinna być widoczna w SQL Server Object Explorer
```

## 4.2 Implementacja Repository Pattern

Utwórz `src/DistributedSync.Data/Repositories/IRepository.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace DistributedSync.Data.Repositories
{
    public interface IRepository<T> where T : class
    {
        Task<T> GetByIdAsync(Guid id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
        Task AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);
        Task UpdateAsync(T entity);
        Task DeleteAsync(Guid id);
        Task DeleteAsync(T entity);
        Task SaveChangesAsync();
    }
}
```

Utwórz `src/DistributedSync.Data/Repositories/Repository.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace DistributedSync.Data.Repositories
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly AppDbContext Context;
        protected readonly DbSet<T> DbSet;

        public Repository(AppDbContext context)
        {
            Context = context;
            DbSet = context.Set<T>();
        }

        public async Task<T> GetByIdAsync(Guid id)
        {
            return await DbSet.FindAsync(id);
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await DbSet.ToListAsync();
        }

        public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await DbSet.Where(predicate).ToListAsync();
        }

        public async Task AddAsync(T entity)
        {
            await DbSet.AddAsync(entity);
        }

        public async Task AddRangeAsync(IEnumerable<T> entities)
        {
            await DbSet.AddRangeAsync(entities);
        }

        public async Task UpdateAsync(T entity)
        {
            DbSet.Update(entity);
            await SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await GetByIdAsync(id);
            if (entity != null)
            {
                DbSet.Remove(entity);
                await SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(T entity)
        {
            DbSet.Remove(entity);
            await SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await Context.SaveChangesAsync();
        }
    }
}
```

Utwórz `src/DistributedSync.Data/Repositories/UserRepository.cs`:

```csharp
using System.Threading.Tasks;
using DistributedSync.Data.Entities;

namespace DistributedSync.Data.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User> GetByUsernameAsync(string username);
        Task<User> GetByEmailAsync(string email);
    }

    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User> GetByUsernameAsync(string username)
        {
            var users = await FindAsync(u => u.Username == username);
            return users.FirstOrDefault();
        }

        public async Task<User> GetByEmailAsync(string email)
        {
            var users = await FindAsync(u => u.Email == email);
            return users.FirstOrDefault();
        }
    }
}
```

## 4.3 Implementacja DTOs

Utwórz `src/DistributedSync.API/Models/UserDto.cs`:

```csharp
using System;

namespace DistributedSync.API.Models
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
    }

    public class CreateUserDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }

    public class UpdateUserDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
    }

    public class LoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class AuthResponseDto
    {
        public string Token { get; set; }
        public UserDto User { get; set; }
    }
}
```

## 4.4 Konfiguracja JWT Authentication

Utwórz `src/DistributedSync.API/Services/AuthService.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;
using DistributedSync.API.Models;
using DistributedSync.Data.Entities;
using DistributedSync.Data.Repositories;

namespace DistributedSync.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(CreateUserDto createUserDto);
        Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
        string GenerateToken(User user);
    }

    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> RegisterAsync(CreateUserDto createUserDto)
        {
            // Sprawdzenie czy użytkownik już istnieje
            var existingUser = await _userRepository.GetByUsernameAsync(createUserDto.Username);
            if (existingUser != null)
                throw new InvalidOperationException("Username already exists");

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = createUserDto.Username,
                Email = createUserDto.Email,
                FirstName = createUserDto.FirstName,
                LastName = createUserDto.LastName,
                PasswordHash = HashPassword(createUserDto.Password),
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            var token = GenerateToken(user);
            return new AuthResponseDto
            {
                Token = token,
                User = MapToUserDto(user)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByUsernameAsync(loginDto.Username);
            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
                throw new InvalidOperationException("Invalid username or password");

            user.LastLogin = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            var token = GenerateToken(user);
            return new AuthResponseDto
            {
                Token = token,
                User = MapToUserDto(user)
            };
        }

        public string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<System.Security.Claims.Claim>
            {
                new(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(System.Security.Claims.ClaimTypes.Name, user.Username),
                new(System.Security.Claims.ClaimTypes.Email, user.Email)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.Parse(_configuration["Jwt:ExpirationMinutes"])),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private static bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput.Equals(hash);
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLogin = user.LastLogin
            };
        }
    }
}
```

## 4.5 Implementacja Kontrolerów API

Utwórz `src/DistributedSync.API/Controllers/AuthController.cs`:

```csharp
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using DistributedSync.API.Models;
using DistributedSync.API.Services;

namespace DistributedSync.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Rejestruje nowego użytkownika
        /// </summary>
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(CreateUserDto createUserDto)
        {
            try
            {
                var response = await _authService.RegisterAsync(createUserDto);
                return CreatedAtAction(nameof(Register), response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Loguje użytkownika i zwraca token JWT
        /// </summary>
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                var response = await _authService.LoginAsync(loginDto);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
        }
    }
}
```

Utwórz `src/DistributedSync.API/Controllers/UsersController.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DistributedSync.API.Models;
using DistributedSync.Data.Entities;
using DistributedSync.Data.Repositories;

namespace DistributedSync.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        /// <summary>
        /// Pobiera profil bieżącego użytkownika
        /// </summary>
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userId = new Guid(User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value ?? "");
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return NotFound("User not found");

            return Ok(MapToUserDto(user));
        }

        /// <summary>
        /// Pobiera wszystkich użytkowników (admin only)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users.Select(MapToUserDto));
        }

        /// <summary>
        /// Pobiera użytkownika po ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUserById(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            return Ok(MapToUserDto(user));
        }

        /// <summary>
        /// Aktualizuje profil użytkownika
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, UpdateUserDto updateUserDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound("User not found");

            user.FirstName = updateUserDto.FirstName ?? user.FirstName;
            user.LastName = updateUserDto.LastName ?? user.LastName;
            user.Email = updateUserDto.Email ?? user.Email;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateAsync(user);
            return Ok(new { message = "User updated successfully" });
        }

        /// <summary>
        /// Usuwa użytkownika
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            await _userRepository.DeleteAsync(id);
            return Ok(new { message = "User deleted successfully" });
        }

        private static UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                LastLogin = user.LastLogin
            };
        }
    }
}
```

## 4.6 Konfiguracja Program.cs

Edytuj `src/DistributedSync.API/Program.cs`:

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using DistributedSync.API.Services;
using DistributedSync.Data.Contexts;
using DistributedSync.Data.Repositories;

var builder = WebApplicationBuilder.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// Entity Framework
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Services
builder.Services.AddScoped<IAuthService, AuthService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Distributed Sync System API",
        Version = "v1",
        Description = "REST API dla rozproszonego systemu synchronizacji danych"
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "JWT Authentication",
        Description = "Wpisz JWT token",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    };

    options.AddSecurityDefinition("Bearer", securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, new[] { "Bearer" } }
    });
});

var app = builder.CreateBuilder();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

app.Run();
```

## 4.7 Testowanie API

### Zainstaluj Postman lub use VS Code REST Client

#### VS Code REST Client

Utwórz `api-tests.http`:

```http
### Register User
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

### Login
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePassword123!"
}

### Get Current User
GET http://localhost:5000/api/users/me
Authorization: Bearer {token_from_login}

### Get User by ID
GET http://localhost:5000/api/users/{userId}
Authorization: Bearer {token_from_login}

### Update User
PUT http://localhost:5000/api/users/{userId}
Content-Type: application/json
Authorization: Bearer {token_from_login}

{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com"
}
```

## Następne Kroki
→ Przejdź do [5. Moduł synchronizacji danych](05_SYNCHRONIZACJA_DANYCH.md)
