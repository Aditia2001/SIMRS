import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Activity, LockKeyhole, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 text-white p-4 rounded-2xl mb-4">
            <Activity size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SIMRS</h1>
          <p className="text-slate-500 text-sm mt-2">
            Sistem Informasi Manajemen Rumah Sakit
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <div className="flex items-center border rounded-lg px-3">
              <UserRound size={18} className="text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full p-3 outline-none"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="flex items-center border rounded-lg px-3">
              <LockKeyhole size={18} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full p-3 outline-none"
                placeholder="Masukkan password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-8">
          SIMRS — Technical Assessment
        </p>
      </div>
    </div>
  );
}
