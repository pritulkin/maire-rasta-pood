using Microsoft.EntityFrameworkCore;
using MairePoodBackend.Data;
using MairePoodBackend.Models;

namespace MairePoodBackend.Services
{
    public class DatabaseService
    {
        private readonly AppDbContext _context;

        public DatabaseService(AppDbContext context)
        {
            _context = context;
        }

        // Products
        public async Task<List<Product>> GetAllProductsAsync()
        {
            return await _context.Products.ToListAsync();
        }

        public async Task<Product?> GetProductAsync(string id)
        {
            return await _context.Products.FindAsync(id);
        }

        public async Task SaveProductAsync(Product product)
        {
            var existing = await _context.Products.FindAsync(product.Id);
            if (existing != null)
            {
                _context.Entry(existing).CurrentValues.SetValues(product);
            }
            else
            {
                _context.Products.Add(product);
            }
            await _context.SaveChangesAsync();
        }

        public async Task DeleteProductAsync(string id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product != null)
            {
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();
            }
        }

        // Orders
        public async Task<List<Order>> GetAllOrdersAsync()
        {
            return await _context.Orders.ToListAsync();
        }

        public async Task<Order?> GetOrderAsync(string id)
        {
            return await _context.Orders.FindAsync(id);
        }

        public async Task SaveOrderAsync(Order order)
        {
            var existing = await _context.Orders.FindAsync(order.Id);
            if (existing != null)
            {
                _context.Entry(existing).CurrentValues.SetValues(order);
            }
            else
            {
                _context.Orders.Add(order);
            }
            await _context.SaveChangesAsync();
        }

        public async Task DeleteOrderAsync(string id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateOrderStatusAsync(string id, string status)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order != null)
            {
                order.Status = status;
                await _context.SaveChangesAsync();
            }
        }
    }
}
