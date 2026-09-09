"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { rooms, site } from "@/data/site";
import { getGsap, reducedMotion } from "@/lib/gsap";

/**
 * The story of the house, told by scroll:
 *
 *   the long room        the hero: the photograph drifts and the name lifts away
 *   the marquee          स्वाद · सत्कार, moved by the scroll and skewed by its speed
 *   two words            the paragraph brightens word by word as the line passes
 *   the slats            the gap between two slats opens into the lounge
 *   the rooms            vertical scroll drives the four rooms sideways
 *   day to night         one photograph of the veranda, graded from lunch to last call
 *   the numbers          counted up, and back down, by the scroll
 *
 * Every frame is a function of scroll position. Under prefers-reduced-motion
 * nothing pins and each scene rests at its finished state.
 */

const FACTS = [
  { n: 4, l: "Rooms", d: "Veranda, Snug, Lounge, Long Room." },
  { n: 7, l: "Katori on the thali", d: "Plus rice in the middle, and it is refilled." },
  { n: 6, l: "Seats behind a closed door", d: "The Snug, bookable as a whole room." },
];
const HERO_WORDS = ["Swad", "Satkar"];
const STORY = "Two words over the door. Swad is what leaves the kitchen — dal simmered down, gundruk sharp with the ferment, masu cooked slow. Satkar is what happens at the table: the water poured before you ask, the second helping of rice you did not order, the room kept warm for as long as you want to sit in it. One is cooked. The other is practised.";
const MARQUEE = Array.from({ length: 12 }, (_, i) => i);
const pad2 = (n: number) => String(n).padStart(2, "0");

export function StoryScenes() {
  const root = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const shot = useRef<HTMLDivElement>(null);
  const heroWords = useRef<(HTMLSpanElement | null)[]>([]);
  const heroSub = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const cueLine = useRef<HTMLSpanElement>(null);
  const mTrack = useRef<HTMLDivElement>(null);
  const storyText = useRef<HTMLParagraphElement>(null);
  const storyWords = useRef<(HTMLSpanElement | null)[]>([]);
  const reveal = useRef<HTMLElement>(null);
  const revFrame = useRef<HTMLDivElement>(null);
  const barL = useRef<HTMLDivElement>(null);
  const barR = useRef<HTMLDivElement>(null);
  const revCap = useRef<HTMLDivElement>(null);
  const roomsSec = useRef<HTMLElement>(null);
  const roomTrack = useRef<HTMLDivElement>(null);
  const dusk = useRef<HTMLElement>(null);
  const duskImg = useRef<HTMLDivElement>(null);
  const duskNight = useRef<HTMLDivElement>(null);
  const duskLamps = useRef<HTMLDivElement>(null);
  const phaseDay = useRef<HTMLDivElement>(null);
  const phaseNight = useRef<HTMLDivElement>(null);
  const counts = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = reducedMotion();
    if (reduced.current) {
      // rest at the finished states
      counts.current.forEach((el, i) => { if (el) el.textContent = pad2(FACTS[i].n); });
      return;
    }
    const { gsap, ScrollTrigger } = getGsap();
    const ctx = gsap.context(() => {
      /* the hero: parallax, a slow scale-out, the words lifting away */
      gsap.timeline({ scrollTrigger: { trigger: hero.current, start: "top top", end: "bottom top", scrub: 0.6 } })
        .to(shot.current, { yPercent: 14, scale: 1.06, ease: "none" }, 0)
        .to(heroWords.current.filter(Boolean), { yPercent: -115, opacity: 0, stagger: 0.06, ease: "power2.in" }, 0)
        .to([heroSub.current, cue.current], { opacity: 0, ease: "none" }, 0);
      gsap.to(cueLine.current, { scaleX: 0.15, duration: 1.1, repeat: -1, yoyo: true, ease: "power1.inOut" });

      /* the marquee: moved by the scroll, skewed by its speed */
      const mt = mTrack.current!;
      const mx = gsap.quickTo(mt, "x", { duration: 0.5, ease: "power3" });
      const msk = gsap.quickTo(mt, "skewX", { duration: 0.55, ease: "power3" });
      let half = mt.scrollWidth / 2;
      const measure = () => { half = mt.scrollWidth / 2; };
      window.addEventListener("resize", measure);
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (s) => { msk(gsap.utils.clamp(-16, 16, s.getVelocity() / 220)); mx(-((window.scrollY * 0.35) % half)); },
      });

      /* the paragraph brightens as the line passes */
      gsap.to(storyWords.current.filter(Boolean), { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: storyText.current, start: "top 82%", end: "bottom 55%", scrub: true } });

      /* the gap between the slats opens into the room */
      gsap.timeline({ scrollTrigger: { trigger: reveal.current, start: "top top", end: "bottom bottom", scrub: 0.5, onUpdate: (s) => { reveal.current!.dataset.t = s.progress.toFixed(3); } } })
        .fromTo(revFrame.current, { clipPath: "inset(0% 42% 0% 42%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut" }, 0)
        .fromTo(barL.current, { x: 0 }, { x: "-42vw", ease: "power2.inOut" }, 0)
        .fromTo(barR.current, { x: 0 }, { x: "42vw", ease: "power2.inOut" }, 0)
        .to([barL.current, barR.current], { opacity: 0, ease: "none" }, 0.55)
        .fromTo(revCap.current, { y: 0, opacity: 1 }, { y: -40, opacity: 0, ease: "power2.in" }, 0.45);

      /* the rooms: vertical scroll drives the rail sideways */
      const track = roomTrack.current!;
      ScrollTrigger.create({
        trigger: roomsSec.current, start: "top top", pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        end: () => `+=${track.scrollWidth - window.innerWidth + window.innerHeight * 0.4}`,
        animation: gsap.to(track, { x: () => -(track.scrollWidth - window.innerWidth + 32), ease: "none" }),
        onUpdate: (s) => { roomsSec.current!.dataset.t = s.progress.toFixed(3); },
      });

      /* one photograph, two services */
      gsap.timeline({ scrollTrigger: { trigger: dusk.current, start: "top top", end: "bottom bottom", scrub: 0.7, onUpdate: (s) => { dusk.current!.dataset.t = s.progress.toFixed(3); } } })
        .fromTo(duskImg.current, { filter: "brightness(1.02) saturate(1.02) contrast(1)" }, { filter: "brightness(.42) saturate(.72) contrast(1.12) hue-rotate(-10deg)", ease: "power1.inOut" }, 0)
        .fromTo(duskNight.current, { opacity: 0 }, { opacity: 0.82, ease: "power1.in" }, 0)
        .fromTo(duskLamps.current, { opacity: 0 }, { opacity: 0.85, ease: "power2.in" }, 0.28)
        .to(phaseDay.current, { opacity: 0, y: -24, ease: "power2.in" }, 0.34)
        .fromTo(phaseNight.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: "power2.out" }, 0.44);

      /* the numbers, scrubbed so they rewind */
      counts.current.forEach((el, i) => {
        if (!el) return;
        const o = { v: 0 };
        gsap.to(o, { v: FACTS[i].n, ease: "none", scrollTrigger: { trigger: el, start: "top 88%", end: "top 52%", scrub: true }, onUpdate: () => { el.textContent = pad2(Math.round(o.v)); } });
      });

      return () => window.removeEventListener("resize", measure);
    }, root);
    const late = window.setTimeout(() => ScrollTrigger.refresh(), 800);
    return () => { window.clearTimeout(late); ctx.revert(); };
  }, []);

  return (
    <div ref={root} className="story-scenes">
      {/* the long room */}
      <section ref={hero} className="st-hero" aria-labelledby="story-title">
        <div ref={shot} className="st-shot">
          <Image src={rooms[3].src} alt={rooms[3].alt} fill priority sizes="100vw" className="object-cover object-[50%_58%]" />
        </div>
        <div aria-hidden className="st-veil" />
        <div className="st-content">
          <p className="st-eyebrow">Our Story</p>
          <h1 id="story-title" className="st-h1">
            {HERO_WORDS.map((w, i) => <span key={w}><span ref={(el) => { heroWords.current[i] = el; }} className="st-w">{w}</span>{i < HERO_WORDS.length - 1 ? " " : ""}</span>)}
          </h1>
          <div ref={heroSub} className="st-sub">
            <span lang="ne" className="st-deva">स्वाद &amp; सत्कार</span>
            <span>Flavour <b>&amp;</b> Hospitality</span>
            <span>Thakali kitchen <b>·</b> Bar <b>·</b> Four rooms</span>
          </div>
        </div>
        <div ref={cue} className="st-cue motion-reduce:hidden" aria-hidden><span>Scroll</span><span ref={cueLine} /></div>
      </section>

      {/* the marquee */}
      <div className="st-marquee" aria-hidden>
        <div ref={mTrack} className="st-mtrack">
          {MARQUEE.map((i) => <span key={i} lang="ne">स्वाद <b>·</b> सत्कार <b>·</b> Swad <b>·</b> Satkar <b>·</b></span>)}
        </div>
      </div>

      {/* two words over the door */}
      <section className="st-story" aria-label="The two words">
        <div aria-hidden className="st-slats" />
        <div className="st-wrap st-story-grid">
          <aside className="st-aside">
            <p className="st-eyebrow mb-[.6rem]">The house</p>
            Brick, bamboo weave and lamplight upstairs. Cut stone, dark board floors and leather below.
          </aside>
          <p ref={storyText} className="st-big">
            {STORY.split(/\s+/).map((w, i, a) => <span key={i}><span ref={(el) => { storyWords.current[i] = el; }} className="st-w">{w}</span>{i < a.length - 1 ? " " : ""}</span>)}
          </p>
        </div>
      </section>

      {/* the slats */}
      <section ref={reveal} className="st-reveal" data-t="0" aria-label="The lounge, past the slats">
        <div className="st-sticky">
          <div ref={revFrame} className="st-frame">
            <Image src={rooms[2].src} alt={rooms[2].alt} fill sizes="100vw" className="object-cover object-[52%_50%]" />
          </div>
          <div ref={barL} className="st-bar" style={{ left: "42%" }} aria-hidden />
          <div ref={barR} className="st-bar" style={{ left: "58%" }} aria-hidden />
          <div ref={revCap} className="st-cap">
            <h2>Come down<br />the stairs</h2>
            <p>The lounge, past the slats</p>
          </div>
        </div>
      </section>

      {/* the rooms */}
      <section ref={roomsSec} className="st-rooms" data-t="0" aria-labelledby="rooms-title">
        <div className="st-wrap st-rooms-head">
          <p className="st-eyebrow"><span className="st-num">04</span>Rooms</p>
          <h2 id="rooms-title" className="st-h2 st-measure">One kitchen, four ways to sit down.</h2>
        </div>
        <div className="st-viewport">
          <div ref={roomTrack} className="st-rtrack">
            {rooms.map((r) => (
              <article key={r.idx} className="st-room">
                <figure>
                  <span className="st-idx">{r.idx}</span>
                  <Image src={r.src} alt={r.alt} width={r.w} height={r.h} sizes="(min-width: 760px) 26rem, 74vw" priority={r.src === rooms[3].src} className="st-room-img" />
                </figure>
                <h3>{r.name}</h3>
                <div className="st-meta">{r.meta}</div>
                <p>{r.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* day to night */}
      <section ref={dusk} className="st-dusk" data-t="0" aria-label="By day and by night">
        <div className="st-sticky">
          <div ref={duskImg} className="st-dshot">
            <Image src={rooms[0].src} alt="The veranda seen through its arched windows as daylight falls and the lamps come up." fill sizes="100vw" className="object-cover object-[56%_46%]" />
          </div>
          <div ref={duskNight} className="st-night" aria-hidden />
          <div ref={duskLamps} className="st-lamps" aria-hidden />
          <div className="st-floor" aria-hidden />
          <div className="st-words">
            <div className="st-phase">
              <div ref={phaseDay} className="st-one">
                <div className="st-k">By day</div>
                <h2 className="st-h2">By day, a thakali kitchen.</h2>
                <p>Set thali, seconds on the rice, and the fans on. The veranda fills first.</p>
              </div>
              <div ref={phaseNight} className="st-two">
                <div className="st-k">After dark · until {site.hours.close}</div>
                <h2 className="st-h2">By night, the bar takes the room.</h2>
                <p>Lamps down to the rattan, sekuwa off the grill, and the road going quiet outside.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* the numbers */}
      <section className="st-facts" aria-label="In numbers">
        <div className="st-wrap st-facts-row">
          {FACTS.map((f, i) => (
            <div key={f.l} className="st-stat">
              <div ref={(el) => { counts.current[i] = el; }} className="st-n" aria-label={String(f.n)}>{pad2(0)}</div>
              <div className="st-l">{f.l}</div>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
