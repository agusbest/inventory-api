using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InventoryApi.Data;
using InventoryApi.DTOs.Auth;
using InventoryApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;


namespace InventoryApi.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<User> _passwordHasher = new();
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
         _logger = logger;
    }

   public async Task<bool> RegisterAsync(
    string username,
    string password)
    {
        try
        {
            username = username.Trim();

            _logger.LogInformation(
                "Register started for username: {Username}",
                username);

            var exists = await _context.Users
                .AnyAsync(u => u.Username == username);

            _logger.LogInformation(
                "User exists: {Exists}",
                exists);

            if (exists)
                return false;

            var user = new User
            {
                Username = username,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Creating password hash");

            user.PasswordHash =
                _passwordHasher.HashPassword(
                    user,
                    password);

            _context.Users.Add(user);

            _logger.LogInformation(
                "Saving user to database");

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Register successful for username: {Username}",
                username);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Register failed for username: {Username}",
                username);

            throw;
        }
    }

    public async Task<LoginResponse?> LoginAsync(
        LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Username == request.Username.Trim());

        if (user == null)
            return null;

        var result =
            _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password);

        if (result == PasswordVerificationResult.Failed)
            return null;

        var jwt = _configuration.GetSection("Jwt");

        var key = jwt["Key"]
            ?? throw new InvalidOperationException(
                "JWT key is not configured.");

        var issuer = jwt["Issuer"];

        var audience = jwt["Audience"];

        var expirationMinutes =
            int.Parse(jwt["ExpirationMinutes"] ?? "60");

        var expiresAt =
            DateTime.UtcNow.AddMinutes(expirationMinutes);

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()),

            new Claim(
                ClaimTypes.Name,
                user.Username),

            new Claim(
                ClaimTypes.Role,
                user.Role)
        };

        var securityKey =
            new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key));

        var credentials =
            new SigningCredentials(
                securityKey,
                SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return new LoginResponse
        {
            Token =
                new JwtSecurityTokenHandler()
                    .WriteToken(token),

            ExpiresAt = expiresAt
        };
    }
}