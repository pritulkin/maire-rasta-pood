using Microsoft.AspNetCore.Mvc;
using MairePoodBackend.Models;
using MairePoodBackend.Services;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly JsonStorageService _storage;

        public ProductsController(JsonStorageService storage)
        {
            _storage = storage;
        }

        [HttpGet]
        public ActionResult<IEnumerable<Product>> GetAll()
        {
            var products = _storage.GetAllProducts();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public ActionResult<Product> Get(string id)
        {
            var product = _storage.GetProduct(id);
            if (product == null)
                return NotFound();
            return Ok(product);
        }

        [HttpPost]
        public ActionResult<Product> Create([FromBody] Product product)
        {
            if (string.IsNullOrEmpty(product.Id))
                return BadRequest("Product ID is required");

            _storage.SaveProduct(product);
            return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        public ActionResult Update(string id, [FromBody] Product product)
        {
            if (_storage.GetProduct(id) == null)
                return NotFound();

            product.Id = id;
            _storage.SaveProduct(product);
            return Ok(product);
        }

        [HttpDelete("{id}")]
        public ActionResult Delete(string id)
        {
            if (_storage.GetProduct(id) == null)
                return NotFound();

            _storage.DeleteProduct(id);
            return NoContent();
        }
    }
}
