import { type FC, type ReactNode } from "react";

// hooks
import { useTheme } from "../hooks";

interface IProps {
  children: ReactNode;
  className?: string;
}

const Shadowbox: FC<IProps> = ({ children, className }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`rounded-3xl border p-0 sm:p-5 shadow-[0_20px_45px_var(--tw-shadow-color)] transition-all duration-300 ${className || ""} ${theme === "light" ? "border-lightgray shadow-lightshadow" : "border-darkgray shadow-darkshadow"}`}
    >
      {children}
    </div>
  );
};

export default Shadowbox;
