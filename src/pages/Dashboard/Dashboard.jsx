/* ============================================================
   📁 src/pages/Dashboard/Dashboard.jsx (플레이스홀더)
   ============================================================ */

import useAuthStore from "../../store/useAuthStore";

const Dashboard = () => {
  const { profile } = useAuthStore();

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-5">대시보드</h2>
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-sub">
        <p className="text-[15px] mb-2">
          환영합니다{profile?.display_name ? `, ${profile.display_name}` : ""}{" "}
          👋
        </p>
        <p className="text-[13px]">대시보드 컨텐츠가 여기에 들어갑니다</p>
      </div>
    </div>
  );
};

export default Dashboard;
