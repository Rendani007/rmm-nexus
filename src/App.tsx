import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { TenantAuditLogsPage } from "./features/admin/TenantAuditLogsPage";
import { MfaSetupPage } from "./features/settings/MfaSetupPage";
import { IncidentRegisterPage } from "./features/security/IncidentRegisterPage";
import { RiskRegisterPage } from "./features/security/RiskRegisterPage";
import { RequestTransfer } from "./pages/RequestTransfer";
import { BillingPage } from "./features/billing/BillingPage";
import { PaymentSuccessPage } from "./features/billing/PaymentSuccessPage";
import { PaymentCancelPage } from "./features/billing/PaymentCancelPage";

import { StockApprovals } from "./pages/StockApprovals";
import NotFound from "./pages/NotFound";
import { ScanPage } from "./pages/ScanPage";
import { SuperAdminGuard } from "./features/auth/SuperAdminGuard";
import { SuperAdminDashboard } from "./features/admin/SuperAdminDashboard";
import { TenantsListPage } from "./features/admin/TenantsListPage";
import { SystemHealthPage } from "./features/admin/SystemHealthPage";
import { AuditLogsPage } from "./features/admin/AuditLogsPage";
import { SystemAdminsPage } from "./features/admin/SystemAdminsPage";

import { PublicItemPage } from "./pages/PublicItemPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { GlobalUpgradeModal } from "./components/ui/GlobalUpgradeModal";
import { TrialExpiredPage } from "./pages/TrialExpiredPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalUpgradeModal />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/trial-expired" element={<TrialExpiredPage />} />
          <Route path="/p/:tenant_id/:item_id" element={<PublicItemPage />} />
          <Route element={<AuthGuard />}>

            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<ItemsListPage />} />
            <Route path="/inventory" element={<Navigate to="/items" replace />} />
            <Route path="/locations" element={<LocationsListPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/stock" element={<StockPage />} />
            <Route path="/stock/request" element={<RequestTransfer />} />
            <Route path="/stock/approvals" element={<StockApprovals />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/profile" element={<ProfileSettingsPage />} />
            <Route path="/profile/security" element={<MfaSetupPage />} />
            <Route path="/admin/settings/attributes" element={<CustomFieldsSettingsPage />} />
            <Route path="/admin/settings/security" element={<MfaSetupPage />} />
            <Route path="/admin/audit-logs" element={<TenantAuditLogsPage />} />


            {/* Admin Routes */}
            <Route element={<AdminGuard />}>
              <Route path="/admin/users" element={<UsersListPage />} />
              <Route path="/admin/company" element={<CompanySettingsPage />} />
              <Route path="/admin/departments" element={<DepartmentsPage />} />
              <Route path="/admin/security/incidents" element={<IncidentRegisterPage />} />
              <Route path="/admin/security/risks" element={<RiskRegisterPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/billing/success" element={<PaymentSuccessPage />} />
              <Route path="/billing/cancel" element={<PaymentCancelPage />} />
            </Route>

            {/* Super Admin Routes */}
            <Route element={<SuperAdminGuard />}>
              <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
              <Route path="/admin/tenants" element={<TenantsListPage />} />
              <Route path="/admin/global-audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/system-admins" element={<SystemAdminsPage />} />
              <Route path="/admin/system-health" element={<SystemHealthPage />} />
            </Route>

          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
