using Microsoft.AspNetCore.Mvc;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var adminPassword = _configuration["AdminPassword"] 
                ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
                ?? "maire2026"; // Fallback default

            if (request?.Password == adminPassword)
            {
                return Ok(new { success = true, message = "Login successful" });
            }
            return Unauthorized(new { success = false, message = "Invalid password" });
        }
    }

    public class LoginRequest
    {
        public string Password { get; set; } = string.Empty;
    }
}
