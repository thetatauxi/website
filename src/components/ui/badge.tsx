import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

const Badge = ({ children, className }: BadgeProps) => {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
