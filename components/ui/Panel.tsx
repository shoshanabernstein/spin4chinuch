export default function Panel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur-xl p-10 shadow-2xl">
      {title && (
        <h2 className="text-3xl font-black mb-6">{title}</h2>
      )}
      {children}
    </div>
  );
}