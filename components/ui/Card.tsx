export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-3xl
        bg-white/10
        backdrop-blur-xl
        border border-white/10
        shadow-2xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}