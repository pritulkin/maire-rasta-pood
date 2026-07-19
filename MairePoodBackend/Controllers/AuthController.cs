using Microsoft.AspNetCore.Mvc;

namespace MairePoodBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IConfiguration configuration, ILogger<AuthController> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var adminPassword = _configuration["AdminPassword"] 
                ?? Environment.GetEnvironmentVariable("ADMIN_PASSWORD")
                ?? "maire2026"; // Fallback default

            _logger.LogInformation($"AdminPassword from config: {_configuration["AdminPassword"]}");
            _logger.LogInformation($"ADMIN_PASSWORD env var: {Environment.GetEnvironmentVariable("ADMIN_PASSWORD")}");
            _logger.LogInformation($"Final adminPassword: {adminPassword}");
            _logger.LogInformation($"Request password: {request?.Password}");

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
