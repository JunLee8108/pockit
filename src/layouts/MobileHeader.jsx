import { Wallet } from "lucide-react";

const MobileHeader = () => {
  return (
    <header
      className="
        fixed top-0 left-0 right-0 h-14 z-50
        bg-surface border-b border-border
        flex items-center justify-center px-4
        pt-[env(safe-area-inset-top)]
      "
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-mint-bg flex items-center justify-center">
          <Wallet size={14} className="text-mint" />
        </div>
        <span className="text-[15px] font-bold text-text">Pockit</span>
      </div>
    </header>
  );
};

export default MobileHeader;
