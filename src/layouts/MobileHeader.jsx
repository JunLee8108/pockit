import { useNavigate } from "react-router";
import { Wallet, Search } from "lucide-react";

const MobileHeader = () => {
  const navigate = useNavigate();

  return (
    <header
      className="
        fixed top-0 left-0 right-0 h-14 z-50
        bg-surface border-b border-border
        flex items-center justify-between px-4
        pt-[env(safe-area-inset-top)]
      "
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-mint-bg flex items-center justify-center">
          <Wallet size={14} className="text-mint" />
        </div>
        <span className="text-[15px] font-bold text-text">Pockit</span>
      </div>
      <button
        onClick={() => navigate("/search")}
        className="p-1.5 rounded-lg text-sub hover:bg-light cursor-pointer bg-transparent border-none transition-colors"
      >
        <Search size={18} />
      </button>
    </header>
  );
};

export default MobileHeader;
