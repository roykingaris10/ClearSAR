interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  return (
    <span
      className={`logo-wordmark ${SIZES[size]} leading-none ${className}`}
    >
      ClearSAR
    </span>
  );
}
