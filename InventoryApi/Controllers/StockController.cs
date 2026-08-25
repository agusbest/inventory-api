using InventoryApi.DTOs.Stock;
using InventoryApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/products/{productId:int}/stock")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly StockService _service;

    public StockController(StockService service)
    {
        _service = service;
    }

    [HttpPost("in")]
    public async Task<IActionResult> StockIn(
        int productId,
        StockRequest request)
    {
        var success = await _service.StockInAsync(
            productId,
            request);

        if (!success)
        {
            return NotFound(new
            {
                message = "Product not found"
            });
        }

        return Ok(new
        {
            message = "Stock added successfully"
        });
    }

    [HttpPost("out")]
    public async Task<IActionResult> StockOut(
        int productId,
        StockRequest request)
    {
        var result = await _service.StockOutAsync(
            productId,
            request);

        if (!result.Success)
        {
            if (result.Error == "PRODUCT_NOT_FOUND")
            {
                return NotFound(new
                {
                    message = "Product not found"
                });
            }

            return BadRequest(new
            {
                message = "Insufficient stock"
            });
        }

        return Ok(new
        {
            message = "Stock removed successfully"
        });
    }

    [HttpGet("history")]
    public async Task<IActionResult> History(int productId)
    {
        var history = await _service.GetHistoryAsync(productId);

        return Ok(history);
    }

    [HttpGet("/api/stock/history")]
    public async Task<IActionResult> AllHistory(
        [FromQuery] int? productId,
        [FromQuery] string? type,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetAllHistoryAsync(
            productId,
            type,
            page,
            pageSize);

        return Ok(result);
    }

}