"use client";

import { useCallback, useRef, useState } from "react";
import { Volume2, Loader2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import {
  fetchElevenLabsSpeech,
  resolveElevenLabsVoiceId,
  clampTtsSpeed,
  TTS_SPEED_DEFAULT,
} from "@/lib/elevenlabs-tts";
import type { TtsAccent } from "@/types";

type Props = {
  text: string;
  className?: string;
  size?: number;
};

export default function TtsButton({ text, className, size = 16 }: Props) {
  const { settings } = useSettings();
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    cleanup();
    setState("idle");
  }, [cleanup]);

  const speak = useCallback(async () => {
    if (state === "playing" || state === "loading") {
      stop();
      return;
    }

    if (!text.trim()) return;
    cancelledRef.current = false;

    const apiKey = (settings.elevenLabsApiKey || "").trim();
    const accent: TtsAccent = settings.ttsAccent === "gb" ? "gb" : "us";
    const speed = clampTtsSpeed(settings.ttsElevenLabsSpeed ?? TTS_SPEED_DEFAULT);

    if (apiKey) {
      setState("loading");
      try {
        const voiceId = resolveElevenLabsVoiceId(
          accent,
          settings.ttsElevenLabsVoiceUs,
          settings.ttsElevenLabsVoiceGb
        );
        const buf = await fetchElevenLabsSpeech({
          apiKey,
          text: text.trim(),
          accent,
          voiceId,
          speed,
        });
        if (cancelledRef.current) return;
        cleanup();
        const blob = new Blob([buf], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setState("idle");
          cleanup();
        };
        audio.onerror = () => {
          setState("idle");
          cleanup();
        };
        await audio.play();
        if (!cancelledRef.current) setState("playing");
      } catch {
        if (!cancelledRef.current) {
          setState("idle");
          speakBrowser(text.trim(), accent, speed);
        }
      }
      return;
    }

    speakBrowser(text.trim(), accent, speed);
  }, [text, state, settings, stop, cleanup]);

  function speakBrowser(t: string, accent: TtsAccent, speed: number) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = accent === "gb" ? "en-GB" : "en-US";
    u.rate = Math.min(2, Math.max(0.5, speed));
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    setState("playing");
    window.speechSynthesis.speak(u);
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-2 transition-all",
        "hover:bg-accent active:scale-90",
        state === "playing" && "text-primary",
        state === "loading" && "text-muted animate-pulse",
        state === "idle" && "text-muted/50 hover:text-foreground",
        className
      )}
      title={state === "idle" ? "Listen" : state === "loading" ? "Loading…" : "Stop"}
    >
      {state === "loading" ? (
        <Loader2 size={size} className="animate-spin" />
      ) : state === "playing" ? (
        <Square size={size - 2} className="fill-current" strokeWidth={0} />
      ) : (
        <Volume2 size={size} />
      )}
    </button>
  );
}
