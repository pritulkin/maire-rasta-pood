using MairePoodBackend.Services;
using MairePoodBackend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

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
