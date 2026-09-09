"use client";
import { useCallback, useEffect, useRef } from "react";
import { HERO_FRAME_COUNT, HERO_SCROLL } from "@/data/hero";
import type { SequenceHandle } from "@/components/sequence/FrameSequence";
import { getGsap } from "@/lib/gsap";

/** How long the hand must be still before the film plays on its own. */
const IDLE_AFTER_MS = 900;
/** Frames of the scrub sequence per second of film. */
const SEQ_FPS = 10;
/** If the film cannot play, the canvas drifts instead, at this many frames a second. */
const DRIFT_RATE = 4.5;
/** How long to wait for the film before falling back to the canvas. */
const FILM_PATIENCE_MS = 5000;

/**
 * Pins the hero and ties the footage to scroll.
 *
 * Two pictures of the same film sit on top of each other. While the hand
 * moves, the canvas shows the scrub frame for the scroll position. When the
 * hand has been still for a moment, the film itself plays, hardware-decoded
 * at its native rate, from that same moment, and the canvas fades under it.
 * When the hand moves again the film pauses, its time becomes the canvas
 * offset, and the canvas fades back on top: the picture never jumps in
 * either direction. The offset stays, so the scrub carries on from wherever
 * the film got to, forward or back.
 */
export function useHeroScrub() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sequenceRef = useRef<SequenceHandle | null>(null);

  const onSequenceReady = useCallback((handle: SequenceHandle) => {
    sequenceRef.current = handle;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section) return;
    const { gsap, ScrollTrigger } = getGsap();
    const N = HERO_FRAME_COUNT;
    const playhead = { frame: 0 };
    let drift = 0;
    let lastScrollAt = performance.now();
    let lastDrawn = -1;
    let filmOn = false;
    let filmReady = false;
    let filmFailed = false;
    let filmRequestedAt = 0;
    let lastTick = performance.now();

    const position = () => (((playhead.frame + drift) % N) + N) % N;
    const show = () => {
      const pos = position();
      if (Math.abs(pos - lastDrawn) < 0.004) return;
      lastDrawn = pos;
      sequenceRef.current?.draw(pos);
    };

    /** Ask for the film only once the scrub frames are in, so it never competes with the first paint. */
    const requestFilm = () => {
      if (!video || filmRequestedAt || filmFailed) return;
      filmRequestedAt = performance.now();
      try {
        video.load();
      } catch {
        filmFailed = true;
      }
    };
    const filmIn = () => {
      if (!video || filmOn || !filmReady || filmFailed) return;
      filmOn = true;
      video.currentTime = position() / SEQ_FPS;
      void video.play().catch(() => {
        filmOn = false;
        filmFailed = true;
      });
      gsap.to(video, { opacity: 1, duration: 0.35, ease: "power1.out", overwrite: true });
    };
    const filmOut = () => {
      if (!video || !filmOn) return;
      filmOn = false;
      // the film's moment becomes the scrub's offset, then the canvas takes over
      drift = video.currentTime * SEQ_FPS - playhead.frame;
      lastDrawn = -1;
      show();
      video.pause();
      gsap.to(video, { opacity: 0, duration: 0.25, ease: "power1.out", overwrite: true });
    };

    const onCanPlay = () => {
      filmReady = true;
    };
    const onError = () => {
      filmFailed = true;
    };
    video?.addEventListener("canplay", onCanPlay);
    video?.addEventListener("error", onError);
    if (video && video.readyState >= 3) filmReady = true;

    const ctx = gsap.context(() => {
      const tween = gsap.to(playhead, {
        frame: N - 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${HERO_SCROLL * 100}%`,
          pin: true,
          pinSpacing: true,
          scrub: 0.45,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: () => {
            lastScrollAt = performance.now();
            filmOut();
          },
          onLeave: filmOut,
          onLeaveBack: filmOut,
        },
        onUpdate: show,
      });
      const st = tween.scrollTrigger!;

      // Runs on GSAP's own ticker: no React, no layout reads.
      const tick = () => {
        const now = performance.now();
        const dt = Math.min(now - lastTick, 50) / 1000;
        lastTick = now;
        const visible = document.visibilityState === "visible";
        const idle = now - lastScrollAt > IDLE_AFTER_MS;
        if (sequenceRef.current?.ready) requestFilm();
        if (filmRequestedAt && !filmReady && !filmFailed && now - filmRequestedAt > FILM_PATIENCE_MS) filmFailed = true;
        if (idle && st.isActive && visible) {
          if (filmReady && !filmFailed) filmIn();
          else if (filmFailed) {
            // the film is not coming: the canvas carries the idle motion instead
            drift += DRIFT_RATE * dt;
            show();
          }
        } else if (filmOn && (!st.isActive || !visible)) filmOut();
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      video?.removeEventListener("canplay", onCanPlay);
      video?.removeEventListener("error", onError);
      video?.pause();
      ctx.revert();
    };
  }, []);

  return { sectionRef, videoRef, onSequenceReady };
}
