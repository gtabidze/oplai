export const Logo = ({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="8" fill="currentColor" />
      <path
        d="M20 10L22.5 17.5H30L23.75 22L26.25 29.5L20 25L13.75 29.5L16.25 22L10 17.5H17.5L20 10Z"
        fill="white"
      />
    </svg>
  );
};
