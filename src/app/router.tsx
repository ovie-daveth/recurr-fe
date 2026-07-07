import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { ApiKeysPage } from "../features/api-keys/ApiKeysPage";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { VerifyEmailPage } from "../features/auth/VerifyEmailPage";
import { BusinessesPage } from "../features/businesses/BusinessesPage";
import { CustomersPage } from "../features/customers/CustomersPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DunningPoliciesPage } from "../features/dunning/DunningPoliciesPage";
import { InvoicesPage } from "../features/invoices/InvoicesPage";
import { LandingPage } from "../features/landing/LandingPage";
import { LogsPage } from "../features/logs/LogsPage";
import { PaymentAttemptsPage } from "../features/payment-attempts/PaymentAttemptsPage";
import { PlansPage } from "../features/plans/PlansPage";
import { SubscriptionsPage } from "../features/subscriptions/SubscriptionsPage";
import { SubscribeCompletePage } from "../features/subscribe/SubscribeCompletePage";
import { SubscribePage } from "../features/subscribe/SubscribePage";
import { WebhooksPage } from "../features/webhooks/WebhooksPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/subscribe/:businessSlug/:planCode",
    element: <SubscribePage />
  },
  {
    path: "/subscribe/:businessSlug/:planCode/complete",
    element: <SubscribeCompletePage />
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> }
    ]
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "businesses", element: <BusinessesPage /> },
      { path: "api-keys", element: <ApiKeysPage /> },
      { path: "customers", element: <CustomersPage /> },
      { path: "plans", element: <PlansPage /> },
      { path: "subscriptions", element: <SubscriptionsPage /> },
      { path: "invoices", element: <InvoicesPage /> },
      { path: "payment-attempts", element: <PaymentAttemptsPage /> },
      { path: "webhooks", element: <WebhooksPage /> },
      { path: "dunning", element: <DunningPoliciesPage /> },
      { path: "logs", element: <LogsPage /> }
    ]
  }
]);
