import {
    useEffect,
    useState,
} from "react";
import type { FormEvent } from "react";
import api from "../api/axios";

import type {
    Product,
    StockHistory,
    StockHistoryResponse,
} from "../types";

type StockType = "IN" | "OUT";

interface StockForm {
    productId: string;
    quantity: string;
    note: string;
}

const emptyForm: StockForm = {
    productId: "",
    quantity: "",
    note: "",
};

export default function Stock() {
    // =========================
    // PRODUCTS
    // =========================

    const [products, setProducts] = useState<Product[]>(
        []
    );

    const [productSearch, setProductSearch] =
        useState("");

    // =========================
    // HISTORY
    // =========================

    const [history, setHistory] = useState<
        StockHistory[]
    >([]);

    const [historyPage, setHistoryPage] =
        useState(1);

    const [historyTotalPages, setHistoryTotalPages] =
        useState(1);

    const [historyProduct, setHistoryProduct] =
        useState("");

    const [historyType, setHistoryType] =
        useState("");

    // =========================
    // UI
    // =========================

    const [loadingProducts, setLoadingProducts] =
        useState(true);

    const [loadingHistory, setLoadingHistory] =
        useState(true);

    const [showModal, setShowModal] =
        useState(false);

    const [stockType, setStockType] =
        useState<StockType>("IN");

    const [form, setForm] =
        useState<StockForm>(emptyForm);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    // =========================
    // LOAD PRODUCTS
    // =========================

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        setLoadingProducts(true);

        try {
            const response =
                await api.get(
                    "/products?page=1&pageSize=100"
                );

            setProducts(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    }

    // =========================
    // LOAD HISTORY
    // =========================

    useEffect(() => {
        loadHistory();
    }, [
        historyPage,
        historyProduct,
        historyType,
    ]);

    async function loadHistory() {
        setLoadingHistory(true);

        try {
            const params = new URLSearchParams();

            params.set("page", String(historyPage));
            params.set("pageSize", "10");

            if (historyProduct) {
                params.set(
                    "productId",
                    historyProduct
                );
            }

            if (historyType) {
                params.set("type", historyType);
            }

            const response =
                await api.get<StockHistoryResponse>(
                    `/stock/history?${params.toString()}`
                );

            setHistory(response.data.data);

            setHistoryTotalPages(
                response.data.pagination.totalPages
            );
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    }

    // =========================
    // MODAL
    // =========================

    function openStockModal(
        type: StockType
    ) {
        setStockType(type);
        setForm(emptyForm);
        setError("");
        setShowModal(true);
    }

    function closeModal() {
        if (saving) return;

        setShowModal(false);
        setForm(emptyForm);
        setError("");
    }

    // =========================
    // FORM
    // =========================

    function handleChange(
        field: keyof StockForm,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(
        e: FormEvent
    ) {
        e.preventDefault();

        setError("");

        const productId =
            Number(form.productId);

        const quantity =
            Number(form.quantity);

        if (!productId) {
            setError(
                "Please select a product."
            );
            return;
        }

        if (!quantity || quantity <= 0) {
            setError(
                "Quantity must be greater than zero."
            );
            return;
        }

        const product = products.find(
            (item) =>
                item.id === productId
        );

        if (
            stockType === "OUT" &&
            product &&
            quantity > product.stock
        ) {
            setError(
                `Insufficient stock. Current stock: ${product.stock}`
            );

            return;
        }

        setSaving(true);

        try {
            await api.post(
                `/products/${productId}/stock/${stockType === "IN"
                    ? "in"
                    : "out"
                }`,
                {
                    quantity,
                    note:
                        form.note.trim() ||
                        null,
                }
            );

            closeModal();

            await Promise.all([
                loadProducts(),
                loadHistory(),
            ]);
        } catch (error: any) {
            console.error(error);

            if (
                error.response?.data?.errors
            ) {
                const messages =
                    Object.values(
                        error.response.data.errors
                    )
                        .flat()
                        .join(" ");

                setError(messages);
            } else {
                setError(
                    error.response?.data?.message ??
                    "Failed to process stock transaction."
                );
            }
        } finally {
            setSaving(false);
        }
    }

    // =========================
    // FILTER
    // =========================

    function resetHistoryFilter() {
        setHistoryProduct("");
        setHistoryType("");
        setHistoryPage(1);
    }

    // =========================
    // CURRENT STOCK SEARCH
    // =========================

    const filteredProducts =
        products.filter((product) =>
            product.name
                .toLowerCase()
                .includes(
                    productSearch.toLowerCase()
                )
        );

    return (
        <>
            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">
                        Stock
                    </h2>

                    <p className="text-muted mb-0">
                        Manage stock movements and inventory
                    </p>
                </div>

                <div className="d-flex gap-2 stock-action-buttons">
                    <button
                        className="btn btn-success"
                        onClick={() => openStockModal("IN")}
                    >
                        + Stock In
                    </button>

                    <button
                        className="btn btn-danger"
                        onClick={() => openStockModal("OUT")}
                    >
                        − Stock Out
                    </button>
                </div>
            </div>

            {/* ================================= */}
            {/* CURRENT STOCK */}
            {/* ================================= */}

            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h5 className="fw-bold mb-1">
                                Current Stock
                            </h5>

                            <small className="text-muted">
                                Current inventory balance
                            </small>
                        </div>

                        <div
                            style={{
                                width: 250,
                            }}
                        >
                            <input
                                className="form-control form-control-sm"
                                placeholder="Search product..."
                                value={productSearch}
                                onChange={(e) =>
                                    setProductSearch(
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loadingProducts ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-4"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="text-center py-4"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map(
                                        (product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="fw-semibold">
                                                        {product.name}
                                                    </div>

                                                    {product.description && (
                                                        <small className="text-muted">
                                                            {
                                                                product.description
                                                            }
                                                        </small>
                                                    )}
                                                </td>

                                                <td>
                                                    Rp{" "}
                                                    {product.price.toLocaleString(
                                                        "id-ID"
                                                    )}
                                                </td>

                                                <td>
                                                    <strong>
                                                        {product.stock}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {product.stock <=
                                                        5 ? (
                                                        <span className="badge text-bg-danger">
                                                            Low Stock
                                                        </span>
                                                    ) : (
                                                        <span className="badge text-bg-success">
                                                            Available
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ================================= */}
            {/* STOCK HISTORY */}
            {/* ================================= */}

            <div className="card border-0 shadow-sm">
                <div className="card-body">
                    <div className="mb-3">
                        <h5 className="fw-bold mb-1">
                            Stock History
                        </h5>

                        <small className="text-muted">
                            Record of all stock movements
                        </small>
                    </div>

                    {/* FILTER */}

                    <div className="row g-2 mb-3">
                        <div className="col-md-5">
                            <select
                                className="form-select"
                                value={historyProduct}
                                onChange={(e) => {
                                    setHistoryProduct(
                                        e.target.value
                                    );
                                    setHistoryPage(1);
                                }}
                            >
                                <option value="">
                                    All Products
                                </option>

                                {products.map(
                                    (product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <select
                                className="form-select"
                                value={historyType}
                                onChange={(e) => {
                                    setHistoryType(
                                        e.target.value
                                    );
                                    setHistoryPage(1);
                                }}
                            >
                                <option value="">
                                    All Types
                                </option>

                                <option value="IN">
                                    Stock In
                                </option>

                                <option value="OUT">
                                    Stock Out
                                </option>
                            </select>
                        </div>

                        <div className="col-md-2">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={
                                    resetHistoryFilter
                                }
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* HISTORY TABLE */}

                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Type</th>
                                    <th>Qty</th>
                                    <th>Before</th>
                                    <th>After</th>
                                    <th>Note</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loadingHistory ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-4"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : history.length ===
                                    0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-4"
                                        >
                                            No stock history.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {new Date(
                                                    item.createdAt
                                                ).toLocaleString(
                                                    "id-ID"
                                                )}
                                            </td>

                                            <td className="fw-semibold">
                                                {item.productName}
                                            </td>

                                            <td>
                                                {item.type ===
                                                    "IN" ? (
                                                    <span className="badge text-bg-success">
                                                        IN
                                                    </span>
                                                ) : (
                                                    <span className="badge text-bg-danger">
                                                        OUT
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {item.quantity}
                                            </td>

                                            <td>
                                                {item.stockBefore}
                                            </td>

                                            <td>
                                                {item.stockAfter}
                                            </td>

                                            <td>
                                                {item.note ?? "-"}
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
                            className="btn btn-outline-secondary btn-sm"
                            disabled={
                                historyPage <= 1 ||
                                loadingHistory
                            }
                            onClick={() =>
                                setHistoryPage(
                                    (page) => page - 1
                                )
                            }
                            title="Previous page"
                            aria-label="Previous page"
                        >
                            ←
                        </button>

                        <span className="small text-muted">
                            Page {historyPage} of{" "}
                            {historyTotalPages}
                        </span>

                        <button
                            className="btn btn-outline-secondary btn-sm"
                            disabled={
                                historyPage >=
                                historyTotalPages ||
                                loadingHistory
                            }
                            onClick={() =>
                                setHistoryPage(
                                    (page) => page + 1
                                )
                            }
                            title="Next page"
                            aria-label="Next page"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>

            {/* ================================= */}
            {/* STOCK MODAL */}
            {/* ================================= */}

            {showModal && (
                <>
                    <div className="modal fade show d-block">
                        <div className="modal-dialog modal-dialog-centered px-3">
                            <div className="modal-content rounded-4 shadow border-0">
                                <form
                                    onSubmit={handleSubmit}
                                >
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            {stockType === "IN"
                                                ? "Stock In"
                                                : "Stock Out"}
                                        </h5>

                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={
                                                closeModal
                                            }
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
                                                Product
                                            </label>

                                            <select
                                                className="form-select"
                                                value={
                                                    form.productId
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "productId",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Select product
                                                </option>

                                                {products.map(
                                                    (product) => (
                                                        <option
                                                            key={
                                                                product.id
                                                            }
                                                            value={
                                                                product.id
                                                            }
                                                        >
                                                            {product.name}{" "}
                                                            — Stock:{" "}
                                                            {
                                                                product.stock
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">
                                                Quantity
                                            </label>

                                            <input
                                                type="number"
                                                className="form-control"
                                                min="1"
                                                value={
                                                    form.quantity
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "quantity",
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">
                                                Note
                                            </label>

                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                placeholder={
                                                    stockType ===
                                                        "IN"
                                                        ? "Purchase from supplier..."
                                                        : "Sold to customer..."
                                                }
                                                value={
                                                    form.note
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "note",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={
                                                closeModal
                                            }
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className={`btn ${stockType ===
                                                "IN"
                                                ? "btn-success"
                                                : "btn-danger"
                                                }`}
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Processing..."
                                                : stockType ===
                                                    "IN"
                                                    ? "Save Stock In"
                                                    : "Save Stock Out"}
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