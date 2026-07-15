using Microsoft.AspNetCore.Mvc;
using MairePoodBackend.Models;
using MairePoodBackend.Services;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly JsonStorageService _storage;

        public OrdersController(JsonStorageService storage)
        {
            _storage = storage;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Order>> GetAll()
        {
            var orders = _storage.GetAllOrders();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public ActionResult<Order> Get(string id)
        {
            var order = _storage.GetOrder(id);
            if (order == null)
                return NotFound();
            return Ok(order);
        }

        [HttpPost]
        public ActionResult<Order> Create([FromBody] Order order)
        {
            if (string.IsNullOrEmpty(order.Id))
                return BadRequest("Order ID is required");

            if (string.IsNullOrEmpty(order.Email))
                return BadRequest("Email is required");

            if (order.Items == null || order.Items.Count == 0)
                return BadRequest("Order must have at least one item");

            _storage.SaveOrder(order);
            return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
        }

        [HttpPatch("{id}")]
        public ActionResult UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
        {
            var order = _storage.GetOrder(id);
            if (order == null)
                return NotFound();

            if (request.Status != "pending" && request.Status != "processed")
                return BadRequest("Invalid status. Must be 'pending' or 'processed'");

            order.Status = request.Status;
            _storage.SaveOrder(order);
            return Ok(order);
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(string id)
        {
            if (_storage.GetOrder(id) == null)
                return NotFound();

            _storage.DeleteOrder(id);
            return NoContent();
        }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
