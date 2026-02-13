import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, GuestRoute } from "@/components/auth-guard";
import SidebarLayout from "@/components/layout/sidebar";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/home";
import EquipmentListPage from "@/pages/equipment/list";
import EquipmentDetailPage from "@/pages/equipment/detail";
import EquipmentFormPage from "@/pages/equipment/form";
import SupplierListPage from "@/pages/suppliers/list";
import SupplierDetailPage from "@/pages/suppliers/detail";
import SupplierFormPage from "@/pages/suppliers/form";
import PartnerListPage from "@/pages/partners/list";
import PartnerDetailPage from "@/pages/partners/detail";
import PartnerFormPage from "@/pages/partners/form";
import WorkersListPage from "@/pages/workers/list";
import WorkersDetailPage from "@/pages/workers/detail";
import WorkersFormPage from "@/pages/workers/form";
import CustomerListPage from "@/pages/customers/list";
import CustomerDetailPage from "@/pages/customers/detail";
import CustomerFormPage from "@/pages/customers/form";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest-only routes (redirect to /home if already authenticated) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes with sidebar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<SidebarLayout />}>
            <Route path="/home" element={<HomePage />} />

            {/* Equipment routes */}
            <Route path="/equipment" element={<EquipmentListPage />} />
            <Route path="/equipment/new" element={<EquipmentFormPage />} />
            <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
            <Route path="/equipment/:id/edit" element={<EquipmentFormPage />} />

            {/* Supplier routes */}
            <Route path="/suppliers" element={<SupplierListPage />} />
            <Route path="/suppliers/new" element={<SupplierFormPage />} />
            <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
            <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />

            {/* Partner routes */}
            <Route path="/partners" element={<PartnerListPage />} />
            <Route path="/partners/new" element={<PartnerFormPage />} />
            <Route path="/partners/:id" element={<PartnerDetailPage />} />
            <Route path="/partners/:id/edit" element={<PartnerFormPage />} />

            {/* Workers routes */}
            <Route path="/workers" element={<WorkersListPage />} />
            <Route path="/workers/new" element={<WorkersFormPage />} />
            <Route path="/workers/:id" element={<WorkersDetailPage />} />
            <Route path="/workers/:id/edit" element={<WorkersFormPage />} />

            {/* Customers routes */}
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/new" element={<CustomerFormPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
          </Route>
        </Route>

        {/* Catch-all: redirect to /equipment */}
        <Route path="*" element={<Navigate to="/equipment" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
