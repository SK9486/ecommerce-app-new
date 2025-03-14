import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LogInPage from "./pages/LogInPage";
import Navbar from "./components/Navbar";
import CategoryPage from "./pages/CategoryPage";
import CartPage from "./pages/CartPage";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "../store/useUserStore";
import { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import AdminPage from "./pages/AdminPage";
import LoadingSpinner from "./components/LoadingSpinner";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

const App = () => {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getCartItems } = useCartStore();
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    const authCheck = async () => {
      try {
        console.log("Checking auth in App...");
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed in App:", error);
      }
    };

    authCheck();

    const timeout = setTimeout(() => {
      if (checkingAuth) {
        console.warn("Auth check timed out, proceeding anyway...");
        setAuthTimeout(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    console.log("User authenticated, fetching cart items...");
    getCartItems();
  }, [getCartItems, user]);

  if (checkingAuth && !authTimeout) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen overflow-auto bg-gray-900 text-white relative">
      <div className="absolute inset-0 overflow-auto">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.2)_45%,rgba(0,0,0,0.1)_100%)]" />
        </div>
        <div className="relative z-50 pt-20">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/signup"
              element={!user ? <SignUpPage /> : <Navigate to="/" />}
            />
            <Route
              path="/login"
              element={!user ? <LogInPage /> : <Navigate to="/" />}
            />
            <Route
              path="/secret-dashboard"
              element={
                user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />
              }
            />
            <Route path="/category/:category" element={<CategoryPage />} />
            <Route
              path="/cart"
              element={user ? <CartPage /> : <Navigate to="/login" />}
            />
            <Route path="/purchase-success" element={<PurchaseSuccessPage />} />
            <Route path="/purchase-cancel" element={<PurchaseCancelPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default App;
