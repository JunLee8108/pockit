import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import useAuthStore from "./store/useAuthStore";
import useThemeStore from "./store/useThemeStore";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./utils/ScrollToTop";
import Layout from "./layouts/Layout";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Accounts from "./pages/Accounts/Accounts";
import Transactions from "./pages/Transactions/Transactions";
import Dashboard from "./pages/Dashboard/Dashboard";
import Statistics from "./pages/Statistics/Statistics";
import Budget from "./pages/Budget/Budget";
import Categories from "./pages/Categories/Categories";
import "./App.css";

const App = () => {
  const initialize = useAuthStore((s) => s.initialize);
  const user = useAuthStore((s) => s.user);
  const initializeTheme = useThemeStore((s) => s.initialize);
  const loadedUserRef = useRef(null);

  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup?.then((unsub) => unsub?.());
    };
  }, [initialize]);

  useEffect(() => {
    const cleanup = initializeTheme();
    return cleanup;
  }, [initializeTheme]);

  useEffect(() => {
    if (user && user.id !== loadedUserRef.current) {
      loadedUserRef.current = user.id;
      useThemeStore.getState().loadUserTheme(user.id);
    }
  }, [user]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/categories" element={<Categories />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
