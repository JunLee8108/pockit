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
import "./App.css";

const Placeholder = ({ title }) => (
  <div>
    <h2 className="text-xl font-semibold text-text mb-5">{title}</h2>
    <div className="bg-surface border border-border rounded-xl p-8 text-center text-sub text-[13px]">
      준비 중...
    </div>
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

  // ★ 테마: 시스템 리스너만 등록 (네트워크 호출 없음, 동기적)
  useEffect(() => {
    const cleanup = initializeTheme();
    return cleanup;
  }, [initializeTheme]);

  // ★ 로그인 시 1회만 DB 테마 로드 (중복 방지)
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
            <Route path="/budget" element={<Placeholder title="예산" />} />
            <Route
              path="/categories"
              element={<Placeholder title="카테고리" />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
