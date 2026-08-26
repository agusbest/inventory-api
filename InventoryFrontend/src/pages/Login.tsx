import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await api.post("/auth/login", {
                username,
                password,
            });

            localStorage.setItem("token", response.data.token);

            navigate("/");
        } catch {
            setError("Username atau password salah.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page min-vh-100 d-flex align-items-center justify-content-center px-3 py-4">
            <div
                className="card login-card shadow-sm border-0 w-100"
                style={{ maxWidth: 400 }}
            >
                <div className="card-body p-4 p-md-5">
                    <h3 className="fw-bold mb-1 text-center">
                        Inventory API
                    </h3>

                    <p className="text-muted mb-4 text-center">
                        Sign in to your account
                    </p>

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-medium">
                                Username
                            </label>

                            <input
                                type="text"
                                className="form-control login-input"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value)
                                }
                                required
                            />
                        </div>

                        {/* <div className="mb-4">
                            <label className="form-label fw-medium">
                                Password
                            </label>

                            <input
                                type="password"
                                className="form-control login-input"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />
                        </div> */}
                        <div className="mb-4">
                            <label className="form-label fw-medium">
                                Password
                            </label>

                            <div className="position-relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control login-input pe-5"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    style={{ zIndex: 2 }}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 login-button"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}