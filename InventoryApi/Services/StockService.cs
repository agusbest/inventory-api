using InventoryApi.Data;
using InventoryApi.DTOs.Stock;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;


namespace InventoryApi.Services;

public class StockService
{
    private readonly AppDbContext _context;

    public StockService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> StockInAsync(
        int productId,
        StockRequest request)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
            return false;

        var before = product.Stock;

        product.Stock += request.Quantity;
        product.UpdatedAt = DateTime.UtcNow;

        _context.StockTransactions.Add(
            new StockTransaction
            {
                ProductId = product.Id,
                Type = "IN",
                Quantity = request.Quantity,
                StockBefore = before,
                StockAfter = product.Stock,
                Note = request.Note?.Trim()
            });

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return true;
    }

    public async Task<(bool Success, string? Error)> StockOutAsync(
        int productId,
        StockRequest request)
    {
        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
            return (false, "PRODUCT_NOT_FOUND");

        if (product.Stock < request.Quantity)
            return (false, "INSUFFICIENT_STOCK");

        var before = product.Stock;

        product.Stock -= request.Quantity;
        product.UpdatedAt = DateTime.UtcNow;

        _context.StockTransactions.Add(
            new StockTransaction
            {
                ProductId = product.Id,
                Type = "OUT",
                Quantity = request.Quantity,
                StockBefore = before,
                StockAfter = product.Stock,
                Note = request.Note?.Trim()
            });

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        return (true, null);
    }

    public async Task<List<StockHistoryResponse>> GetHistoryAsync(
        int productId)
    {
        return await _context.StockTransactions
            .AsNoTracking()
            .Where(s => s.ProductId == productId)
            .OrderByDescending(s => s.Id)
            .Select(s => new StockHistoryResponse
            {
                Id = s.Id,
                ProductId = s.ProductId,
                ProductName = s.Product.Name,
                Type = s.Type,
                Quantity = s.Quantity,
                StockBefore = s.StockBefore,
                StockAfter = s.StockAfter,
                Note = s.Note,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();
    }

   public async Task<object> GetAllHistoryAsync(
    int? productId,
    string? type,
    int page,
    int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 10 : Math.Min(pageSize, 100);

        var query = _context.StockTransactions
            .AsNoTracking()
            .AsQueryable();

        if (productId.HasValue)
        {
            query = query.Where(
                x => x.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(
                x => x.Type == type);
        }

        var total = await query.CountAsync();

        var data = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new StockHistoryResponse
            {
                Id = x.Id,
                ProductId = x.ProductId,
                ProductName = x.Product.Name,
                Type = x.Type,
                Quantity = x.Quantity,
                StockBefore = x.StockBefore,
                StockAfter = x.StockAfter,
                Note = x.Note,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return new
        {
            data,
            pagination = new
            {
                page,
                pageSize,
                total,
                totalPages = (int)Math.Ceiling(
                    total / (double)pageSize)
            }
        };
    }
}