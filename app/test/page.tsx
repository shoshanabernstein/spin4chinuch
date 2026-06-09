export default function TestPage() {
  return (
    <div>
      <h1>Supabase Test</h1>

      <p>{process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
    </div>
  );
}