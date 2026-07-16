using Microsoft.AspNetCore.Mvc;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // In production, this should be stored securely (environment variable, secrets manager, etc.)
        private const string ADMIN_PASSWORD = "maire2026";

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (request?.Password == ADMIN_PASSWORD)
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
