export const Logo = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Document shape */}
      <path
        d="M10 6C10 4.89543 10.8954 4 12 4H24L34 14V34C34 35.1046 33.1046 36 32 36H12C10.8954 36 10 35.1046 10 34V6Z"
        fill="currentColor"
      />
      {/* Folded corner */}
      <path
        d="M24 4V12C24 13.1046 24.8954 14 26 14H34L24 4Z"
        fill="currentColor"
        opacity="0.6"
      />
      {/* Star inside document */}
      <path
        d="M20 16L21.5 21H26.5L22.5 24L24 29L20 26L16 29L17.5 24L13.5 21H18.5L20 16Z"
        fill="white"
      />
    </svg>
  );
};
