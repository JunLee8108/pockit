import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Wallet } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const Login = () => {
  const { user, loading, error, signIn, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-[420px] bg-surface border border-border rounded-2xl px-9 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-mint-bg inline-flex items-center justify-center mb-4">
            <Wallet size={24} className="text-mint" />
          </div>
          <h1 className="text-xl font-bold text-text mb-1">Pockit</h1>
          <p className="text-[13px] text-sub">로그인하여 시작하세요</p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-error-bg rounded-lg text-[13px] text-error mb-5">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[13px] text-sub font-medium">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="email@example.com"
              required
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] text-sub font-medium">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              placeholder="비밀번호를 입력하세요"
              required
              className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full mt-2 py-3 rounded-lg text-[15px] font-semibold text-white border-none cursor-pointer transition-colors duration-150 ${
              submitting
                ? "bg-border cursor-not-allowed"
                : "bg-mint hover:bg-mint-hover"
            }`}
          >
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-[13px] text-sub">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="text-mint font-semibold">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
