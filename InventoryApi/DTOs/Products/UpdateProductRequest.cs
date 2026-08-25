using System.ComponentModel.DataAnnotations;

namespace InventoryApi.DTOs.Products;

public class UpdateProductRequest
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Price { get; set; }
}