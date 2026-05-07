export function MediQuickLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="10" fill="currentColor" className="text-primary" />
      <path
        d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32C26.627 32 32 26.627 32 20C32 13.373 26.627 8 20 8Z"
        fill="white"
        fillOpacity="0.15"
      />
      <path
        d="M17 13H23V17H27V23H23V27H17V23H13V17H17V13Z"
        fill="white"
      />
      <circle cx="28" cy="12" r="3" fill="white" fillOpacity="0.9" />
      <path
        d="M27 10.5L28.5 12L30 10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        className="text-primary"
      />
    </svg>
  );
}

export function MediQuickLogoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17 13H23V17H27V23H23V27H17V23H13V17H17V13Z"
        fill="currentColor"
      />
      <circle cx="28" cy="12" r="3.5" fill="currentColor" fillOpacity="0.7" />
    </svg>
  );
}
