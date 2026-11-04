"use client";

import { useRef, useState } from "react";
import { Play, Volume2, VolumeX, X } from "lucide-react";

export default function AboutVideo() {
  const dialog = useRef<HTMLDialogElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState("");

  function openVideo() {
    dialog.current?.showModal();
    setPlaybackError("");
    if (player.current) {
      player.current.muted = false;
      player.current.volume = 1;
      setMuted(false);
      void player.current.play().catch(() => {
        setPlaybackError("Playback could not start. Press play below, or open the video directly.");
      });
    }
  }

  function closeVideo() {
    player.current?.pause();
    dialog.current?.close();
  }

  return (
    <>
      <button type="button" data-about-film onClick={openVideo} className="group flex w-full items-stretch gap-5 overflow-hidden rounded-2xl border border-[#dbe2e9] bg-white p-3 text-left shadow-[0_8px_30px_rgba(16,42,82,0.04)] transition hover:border-[#9cbcd9] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#467eb3] sm:gap-7 sm:p-4">
        <span className="relative block w-24 shrink-0 self-center overflow-hidden rounded-xl bg-[#102a52] sm:w-32">
          {/* A still preview keeps the popup as the only media player. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/about-video-poster.jpg" width={360} height={640} alt="" className="pointer-events-none block aspect-[9/16] w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-[#102a52]/10">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-[#102a52] shadow-lg transition group-hover:scale-110"><Play size={20} fill="currentColor" aria-hidden="true" /></span>
          </span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center py-3 pr-2 sm:pr-4">
          <span className="block text-lg font-semibold leading-tight tracking-[-0.025em] text-[#243E61] sm:text-2xl">Rav Sholom Kamenetzky</span>
          <span className="mt-2 block text-sm font-medium leading-6 text-[#42658a] sm:text-base">Recent trip to Florida</span>
          <span className="mt-1 block text-xs leading-5 text-[#61728A] sm:text-sm">On behalf of Chinuch Yehudi</span>
          <span className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[#e6ecf2] pt-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#467eb3]"><Play size={14} fill="currentColor" aria-hidden="true" />Watch video</span>
            <span className="text-xs tabular-nums text-[#61728A]">1:21</span>
          </span>
        </span>
      </button>
      <dialog ref={dialog} aria-label="Rav Sholom Kamenetzky’s recent trip to Florida" onCancel={() => player.current?.pause()} onClose={() => player.current?.pause()} onClick={(event) => { if (event.target === event.currentTarget) closeVideo(); }} className="fixed inset-0 m-auto max-h-[95svh] w-[min(92vw,480px)] overflow-auto rounded-2xl border border-white/15 bg-[#071628] p-3 text-white shadow-2xl backdrop:bg-[#071628]/80">
        <div className="mb-3 flex items-center justify-between gap-3">
          <button type="button" onClick={() => { if (player.current) { player.current.muted = !muted; if (muted) player.current.volume = 1; setMuted(!muted); } }} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm hover:bg-white/10" aria-label={muted ? "Turn sound on" : "Mute sound"}>
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}{muted ? "Sound off — turn on" : "Sound on"}
          </button>
          <button type="button" onClick={closeVideo} aria-label="Close video" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"><X size={22} /></button>
        </div>
        <video ref={player} src="/about-video.mp4" poster="/about-video-poster.jpg" width={720} height={1280} controls playsInline preload="metadata" onError={() => setPlaybackError("The video could not be loaded. Try opening it directly.")} onVolumeChange={() => setMuted(Boolean(player.current?.muted || player.current?.volume === 0))} className="mx-auto block h-auto max-h-[72svh] w-full rounded-lg object-contain" />
        {playbackError && <p role="status" className="px-2 pt-3 text-sm text-amber-200">{playbackError}</p>}
        <a href="/about-video.mp4" target="_blank" rel="noopener noreferrer" className="mx-2 mt-3 inline-block text-xs text-white/75 underline underline-offset-4">Open video directly</a>
        <p className="px-2 pb-1 pt-3 text-sm text-white/75">Rav Sholom Kamenetzky · On behalf of Chinuch Yehudi</p>
      </dialog>
    </>
  );
}
