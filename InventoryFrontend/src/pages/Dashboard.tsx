import { useEffect, useState } from "react";
import api from "../api/axios";
import type { Product } from "../types";

export default function Dashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            const response = await api.get(
                "/products?page=1&pageSize=100"
            );

            setProducts(response.data.data);
        } finally {
            setLoading(false);
        }
    }

    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + product.stock,
        0
    );

    const lowStock = products.filter(
        (product) => product.stock <= 5
    ).length;

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <>
            <div className="mb-4">
                <h2 className="fw-bold mb-1">
                    Dashboard
                </h2>

                <p className="text-muted">
                    Inventory overview
                </p>
            </div>

            <div className="row g-3 dashboard-stats">

                <div className="col-md-4">
                    <div className="dashboard-card dashboard-card-primary">
                        <div className="dashboard-card-icon">
                            📦
                        </div>

                        <div className="dashboard-card-content">
                            <div className="dashboard-card-title">
                                Total Products
                            </div>

                            <div className="dashboard-card-value">
                                {totalProducts}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="dashboard-card dashboard-card-success">
                        <div className="dashboard-card-icon">
                            ⇅
                        </div>

                        <div className="dashboard-card-content">
                            <div className="dashboard-card-title">
                                Total Stock
                            </div>

                            <div className="dashboard-card-value">
                                {totalStock}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="dashboard-card dashboard-card-danger">
                        <div className="dashboard-card-icon">
                            ⚠
                        </div>

                        <div className="dashboard-card-content">
                            <div className="dashboard-card-title">
                                Low Stock
                            </div>

                            <div className="dashboard-card-value">
                                {lowStock}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}