import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    function logout() {
        localStorage.removeItem("token");
        navigate("/login");
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <div className="app-layout min-vh-100">

            {/* Overlay mobile */}
            {menuOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`app-sidebar ${menuOpen ? "sidebar-open" : ""
                    }`}
            >
                <div className="sidebar-header">
                    <Link
                        to="/"
                        className="sidebar-brand"
                        onClick={closeMenu}
                    >
                        Inventory
                    </Link>

                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={closeMenu}
                    >
                        ×
                    </button>
                </div>

                <nav className="sidebar-menu">

                    <Link
                        to="/"
                        className="sidebar-link"
                        onClick={closeMenu}
                    >
                        <span className="sidebar-icon">▦</span>
                        Dashboard
                    </Link>

                    <Link
                        to="/products"
                        className="sidebar-link"
                        onClick={closeMenu}
                    >
                        <span className="sidebar-icon">▣</span>
                        Products
                    </Link>

                    <Link
                        to="/stock"
                        className="sidebar-link"
                        onClick={closeMenu}
                    >
                        <span className="sidebar-icon">⇅</span>
                        Stock
                    </Link>

                </nav>

                <div className="sidebar-footer">
                    <button
                        className="sidebar-logout"
                        onClick={logout}
                    >
                        <span>↪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="app-main">

                {/* Topbar */}
                <header className="app-topbar">

                    <button
                        type="button"
                        className="menu-toggle"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        ☰
                    </button>

                    <div className="topbar-title">
                        Inventory
                    </div>

                </header>

                {/* Content */}
                <main className="app-content">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}