import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Wallet, Mail } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const inputClass =
  "w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text outline-none transition-colors duration-150 focus:border-mint";

const SignUp = () => {
  const { user, loading, error, signUp, clearError } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState("");

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("비밀번호가 일치하지 않습니다");
      return;
    }
    if (password.length < 6) {
      setLocalError("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    setSubmitting(true);
    const { error: err } = await signUp(email, password, displayName);
    setSubmitting(false);
    if (!err) setSuccess(true);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg p-5">
      <div className="w-full max-w-[420px] bg-surface border border-border rounded-2xl px-9 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-mint-bg inline-flex items-center justify-center mb-4">
            <Wallet size={24} className="text-mint" />
          </div>
          <h1 className="text-xl font-bold text-text mb-1">회원가입</h1>
          <p className="text-[13px] text-sub">새 계정을 만들어 시작하세요</p>
        </div>

        {success ? (
          <div className="text-center py-6 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-mint-bg flex items-center justify-center">
              <Mail size={28} className="text-mint" />
            </div>
            <p className="text-[15px] text-text font-medium">
              인증 이메일을 발송했습니다
            </p>
            <p className="text-[13px] text-sub leading-relaxed">
              {email}로 발송된 이메일의 링크를 클릭하여 계정을 활성화해 주세요.
            </p>
            <Link
              to="/login"
              className="mt-2 py-3 bg-mint text-white rounded-lg text-[15px] font-semibold text-center block w-full"
            >
              로그인 페이지로
            </Link>
          </div>
        ) : (
          <>
            {/* Error */}
            {displayError && (
              <div className="px-4 py-3 bg-error-bg rounded-lg text-[13px] text-error mb-5">
                {displayError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-sub font-medium">이름</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="표시될 이름"
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-sub font-medium">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                    setLocalError("");
                  }}
                  placeholder="email@example.com"
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-sub font-medium">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError("");
                  }}
                  placeholder="6자 이상"
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-sub font-medium">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setLocalError("");
                  }}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className={inputClass}
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
                {submitting ? "가입 중..." : "회원가입"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-[13px] text-sub">
              이미 계정이 있으신가요?{" "}
              <Link to="/login" className="text-mint font-semibold">
                로그인
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignUp;
