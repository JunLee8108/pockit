import { useCallback } from "react";
import useConfirmStore from "../store/useConfirmStore";

const useConfirm = () => {
  const openConfirm = useConfirmStore((s) => s.openConfirm);

  return useCallback((options) => openConfirm(options), [openConfirm]);
};

export default useConfirm;
