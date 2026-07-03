import Card from "./Card";

export default function StatCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-xs uppercase tracking-widest text-white/60">
        {label}
      </p>

      <h2 className={`text-4xl font-black mt-3 ${color}`}>
        {value}
      </h2>
    </Card>
  );
}