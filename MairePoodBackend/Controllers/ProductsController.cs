using Microsoft.AspNetCore.Mvc;
using MairePoodBackend.Models;
using MairePoodBackend.Services;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly DatabaseService _storage;

        public ProductsController(DatabaseService storage)
        {
            _storage = storage;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetAll()
        {
            var products = await _storage.GetAllProductsAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> Get(string id)
        {
            var product = await _storage.GetProductAsync(id);
            if (product == null)
                return NotFound();
            return Ok(product);
        }

        [HttpPost]
        public async Task<ActionResult<Product>> Create([FromBody] Product product)
        {
            if (string.IsNullOrEmpty(product.Id))
                return BadRequest("Product ID is required");

            await _storage.SaveProductAsync(product);
            return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(string id, [FromBody] Product product)
        {
            var existing = await _storage.GetProductAsync(id);
            if (existing == null)
                return NotFound();

            product.Id = id;
            await _storage.SaveProductAsync(product);
            return Ok(product);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            var existing = await _storage.GetProductAsync(id);
            if (existing == null)
                return NotFound();

            await _storage.DeleteProductAsync(id);
            return NoContent();
        }
    }
}
