import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "@/components/auth-guard";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest-only routes (redirect to /home if already authenticated) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes (redirect to /login if not authenticated) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
        </Route>

        {/* Catch-all: redirect to /home (ProtectedRoute will bounce to /login if needed) */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
