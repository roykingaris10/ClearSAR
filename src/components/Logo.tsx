interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showMark?: boolean;
}

const SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

const MARK_SIZES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-10 w-10",
};

/**
 * ClearSAR wordmark — matte Azure blue.
 * The mark is a rounded "C" badge that echoes the clearance motion:
 * an arc that sweeps a backlog into clarity.
 */
export function Logo({ className = "", size = "md", showMark = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showMark && (
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={MARK_SIZES[size]}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a86ff" />
              <stop offset="100%" stopColor="#0054b3" />
            </linearGradient>
          </defs>
          <rect
            x="1"
            y="1"
            width="38"
            height="38"
            rx="10"
            fill="url(#logoGrad)"
          />
          <path
            d="M28 14.5a9 9 0 1 0 0 11"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="28" cy="25.5" r="1.6" fill="white" />
        </svg>
      )}
      <span
        className={`logo-wordmark ${SIZES[size]} leading-none`}
        style={{ fontWeight: 700, letterSpacing: "-0.025em" }}
      >
        ClearSAR
      </span>
    </div>
  );
}
