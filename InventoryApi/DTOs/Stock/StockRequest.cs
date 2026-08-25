using System.ComponentModel.DataAnnotations;

namespace InventoryApi.DTOs.Stock;

public class StockRequest
{
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [StringLength(500)]
    public string? Note { get; set; }
}