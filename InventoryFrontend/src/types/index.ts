export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    createdAt: string;
    updatedAt: string;
}

export interface LoginResponse {
    token: string;
    expiresAt: string;
}

export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface ProductListResponse {
    data: Product[];
    pagination: Pagination;
}

export interface StockHistory {
    id: number;
    productId: number;
    productName: string;
    type: "IN" | "OUT";
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    note: string | null;
    createdAt: string;
}

export interface StockHistoryResponse {
    data: StockHistory[];
    pagination: Pagination;
}