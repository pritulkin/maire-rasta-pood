using Microsoft.AspNetCore.Mvc;
using MairePoodBackend.Models;
using MairePoodBackend.Services;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly DatabaseService _storage;

        public OrdersController(DatabaseService storage)
        {
            _storage = storage;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetAll()
        {
            var orders = await _storage.GetAllOrdersAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> Get(string id)
        {
            var order = await _storage.GetOrderAsync(id);
            if (order == null)
                return NotFound();
            return Ok(order);
        }

        [HttpPost]
        public async Task<ActionResult<Order>> Create([FromBody] Order order)
        {
            if (string.IsNullOrEmpty(order.Id))
                return BadRequest("Order ID is required");

            if (string.IsNullOrEmpty(order.Email))
                return BadRequest("Email is required");

            if (order.Items == null || order.Items.Count == 0)
                return BadRequest("Order must have at least one item");

            await _storage.SaveOrderAsync(order);
            return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
        }

        [HttpPatch("{id}")]
        public async Task<ActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
        {
            var order = await _storage.GetOrderAsync(id);
            if (order == null)
                return NotFound();

            if (request.Status != "pending" && request.Status != "processed")
                return BadRequest("Invalid status. Must be 'pending' or 'processed'");

            await _storage.UpdateOrderStatusAsync(id, request.Status);
            return Ok(order);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var existing = await _storage.GetOrderAsync(id);
            if (existing == null)
                return NotFound();

            await _storage.DeleteOrderAsync(id);
            return NoContent();
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
