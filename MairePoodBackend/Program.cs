using MairePoodBackend.Services;
using MairePoodBackend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.ResponseCompression;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Add response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.BrotliCompressionProvider>();
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Optimal;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Optimal;
});

// Configure database - SQLite for local, PostgreSQL for Render
var isRender = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("RENDER"));

if (isRender)
{
    // PostgreSQL for Render
    var dbConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL") 
        ?? Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING")
        ?? "Host=localhost;Port=5432;Database=mairepood;Username=postgres;Password=postgres";

    // Parse Render DATABASE_URL format if needed
    if (dbConnectionString.StartsWith("postgres://"))
    {
        var uri = new Uri(dbConnectionString);
        var userInfo = uri.UserInfo.Split(':');
        dbConnectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.Trim('/')};Username={userInfo[0]};Password={userInfo[1]}";
    }

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(dbConnectionString));
}
else
{
    // SQLite for local development
    var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "mairepood.db");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite($"Data Source={dbPath}"));
}

builder.Services.AddScoped<DatabaseService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseHsts();
app.UseResponseCompression();
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "SAMEORIGIN");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;");
    await next();
});
app.UseRouting();
app.MapControllers();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "wwwroot")),
    RequestPath = ""
});

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred creating the DB.");
    }
}

app.Run();
