import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api/axios";
import type { Product, ProductListResponse } from "../types";

const emptyForm = {
    name: "",
    description: "",
    price: "",
    stock: "",
};

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] =
        useState<Product | null>(null);

    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadProducts();
    }, [page, search]);

    async function loadProducts() {
        setLoading(true);

        try {
            const response =
                await api.get<ProductListResponse>(
                    `/products?page=${page}&pageSize=10&search=${encodeURIComponent(
                        search
                    )}`
                );

            setProducts(response.data.data);
            setTotalPages(
                response.data.pagination.totalPages
            );
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        setPage(1);
    }

    function openAddModal() {
        setEditingProduct(null);
        setForm(emptyForm);
        setError("");
        setShowModal(true);
    }

    function openEditModal(product: Product) {
        setEditingProduct(product);

        setForm({
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            stock: String(product.stock),
        });

        setError("");
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        setEditingProduct(null);
        setForm(emptyForm);
        setError("");
    }

    function handleChange(
        field: keyof typeof form,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setError("");

        if (!form.name.trim()) {
            setError("Product name is required.");
            return;
        }

        if (!form.price || Number(form.price) < 0) {
            setError("Price must be valid.");
            return;
        }

        if (!form.stock || Number(form.stock) < 0) {
            setError("Stock must be valid.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim() || null,
                price: Number(form.price),
                stock: Number(form.stock),
            };

            if (editingProduct) {
                await api.put(
                    `/products/${editingProduct.id}`,
                    payload
                );
            } else {
                await api.post("/products", payload);
            }

            closeModal();
            await loadProducts();
        } catch (error: any) {
            console.error(error);

            if (error.response?.data?.errors) {
                const errors =
                    error.response.data.errors;

                const messages = Object.values(errors)
                    .flat()
                    .join(" ");

                setError(messages);
            } else {
                setError(
                    error.response?.data?.message ??
                    "Failed to save product."
                );
            }
        } finally {
            setSaving(false);
        }
    }

    async function deleteProduct(id: number) {
        if (!confirm("Delete this product?")) {
            return;
        }

        try {
            await api.delete(`/products/${id}`);

            await loadProducts();
        } catch (error) {
            console.error(error);
            alert("Failed to delete product.");
        }
    }

    return (
        <>
            {/* HEADER */}

            <div className="d-flex justify-content-between align-items-center mb-4 product-header">
                <div>
                    <h2 className="fw-bold mb-1">
                        Products
                    </h2>

                    <p className="text-muted mb-0">
                        Manage inventory products
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={openAddModal}
                    title="Add Product"
                >
                    <span>+</span> Add
                </button>
            </div>

            {/* TABLE */}

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <form
                        onSubmit={handleSearch}
                        className="mb-3"
                    >
                        <div className="input-group">
                            <input
                                className="form-control"
                                placeholder="Search product..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                            <button
                                type="submit"
                                className="btn btn-dark"
                                title="Search"
                                aria-label="Search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                >
                                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                                </svg>
                            </button>
                        </div>
                    </form>

                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-4"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-4"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="fw-semibold">
                                                    {product.name}
                                                </div>

                                                <small className="text-muted">
                                                    {product.description}
                                                </small>
                                            </td>

                                            <td>
                                                Rp{" "}
                                                {product.price.toLocaleString(
                                                    "id-ID"
                                                )}
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${product.stock <= 5
                                                        ? "text-bg-danger"
                                                        : "text-bg-success"
                                                        }`}
                                                >
                                                    {product.stock}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="product-actions">

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary product-action-btn"
                                                        onClick={() =>
                                                            openEditModal(product)
                                                        }
                                                        title="Edit product"
                                                        aria-label="Edit product"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 16 16"
                                                            fill="currentColor"
                                                        >
                                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-9.5 9.5L3 14l.646-3.354 9.5-9.5z" />
                                                            <path d="M11.207 2.5 13.5 4.793 12.793 5.5 10.5 3.207z" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger product-action-btn"
                                                        onClick={() =>
                                                            deleteProduct(product.id)
                                                        }
                                                        title="Delete product"
                                                        aria-label="Delete product"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 16 16"
                                                            fill="currentColor"
                                                        >
                                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0A.5.5 0 0 1 8.5 6v6a.5.5 0 0 1-1 0V6A.5.5 0 0 1 8 5.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
                                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4 4v9.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V4zm-1-2v1h10V2z" />
                                                        </svg>
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}

                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <button
                            className="btn btn-outline-secondary"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((p) => p - 1)
                            }
                            title="Previous page"
                            aria-label="Previous page"
                        >
                            ←
                        </button>

                        <span>
                            Page {page} of {totalPages}
                        </span>

                        <button
                            className="btn btn-outline-secondary"
                            disabled={page >= totalPages}
                            onClick={() =>
                                setPage((p) => p + 1)
                            }
                            title="Next page"
                            aria-label="Next page"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>

            {/* ADD / EDIT MODAL */}

            {showModal && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex={-1}
                    >
                        {/* <div className="modal-dialog"> */}
                        <div className="modal-dialog modal-dialog-centered px-3">
                            <div className="modal-content rounded-4 shadow border-0">
                                <form onSubmit={handleSubmit}>
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            {editingProduct
                                                ? "Edit Product"
                                                : "Add Product"}
                                        </h5>

                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={closeModal}
                                        />
                                    </div>

                                    <div className="modal-body">
                                        {error && (
                                            <div className="alert alert-danger">
                                                {error}
                                            </div>
                                        )}

                                        <div className="mb-3">
                                            <label className="form-label">
                                                Product Name
                                            </label>

                                            <input
                                                type="text"
                                                className="form-control"
                                                value={form.name}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">
                                                Description
                                            </label>

                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={form.description}
                                                onChange={(e) =>
                                                    handleChange(
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Price
                                                    </label>

                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min="0"
                                                        value={form.price}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                "price",
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Stock
                                                    </label>

                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        min="0"
                                                        value={form.stock}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                "stock",
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={closeModal}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : editingProduct
                                                    ? "Update Product"
                                                    : "Save Product"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show" />
                </>
            )}
        </>
    );
}