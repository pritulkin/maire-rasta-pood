using System.Text.Json;
using System.Text.Json.Serialization;
using MairePoodBackend.Models;

namespace MairePoodBackend.Services
{
    public class JsonStorageService
    {
        private readonly string _ordersDir;
        private readonly string _productsDir;
        private readonly JsonSerializerOptions _jsonOptions;

        public JsonStorageService(IConfiguration configuration)
        {
            var basePath = Directory.GetCurrentDirectory();
            _ordersDir = Path.Combine(basePath, "..", "orders");
            _productsDir = Path.Combine(basePath, "..", "products");

            // Ensure directories exist
            Directory.CreateDirectory(_ordersDir);
            Directory.CreateDirectory(_productsDir);

            // Configure JSON options to handle camelCase
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = true
            };
        }

        // Products
        private void AgentLog(string location, string message, object data, string hypothesisId)
        {
            try
            {
                var payload = System.Text.Json.JsonSerializer.Serialize(new
                {
                    sessionId = "978fb6",
                    location,
                    message,
                    data,
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    hypothesisId
                });
                File.AppendAllText(Path.Combine(Directory.GetCurrentDirectory(), "..", "debug-978fb6.log"), payload + Environment.NewLine);
            }
            catch { }
        }

        public List<Product> GetAllProducts()
        {
            AgentLog("JsonStorageService.GetAllProducts", "reading products dir", new { productsDir = _productsDir, exists = Directory.Exists(_productsDir) }, "D");
            var products = new List<Product>();
            if (!Directory.Exists(_productsDir))
                return products;

            foreach (var file in Directory.GetFiles(_productsDir, "*.json"))
            {
                try
                {
                    var json = File.ReadAllText(file);
                    var product = JsonSerializer.Deserialize<Product>(json, _jsonOptions);
                    if (product != null)
                        products.Add(product);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error reading product file {file}: {ex.Message}");
                }
            }
            return products;
        }

        public Product? GetProduct(string id)
        {
            var filePath = Path.Combine(_productsDir, $"product-{id}.json");
            if (!File.Exists(filePath))
                return null;

            try
            {
                var json = File.ReadAllText(filePath);
                return JsonSerializer.Deserialize<Product>(json, _jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading product {id}: {ex.Message}");
                return null;
            }
        }

        public void SaveProduct(Product product)
        {
            var filePath = Path.Combine(_productsDir, $"product-{product.Id}.json");
            var json = JsonSerializer.Serialize(product, _jsonOptions);
            File.WriteAllText(filePath, json);
        }

        public void DeleteProduct(string id)
        {
            var filePath = Path.Combine(_productsDir, $"product-{id}.json");
            if (File.Exists(filePath))
                File.Delete(filePath);
        }

        // Orders
        public List<Order> GetAllOrders()
        {
            var orders = new List<Order>();
            if (!Directory.Exists(_ordersDir))
                return orders;

            foreach (var file in Directory.GetFiles(_ordersDir, "*.json"))
            {
                try
                {
                    var json = File.ReadAllText(file);
                    var order = JsonSerializer.Deserialize<Order>(json, _jsonOptions);
                    if (order != null)
                        orders.Add(order);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error reading order file {file}: {ex.Message}");
                }
            }
            return orders;
        }

        public Order? GetOrder(string id)
        {
            var filePath = Path.Combine(_ordersDir, $"order-{id}.json");
            if (!File.Exists(filePath))
                return null;

            try
            {
                var json = File.ReadAllText(filePath);
                return JsonSerializer.Deserialize<Order>(json, _jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading order {id}: {ex.Message}");
                return null;
            }
        }

        public void SaveOrder(Order order)
        {
            var filePath = Path.Combine(_ordersDir, $"order-{order.Id}.json");
            var json = JsonSerializer.Serialize(order, _jsonOptions);
            File.WriteAllText(filePath, json);
            AgentLog("JsonStorageService.SaveOrder", "order JSON written", new { filePath, orderId = order.Id, fileExists = File.Exists(filePath) }, "C,D");
        }

        public void DeleteOrder(string id)
        {
            var filePath = Path.Combine(_ordersDir, $"order-{id}.json");
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
    }
}
