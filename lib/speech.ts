"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/** Slow and steady, so each letter is easy to catch. */
const RATE = 0.5;
const PITCH = 1;
/** In case a browser never reports the end of an utterance. */
const MAX_SPEAKING_MS = 4000;

function subscribe() {
  return () => {};
}

function isSupported() {
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/**
 * Karen (en-AU) is the preferred voice. Voice names vary a little between
 * platforms ("Karen", "Karen (Enhanced)"), and Android reports "en_AU", so
 * match loosely, then fall back to any Australian voice, then the default.
 */
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const australian = voices.filter((voice) =>
    voice.lang.replace("_", "-").toLowerCase().startsWith("en-au"),
  );
  return (
    australian.find((voice) => voice.name.toLowerCase().startsWith("karen")) ??
    voices.find((voice) => voice.name.toLowerCase().startsWith("karen")) ??
    australian[0]
  );
}

/** Speak a single letter aloud, and report while it is being spoken. */
export function useSpeakLetter() {
  const supported = useSyncExternalStore(subscribe, isSupported, () => false);
  const [speaking, setSpeaking] = useState(false);
  // Chrome can drop an utterance that nothing references before it ends.
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const fallback = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!supported) return;
    // Some browsers load their voices lazily; asking early warms the list.
    window.speechSynthesis.getVoices();
    return () => {
      window.clearTimeout(fallback.current);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.clearTimeout(fallback.current);
    utterance.current = null;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (letter: string) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      window.clearTimeout(fallback.current);

      // Upper case, so "A" is read as the letter rather than the word "a".
      const next = new SpeechSynthesisUtterance(letter.toUpperCase());
      const voice = pickVoice();
      if (voice) {
        next.voice = voice;
        next.lang = voice.lang;
      } else {
        next.lang = "en-AU";
      }
      next.rate = RATE;
      next.pitch = PITCH;

      const done = () => {
        if (utterance.current !== next) return;
        window.clearTimeout(fallback.current);
        utterance.current = null;
        setSpeaking(false);
      };
      next.onend = done;
      next.onerror = done;

      utterance.current = next;
      setSpeaking(true);
      fallback.current = window.setTimeout(done, MAX_SPEAKING_MS);
      synth.speak(next);
    },
    [supported],
  );

  return { supported, speaking, speak, stop };
}
