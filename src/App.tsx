import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
            
            {/* Buyer Routes */}
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/buyer/vendors" element={<Vendors />} />
            <Route path="/buyer/vendors/:vendorId" element={<BuyerVendorMenu />} />
            <Route path="/buyer/cart" element={<Cart />} />
            <Route path="/buyer/orders" element={<Orders />} />
            <Route path="/buyer/orders/:orderId" element={<OrderDetail />} />
            
            {/* Runner Routes */}
            <Route path="/runner" element={<RunnerDashboard />} />
            <Route path="/runner/orders/:orderId" element={<OrderDetail />} />
            
            {/* Vendor Routes */}
            <Route path="/vendor" element={<VendorDashboard />} />
            <Route path="/vendor/setup" element={<VendorSetup />} />
            <Route path="/vendor/menu" element={<VendorMenu />} />
            <Route path="/vendor/orders/:orderId" element={<OrderDetail />} />
            
            {/* Shared Routes */}
            <Route path="/notifications" element={<Notifications />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
