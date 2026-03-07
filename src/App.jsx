import { lazy, Suspense, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import useAuthStore from "./store/useAuthStore";
import useThemeStore from "./store/useThemeStore";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./utils/ScrollToTop";
import Layout from "./layouts/Layout";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import "./App.css";

// ★ 페이지 lazy 로드 — 초기 번들 분리
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Accounts = lazy(() => import("./pages/Accounts/Accounts"));
const Transactions = lazy(() => import("./pages/Transactions/Transactions"));
const Statistics = lazy(() => import("./pages/Statistics/Statistics"));
const Budget = lazy(() => import("./pages/Budget/Budget"));
const Categories = lazy(() => import("./pages/Categories/Categories"));
const AnnualReport = lazy(() => import("./pages/AnnualReport/AnnualReport"));

const PageFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="skeleton" style={{ width: 200, height: 20 }} />
  </div>
);

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
            <Route
              path="/"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/accounts"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Accounts />
                </Suspense>
              }
            />
            <Route
              path="/transactions"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Transactions />
                </Suspense>
              }
            />
            <Route
              path="/statistics"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Statistics />
                </Suspense>
              }
            />
            <Route
              path="/budget"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Budget />
                </Suspense>
              }
            />
            <Route
              path="/categories"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Categories />
                </Suspense>
              }
            />
            <Route
              path="/annual-report"
              element={
                <Suspense fallback={<PageFallback />}>
                  <AnnualReport />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
