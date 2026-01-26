# 5. Moduł Synchronizacji Danych

## Cel
Implementacja real-time synchronizacji danych między węzłami przy użyciu SignalR, gRPC i RabbitMQ.

## 5.1 SignalR - Synchronizacja Real-Time

### 5.1.1 Konfiguracja SignalR w API

Edytuj `src/DistributedSync.API/Program.cs`:

```csharp
// Dodaj SignalR
builder.Services.AddSignalR();

// W middleware (przed app.MapControllers())
app.MapHub<SyncHub>("/hubs/sync");
```

### 5.1.2 Tworzenie SyncHub

Utwórz `src/DistributedSync.API/Hubs/SyncHub.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace DistributedSync.API.Hubs
{
    public class SyncHub : Hub
    {
        private readonly ILogger<SyncHub> _logger;

        public SyncHub(ILogger<SyncHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
            _logger.LogInformation($"Client {Context.ConnectionId} connected (User: {userId})");
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected (User: {userId})");
            
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Klient powiadamia o zmianach w zasobie
        /// </summary>
        public async Task NotifyResourceChanged(ResourceChangeDto change)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            _logger.LogInformation(
                $"Resource change notification: ResourceId={change.ResourceId}, Action={change.Action}");

            // Wyślij powiadomienie do wszystkich klientów w grupie użytkownika
            await Clients.Group(userId)
                .SendAsync("ResourceUpdated", change);

            // Wyślij do pozostałych węzłów synchronizacyjnych
            await Clients.AllExcept(Context.ConnectionId)
                .SendAsync("RemoteResourceUpdated", change);
        }

        /// <summary>
        /// Rejestracja użytkownika w grupie dla wieloplanetarnośćci
        /// </summary>
        public async Task JoinUserGroup()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation($"User {userId} joined group");
        }

        public async Task LeaveUserGroup()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
                _logger.LogInformation($"User {userId} left group");
            }
        }
    }
}
```

### 5.1.3 Resource Change DTO

Utwórz `src/DistributedSync.API/Models/ResourceChangeDto.cs`:

```csharp
using System;

namespace DistributedSync.API.Models
{
    public class ResourceChangeDto
    {
        public Guid ResourceId { get; set; }
        public Guid UserId { get; set; }
        public string Action { get; set; } // "Create", "Update", "Delete"
        public string ResourceName { get; set; }
        public string Checksum { get; set; }
        public int Version { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string SourceNodeId { get; set; }
    }
}
```

## 5.2 gRPC - Synchronizacja Inter-Node

### 5.2.1 Tworzenie gRPC Service

Utwórz `src/DistributedSync.Sync/gRPC/sync.proto`:

```protobuf
syntax = "proto3";

option csharp_namespace = "DistributedSync.Sync.gRPC";

package sync;

service SyncService {
  rpc SyncResources (SyncRequest) returns (SyncResponse);
  rpc GetResourceChecksum (GetChecksumRequest) returns (GetChecksumResponse);
  rpc ResolveConflict (ConflictResolutionRequest) returns (ConflictResolutionResponse);
}

message ResourceData {
  string id = 1;
  string userId = 2;
  string name = 3;
  string description = 4;
  bytes content = 5;
  int32 version = 6;
  string checksum = 7;
  int64 timestamp = 8;
}

message SyncRequest {
  string nodeId = 1;
  repeated ResourceData resources = 2;
}

message SyncResponse {
  bool success = 1;
  string message = 2;
  repeated ResourceData conflictedResources = 3;
}

message GetChecksumRequest {
  string resourceId = 1;
}

message GetChecksumResponse {
  string checksum = 1;
  int32 version = 2;
}

message ConflictResolutionRequest {
  string resourceId = 1;
  ResourceData localVersion = 2;
  ResourceData remoteVersion = 3;
}

message ConflictResolutionResponse {
  ResourceData resolvedVersion = 1;
  string resolutionStrategy = 2;
}
```

### 5.2.2 Implementacja gRPC Service

Utwórz `src/DistributedSync.Sync/Services/GrpcSyncService.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using Microsoft.Extensions.Logging;
using DistributedSync.Sync.gRPC;
using DistributedSync.Sync.ConflictDetection;

namespace DistributedSync.Sync.Services
{
    public class GrpcSyncService : SyncService.SyncServiceBase
    {
        private readonly ILogger<GrpcSyncService> _logger;
        private readonly IConflictResolver _conflictResolver;

        public GrpcSyncService(
            ILogger<GrpcSyncService> logger,
            IConflictResolver conflictResolver)
        {
            _logger = logger;
            _conflictResolver = conflictResolver;
        }

        public override async Task<SyncResponse> SyncResources(
            SyncRequest request,
            ServerCallContext context)
        {
            _logger.LogInformation(
                $"Sync request from node: {request.NodeId}, Resources count: {request.Resources.Count}");

            var conflictedResources = new List<ResourceData>();
            var response = new SyncResponse { Success = true };

            foreach (var resource in request.Resources)
            {
                try
                {
                    // Logika synchronizacji
                    var conflict = await CheckForConflict(resource);
                    
                    if (conflict != null)
                    {
                        conflictedResources.Add(conflict);
                    }
                    else
                    {
                        await ApplyResourceChange(resource);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error syncing resource {resource.Id}: {ex.Message}");
                    response.Success = false;
                    response.Message = ex.Message;
                }
            }

            conflictedResources.ForEach(r => response.ConflictedResources.Add(r));
            return response;
        }

        public override async Task<GetChecksumResponse> GetResourceChecksum(
            GetChecksumRequest request,
            ServerCallContext context)
        {
            _logger.LogInformation($"Checksum request for resource: {request.ResourceId}");

            // Implementacja pobierania checksum
            var checksum = await RetrieveResourceChecksum(request.ResourceId);
            
            return new GetChecksumResponse
            {
                Checksum = checksum.Hash,
                Version = checksum.Version
            };
        }

        public override async Task<ConflictResolutionResponse> ResolveConflict(
            ConflictResolutionRequest request,
            ServerCallContext context)
        {
            _logger.LogInformation(
                $"Resolving conflict for resource: {request.ResourceId}");

            var resolved = await _conflictResolver.ResolveAsync(
                request.LocalVersion,
                request.RemoteVersion);

            return new ConflictResolutionResponse
            {
                ResolvedVersion = resolved.Resource,
                ResolutionStrategy = resolved.Strategy
            };
        }

        private async Task<ResourceData> CheckForConflict(ResourceData resource)
        {
            // Logika detekcji konfliktów
            await Task.Delay(10); // Placeholder
            return null;
        }

        private async Task ApplyResourceChange(ResourceData resource)
        {
            // Logika aplikowania zmian
            _logger.LogInformation($"Applying resource change: {resource.Id}");
            await Task.Delay(10); // Placeholder
        }

        private async Task<(string Hash, int Version)> RetrieveResourceChecksum(string resourceId)
        {
            // Logika pobierania checksum
            await Task.Delay(10); // Placeholder
            return ("hash_placeholder", 1);
        }
    }
}
```

## 5.3 RabbitMQ - Message Queue

### 5.3.1 Setup RabbitMQ (Docker)

```bash
# Zainstaluj RabbitMQ lokalnie (Docker)
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.12-management

# Dostęp do Management Console
# URL: http://localhost:15672
# User: guest
# Password: guest
```

### 5.3.2 RabbitMQ Service

Utwórz `src/DistributedSync.Sync/Services/RabbitMqService.cs`:

```csharp
using System;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using DistributedSync.API.Models;

namespace DistributedSync.Sync.Services
{
    public interface IRabbitMqService
    {
        Task PublishResourceChangeAsync(ResourceChangeDto change);
        Task SubscribeToResourceChangesAsync(
            Func<ResourceChangeDto, Task> onMessageReceived);
        void Dispose();
    }

    public class RabbitMqService : IRabbitMqService, IDisposable
    {
        private const string ExchangeName = "sync.resources";
        private const string QueueName = "sync.resources.queue";
        private const string RoutingKey = "resource.*";

        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly ILogger<RabbitMqService> _logger;

        public RabbitMqService(ILogger<RabbitMqService> logger)
        {
            _logger = logger;

            var factory = new ConnectionFactory
            {
                HostName = "localhost",
                Port = 5672,
                UserName = "guest",
                Password = "guest"
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            // Deklaruj exchange i queue
            _channel.ExchangeDeclare(
                exchange: ExchangeName,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false);

            _channel.QueueDeclare(
                queue: QueueName,
                durable: true,
                exclusive: false,
                autoDelete: false);

            _channel.QueueBind(
                queue: QueueName,
                exchange: ExchangeName,
                routingKey: RoutingKey);

            _logger.LogInformation("RabbitMQ connection established");
        }

        public async Task PublishResourceChangeAsync(ResourceChangeDto change)
        {
            try
            {
                var message = JsonSerializer.Serialize(change);
                var body = Encoding.UTF8.GetBytes(message);

                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.ContentType = "application/json";

                var routingKey = $"resource.{change.Action.ToLower()}";
                
                _channel.BasicPublish(
                    exchange: ExchangeName,
                    routingKey: routingKey,
                    basicProperties: properties,
                    body: body);

                _logger.LogInformation(
                    $"Published resource change: {change.ResourceId}, Action: {change.Action}");

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error publishing to RabbitMQ: {ex.Message}");
                throw;
            }
        }

        public async Task SubscribeToResourceChangesAsync(
            Func<ResourceChangeDto, Task> onMessageReceived)
        {
            try
            {
                var consumer = new AsyncEventingBasicConsumer(_channel);

                consumer.Received += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);
                        var change = JsonSerializer.Deserialize<ResourceChangeDto>(message);

                        await onMessageReceived(change);

                        _channel.BasicAck(ea.DeliveryTag, false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error processing message: {ex.Message}");
                        _channel.BasicNack(ea.DeliveryTag, false, true);
                    }
                };

                _channel.BasicConsume(
                    queue: QueueName,
                    autoAck: false,
                    consumerTag: "sync-consumer",
                    consumer: consumer);

                _logger.LogInformation("Subscribed to resource changes");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error subscribing to RabbitMQ: {ex.Message}");
                throw;
            }
        }

        public void Dispose()
        {
            _channel?.Close();
            _channel?.Dispose();
            _connection?.Close();
            _connection?.Dispose();
        }
    }
}
```

## 5.4 Detekcja i Rozwiązywanie Konfliktów

### 5.4.1 Conflict Resolver

Utwórz `src/DistributedSync.Sync/ConflictDetection/IConflictResolver.cs`:

```csharp
using System;
using System.Threading.Tasks;
using DistributedSync.Sync.gRPC;

namespace DistributedSync.Sync.ConflictDetection
{
    public interface IConflictResolver
    {
        Task<ConflictResolution> ResolveAsync(
            ResourceData localVersion,
            ResourceData remoteVersion);
    }

    public class ConflictResolution
    {
        public ResourceData Resource { get; set; }
        public string Strategy { get; set; } // "LocalWins", "RemoteWins", "Merge"
    }
}
```

Utwórz `src/DistributedSync.Sync/ConflictDetection/ConflictResolver.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using DistributedSync.Sync.gRPC;

namespace DistributedSync.Sync.ConflictDetection
{
    public class ConflictResolver : IConflictResolver
    {
        private readonly ILogger<ConflictResolver> _logger;

        public ConflictResolver(ILogger<ConflictResolver> logger)
        {
            _logger = logger;
        }

        public async Task<ConflictResolution> ResolveAsync(
            ResourceData localVersion,
            ResourceData remoteVersion)
        {
            _logger.LogWarning(
                $"Conflict detected for resource {localVersion.Id}. " +
                $"Local version: {localVersion.Version}, Remote version: {remoteVersion.Version}");

            // Strategia 1: Wyższa wersja wygrywa (Last-Write-Wins)
            if (remoteVersion.Timestamp > localVersion.Timestamp)
            {
                _logger.LogInformation("Applying remote version (newer timestamp)");
                return await Task.FromResult(new ConflictResolution
                {
                    Resource = remoteVersion,
                    Strategy = "RemoteWins"
                });
            }

            // Strategia 2: Lokalna wersja wygrywa
            _logger.LogInformation("Keeping local version");
            return await Task.FromResult(new ConflictResolution
            {
                Resource = localVersion,
                Strategy = "LocalWins"
            });
        }
    }
}
```

### 5.4.2 Detekcja Konfliktów

Utwórz `src/DistributedSync.Sync/ConflictDetection/ConflictDetector.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace DistributedSync.Sync.ConflictDetection
{
    public interface IConflictDetector
    {
        Task<bool> DetectConflictAsync(string checksum1, string checksum2);
        Task<List<ConflictInfo>> DetectMultipleConflictsAsync(
            Dictionary<string, string> localChecksums,
            Dictionary<string, string> remoteChecksums);
    }

    public class ConflictInfo
    {
        public string ResourceId { get; set; }
        public string LocalChecksum { get; set; }
        public string RemoteChecksum { get; set; }
        public DateTime ConflictTime { get; set; }
    }

    public class ConflictDetector : IConflictDetector
    {
        private readonly ILogger<ConflictDetector> _logger;

        public ConflictDetector(ILogger<ConflictDetector> logger)
        {
            _logger = logger;
        }

        public async Task<bool> DetectConflictAsync(string checksum1, string checksum2)
        {
            var hasConflict = !checksum1.Equals(checksum2, StringComparison.OrdinalIgnoreCase);
            
            if (hasConflict)
            {
                _logger.LogWarning($"Conflict detected: {checksum1} != {checksum2}");
            }

            return await Task.FromResult(hasConflict);
        }

        public async Task<List<ConflictInfo>> DetectMultipleConflictsAsync(
            Dictionary<string, string> localChecksums,
            Dictionary<string, string> remoteChecksums)
        {
            var conflicts = new List<ConflictInfo>();

            foreach (var localResource in localChecksums)
            {
                if (remoteChecksums.TryGetValue(localResource.Key, out var remoteChecksum))
                {
                    if (!localResource.Value.Equals(remoteChecksum, StringComparison.OrdinalIgnoreCase))
                    {
                        conflicts.Add(new ConflictInfo
                        {
                            ResourceId = localResource.Key,
                            LocalChecksum = localResource.Value,
                            RemoteChecksum = remoteChecksum,
                            ConflictTime = DateTime.UtcNow
                        });

                        _logger.LogWarning(
                            $"Conflict detected for resource {localResource.Key}");
                    }
                }
            }

            return await Task.FromResult(conflicts);
        }
    }
}
```

## 5.5 Integracja z Program.cs

Edytuj `src/DistributedSync.API/Program.cs`:

```csharp
// Dodaj usługi Sync
builder.Services.AddScoped<IRabbitMqService, RabbitMqService>();
builder.Services.AddScoped<IConflictResolver, ConflictResolver>();
builder.Services.AddScoped<IConflictDetector, ConflictDetector>();

// Dodaj gRPC
builder.Services.AddGrpc();

// W middleware
app.MapGrpcService<GrpcSyncService>();
```

## 5.6 Test Synchronizacji

Utwórz `tests/DistributedSync.Sync.Tests/ConflictResolverTests.cs`:

```csharp
using System;
using System.Threading.Tasks;
using Xunit;
using Microsoft.Extensions.Logging;
using Moq;
using DistributedSync.Sync.ConflictDetection;
using DistributedSync.Sync.gRPC;

namespace DistributedSync.Sync.Tests
{
    public class ConflictResolverTests
    {
        [Fact]
        public async Task ResolveAsync_WhenRemoteIsNewer_ShouldUseRemoteVersion()
        {
            // Arrange
            var loggerMock = new Mock<ILogger<ConflictResolver>>();
            var resolver = new ConflictResolver(loggerMock.Object);

            var localVersion = new ResourceData
            {
                Id = "res-1",
                Timestamp = 1000,
                Version = 1
            };

            var remoteVersion = new ResourceData
            {
                Id = "res-1",
                Timestamp = 2000,
                Version = 2
            };

            // Act
            var result = await resolver.ResolveAsync(localVersion, remoteVersion);

            // Assert
            Assert.Equal(remoteVersion.Id, result.Resource.Id);
            Assert.Equal("RemoteWins", result.Strategy);
        }
    }
}
```

## Następne Kroki
→ Przejdź do [6. Interfejs użytkownika](06_INTERFEJS_UZYTKOWNIKA.md)
