import { Suspense, lazy, ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { RouteLoader } from "@/components/feedback/RouteLoader";

const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const BuyerDashboard = lazy(() => import("@/pages/buyer/BuyerDashboard"));
const Vendors = lazy(() => import("@/pages/buyer/Vendors"));
const BuyerVendorMenu = lazy(() => import("@/pages/buyer/VendorMenu"));
const Cart = lazy(() => import("@/pages/buyer/Cart"));
const Orders = lazy(() => import("@/pages/buyer/Orders"));
const OrderDetail = lazy(() => import("@/pages/buyer/OrderDetail"));
const OrderDetailTracking = lazy(() => import("@/pages/buyer/OrderDetailTracking"));

const RunnerDashboard = lazy(() => import("@/pages/runner/RunnerDashboard"));

const VendorDashboard = lazy(() => import("@/pages/vendor/VendorDashboard"));
const VendorSetup = lazy(() => import("@/pages/vendor/VendorSetup"));
const VendorMenu = lazy(() => import("@/pages/vendor/VendorMenu"));

const withGuard = (element: ReactNode, role?: "buyer" | "runner" | "vendor") => (
  <ProtectedRoute requiredRole={role}>{element}</ProtectedRoute>
);

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary fallbackTitle="Unable to load page">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/buyer" element={withGuard(<BuyerDashboard />, "buyer")} />
            <Route path="/buyer/vendors" element={withGuard(<Vendors />, "buyer")} />
            <Route path="/buyer/vendors/:vendorId" element={withGuard(<BuyerVendorMenu />, "buyer")} />
            <Route path="/buyer/cart" element={withGuard(<Cart />, "buyer")} />
            <Route path="/buyer/orders" element={withGuard(<Orders />, "buyer")} />
            <Route path="/buyer/orders/:orderId" element={withGuard(<OrderDetailTracking />, "buyer")} />
            <Route path="/buyer/orders/:orderId/details" element={withGuard(<OrderDetail />, "buyer")} />

            <Route path="/runner" element={withGuard(<RunnerDashboard />, "runner")} />
            <Route path="/runner/orders/:orderId" element={withGuard(<OrderDetailTracking />, "runner")} />

            <Route path="/vendor" element={withGuard(<VendorDashboard />, "vendor")} />
            <Route path="/vendor/setup" element={withGuard(<VendorSetup />, "vendor")} />
            <Route path="/vendor/menu" element={withGuard(<VendorMenu />, "vendor")} />
            <Route path="/vendor/orders/:orderId" element={withGuard(<OrderDetailTracking />, "vendor")} />

            <Route path="/notifications" element={withGuard(<Notifications />)} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
