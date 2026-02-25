import { CATEGORY_ICON_MAP } from "../utils/categoryIcons";
import { Package } from "lucide-react";

const CategoryIcon = ({ name, size = 18, style, className }) => {
  const Icon = CATEGORY_ICON_MAP[name] || Package;
  return <Icon size={size} style={style} className={className} />;
};

export default CategoryIcon;
