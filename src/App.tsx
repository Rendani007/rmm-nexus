import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ChangePasswordPage } from "./features/auth/ChangePasswordPage";
import { AuthGuard } from "./features/auth/AuthGuard";
import { AdminGuard } from "./features/auth/AdminGuard";
import { Dashboard } from "./pages/Dashboard";
import { ItemsListPage } from "./features/items/ItemsListPage";
import { LocationsListPage } from "./features/locations/LocationsListPage";
import { StockPage } from "./features/stock/StockPage";
import { UsersListPage } from "./features/users/UsersListPage";
import { CompanySettingsPage } from "./features/company/CompanySettingsPage";
import { CustomFieldsSettingsPage } from "./features/settings/CustomFieldsSettingsPage";
import { DepartmentsPage } from "./features/departments/DepartmentsPage";
import { RequestTransfer } from "./pages/RequestTransfer";
import { StockApprovals } from "./pages/StockApprovals";
import NotFound from "./pages/NotFound";
import { SuperAdminGuard } from "./features/auth/SuperAdminGuard";
import { SuperAdminDashboard } from "./features/admin/SuperAdminDashboard";
import { TenantsListPage } from "./features/admin/TenantsListPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<AuthGuard />}>

            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemsListPage />} />
            <Route path="/locations" element={<LocationsListPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/stock/request" element={<RequestTransfer />} />
            <Route path="/stock/approvals" element={<StockApprovals />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* Admin Routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin/users" element={<UsersListPage />} />
              <Route path="/admin/company" element={<CompanySettingsPage />} />
              <Route path="/admin/settings/attributes" element={<CustomFieldsSettingsPage />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
            </Route>
          </Route>

          {/* Super Admin Routes */}
          <Route element={<SuperAdminGuard />}>
            <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/admin/tenants" element={<TenantsListPage />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
