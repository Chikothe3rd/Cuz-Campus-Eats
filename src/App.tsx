import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DatabaseTest from "./pages/DatabaseTest";
import { Suspense, lazy } from 'react';
const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const Vendors = lazy(() => import('./pages/buyer/Vendors'));
const BuyerVendorMenu = lazy(() => import('./pages/buyer/VendorMenu'));
const Cart = lazy(() => import('./pages/buyer/Cart'));
const Orders = lazy(() => import('./pages/buyer/Orders'));
const OrderDetail = lazy(() => import('./pages/buyer/OrderDetail'));
const RunnerDashboard = lazy(() => import('./pages/runner/RunnerDashboard'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorSetup = lazy(() => import('./pages/vendor/VendorSetup'));
const VendorMenu = lazy(() => import('./pages/vendor/VendorMenu'));
import SupabaseHealth from "./components/SupabaseHealth";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/db-test" element={<DatabaseTest />} />
            <Route path="/health" element={<SupabaseHealth />} />
            
            {/* Buyer Routes */}
            <Route
              path="/buyer"
              element={<ProtectedRoute requiredRole="buyer"><BuyerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/buyer/vendors"
              element={<ProtectedRoute requiredRole="buyer"><Vendors /></ProtectedRoute>}
            />
            <Route
              path="/buyer/vendors/:vendorId"
              element={<ProtectedRoute requiredRole="buyer"><BuyerVendorMenu /></ProtectedRoute>}
            />
            <Route
              path="/buyer/cart"
              element={<ProtectedRoute requiredRole="buyer"><Cart /></ProtectedRoute>}
            />
            <Route
              path="/buyer/orders"
              element={<ProtectedRoute requiredRole="buyer"><Orders /></ProtectedRoute>}
            />
            <Route
              path="/buyer/orders/:orderId"
              element={<ProtectedRoute requiredRole="buyer"><OrderDetail /></ProtectedRoute>}
            />
            
            {/* Runner Routes */}
            <Route
              path="/runner"
              element={<ProtectedRoute requiredRole="runner"><RunnerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/runner/orders/:orderId"
              element={<ProtectedRoute requiredRole="runner"><OrderDetail /></ProtectedRoute>}
            />
            
            {/* Vendor Routes */}
            <Route
              path="/vendor"
              element={<ProtectedRoute requiredRole="vendor"><VendorDashboard /></ProtectedRoute>}
            />
            <Route
              path="/vendor/setup"
              element={<ProtectedRoute requiredRole="vendor"><VendorSetup /></ProtectedRoute>}
            />
            <Route
              path="/vendor/menu"
              element={<ProtectedRoute requiredRole="vendor"><VendorMenu /></ProtectedRoute>}
            />
            <Route
              path="/vendor/orders/:orderId"
              element={<ProtectedRoute requiredRole="vendor"><OrderDetail /></ProtectedRoute>}
            />
            
            {/* Shared Routes */}
            <Route
              path="/notifications"
              element={<ProtectedRoute><Notifications /></ProtectedRoute>}
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
