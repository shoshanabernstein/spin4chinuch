"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function PrizeLogoUpload({ prizeId, name, onUploaded }: { prizeId: number; name: string; onUploaded: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function upload(files: File[]) {
    if (uploading.current || !files.length) return;
    if (files.length !== 1) return toast.error("Drop one logo at a time.");
    const file = files[0];
    if (!/\.(png|jpe?g)$/i.test(file.name) || file.size > 3 * 1024 * 1024) return toast.error("Choose a PNG or JPG logo up to 3 MB.");
    uploading.current = true;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const form = new FormData();
      form.set("prizeId", String(prizeId));
      form.set("file", file);
      const response = await fetch("/api/admin/prize-logo", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to upload logo.");
      onUploaded(result.imageUrl);
      toast.success("Logo saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload logo. Please retry.");
    } finally { uploading.current = false; setBusy(false); }
  }

  return <div className="absolute inset-2 z-20 rounded-2xl border-2 border-dashed border-blue-500"
    onDragOver={event => { if (!event.dataTransfer.types.includes("Files")) return; event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "copy"; setOver(true); }}
    onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false); }}
    onDrop={event => { if (!event.dataTransfer.types.includes("Files")) return; event.preventDefault(); event.stopPropagation(); setOver(false); void upload(Array.from(event.dataTransfer.files)); }}>
    <input ref={input} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="hidden" disabled={busy} aria-label={`Logo for ${name}`} onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void upload(files); }} />
    <button type="button" disabled={busy} aria-label={`Upload logo for ${name}`} onClick={() => input.current?.click()}
      className={`flex h-full w-full items-end justify-center p-3 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-500 disabled:cursor-wait ${over ? "bg-blue-100/70 ring-4 ring-inset ring-blue-500" : "hover:bg-blue-100/20"}`}>
      <span className="rounded-xl bg-[#2F6ED8] px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
        <span className="block">{busy ? "Saving logo…" : "Drop logo here"}</span>
        <span className="mt-1 block text-xs font-normal">or click to choose · PNG/JPG up to 3 MB</span>
      </span>
    </button>
  </div>;
}
