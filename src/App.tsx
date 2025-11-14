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
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import Vendors from "./pages/buyer/Vendors";
import BuyerVendorMenu from "./pages/buyer/VendorMenu";
import Cart from "./pages/buyer/Cart";
import Orders from "./pages/buyer/Orders";
import OrderDetail from "./pages/buyer/OrderDetail";
import RunnerDashboard from "./pages/runner/RunnerDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorSetup from "./pages/vendor/VendorSetup";
import VendorMenu from "./pages/vendor/VendorMenu";
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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/db-test" element={<DatabaseTest />} />
            
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
