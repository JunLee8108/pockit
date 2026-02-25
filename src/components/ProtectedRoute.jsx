import { Navigate, Outlet } from "react-router";
import useAuthStore from "../store/useAuthStore";

const ProtectedRoute = () => {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-sub text-[15px]">
        로딩 중...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
