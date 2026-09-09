import Link from "next/link";
import { HomeHero } from "@/components/HomeHero";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { TiltCard } from "@/components/motion/TiltCard";
import { Magnetic } from "@/components/motion/Magnetic";
import { AnimatedHeading } from "@/components/motion/AnimatedHeading";
import { SectionProgress } from "@/components/motion/SectionProgress";
import { ThaliAssembly } from "@/components/ThaliAssembly";
import { MenuFlip } from "@/components/MenuFlip";
import { photos, site } from "@/data/site";

const Eyebrow = ({ n, children, light = false, step = 1 }: { n: string; children: React.ReactNode; light?: boolean; step?: number }) => (
  <p data-step={step} className={`eyebrow mb-4 ${light ? "text-gold-light" : "text-gold-ink"}`}>
    {n} — {children}
  </p>
);
const Arrow = () => <span className="arrow" aria-hidden>→</span>;

/**
 * One continuous walk in: the door, the story, the Thakali table, the Thai
 * kitchen, the bar, the plates, the room, the table. Each chapter reveals in
 * order (number, headline, words, picture, buttons); the page's colour eases
 * from one chapter to the next; the pictures float in their frames.
 */
export default function HomePage() {
  return (
    <>
      <HomeHero />
      <SectionProgress />
      <div className="over-hero bg-cream">
        {/* the ticker band */}
        <section aria-label="At a glance" className="border-b border-gold/35 bg-navy py-4">
          <div className="wrap-wide flex flex-wrap items-center justify-center gap-x-[34px] gap-y-[10px] font-mono text-[10.5px] tracking-[0.24em] text-gold-light">
            <span>ASIAN MIX CUISINE</span><span aria-hidden className="text-gold-light/40">◆</span>
            <span>THAKALI · THAI · CONTINENTAL</span><span aria-hidden className="text-gold-light/40">◆</span>
            <span>{site.hours.daily.toUpperCase()}</span>
          </div>
        </section>

        {/* 01 the story */}
        <section id="story" data-scene data-number="01" data-title="THE STORY" data-nav="/story" data-bg="#fbf7ee" className="wrap pad-section" aria-labelledby="story-title">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(30px,5vw,64px)]">
            <div>
              <Eyebrow n="01">The Story</Eyebrow>
              <AnimatedHeading id="story-title" lines={["WHERE TRADITION", "MEETS FLAVOR"]} className="display text-[clamp(28px,4.6vw,52px)] tracking-[0.01em] text-navy" />
              <ul data-step={3} className="mt-[26px] flex flex-wrap items-center gap-3 font-mono text-[10.5px] tracking-[0.2em] text-navy">
                <li className="rounded-full border border-gold/70 px-[14px] py-[9px]">THAKALI CUISINE</li>
                <li aria-hidden className="text-gold-ink">+</li>
                <li className="rounded-full border border-gold/70 px-[14px] py-[9px]">THAI CUISINE</li>
                <li aria-hidden className="text-gold-ink">+</li>
                <li className="rounded-full border border-gold/70 px-[14px] py-[9px]">BAR EXPERIENCE</li>
              </ul>
              <p data-step={4} className="mt-[26px] max-w-[52ch] text-[16px] leading-[1.75] text-slate [text-wrap:pretty]">
                Swad Satkar is a Thakali kitchen, a Thai kitchen and a bar under one roof. The thali arrives the traditional way — rice, dal, seasonal greens, achar and curry in steel bowls. The Thai side of the kitchen works with tom yum, green and red curry, prawn and trout. The bar keeps the room going until midnight.
              </p>
              <p data-step={5} className="accent-italic mt-[18px] text-[21px] text-gold-ink">{site.cardTagline}</p>
              <p data-step={6} className="mt-[30px]">
                <Link href="/story" data-cursor="EXPLORE" className="link-arrow text-navy hover:text-gold-ink"><span className="link-text">Discover Our Story</span> <Arrow /></Link>
              </p>
            </div>
            <div data-step={4} className="relative">
              <div aria-hidden data-step={7} className="absolute -inset-[14px] rounded-[200px_200px_12px_12px] border border-gold/50" />
              <ParallaxImage src={photos.thali.src} alt={photos.thali.alt} width={photos.thali.w} height={photos.thali.h} sizes="(min-width: 760px) 50vw, 100vw" cursor="VIEW" drift={30} className="aspect-[4/5] rounded-[190px_190px_8px_8px] shadow-[0_24px_60px_rgba(14,42,74,.22)]" />
            </div>
          </div>
        </section>

        {/* 02 thakali */}
        <section id="thakali" data-scene data-number="02" data-title="THAKALI" data-nav="/thakali" data-theme="dark" data-bg="#0e2a4a" className="text-cream-bright" style={{ background: "linear-gradient(180deg,#FBF7EE 0%,#0E2A4A 22%,#0E2A4A 100%)" }} aria-labelledby="thakali-title">
          <div className="wrap pad-section">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(30px,5vw,60px)]">
              <div data-step={4}>
                <Link href="/thakali" className="link-scene block" aria-label="Khaja set: explore the Thakali menu">
                  <TiltCard data-cursor="VIEW" className="food-card zoom-card relative overflow-hidden rounded-[14px] !border-gold/45">
                    <div data-tilt-img>
                      <ParallaxImage src={photos.platter.src} alt="" width={photos.platter.w} height={photos.platter.h} sizes="(min-width: 760px) 50vw, 100vw" cursor="VIEW" drift={24} className="aspect-[4/3]" />
                    </div>
                    <div className="food-shade zoom-caption absolute inset-0 flex flex-col justify-end bg-[linear-gradient(0deg,rgba(11,31,54,.9)_0%,rgba(11,31,54,0)_62%)] p-[26px]">
                      <div className="food-caption">
                        <p className="mono-tag text-gold-light">Khaja set</p>
                        <p className="display mt-2 text-[22px]">Mutton Khaja Set · <span className="food-price">700/-</span></p>
                        <p className="mt-[6px] text-[13.5px] text-cream-bright/[0.78]">Chhoila, sadheko, momo, noodles, fries, fruit and beaten rice.</p>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              </div>
              <div>
                <Eyebrow n="02" light>Thakali</Eyebrow>
                <AnimatedHeading id="thakali-title" lines={["THE THAKALI", "TABLE"]} className="display text-[clamp(28px,4.6vw,52px)]" />
                <p data-step={3} className="mt-[22px] max-w-[50ch] text-[15.5px] leading-[1.78] text-cream-bright/[0.82] [text-wrap:pretty]">
                  Thakali food is built around the set: rice or dhido at the centre, dal, a curry of local chicken, mutton or pork, seasonal vegetables, gundruk, achar and dahi. We serve it as sets, and à la carte through chhoila, sadheko, momo and khaja plates.
                </p>
                <ul data-step={5} className="mt-6 flex flex-wrap gap-2">
                  {["THAKALI SETS", "DHIDO SETS", "MOMO & NOODLES", "KHAJA SETS"].map((t) => (
                    <li key={t} className="rounded-full border border-gold/50 px-[13px] py-2 font-mono text-[10px] tracking-[0.16em] text-gold-light">{t}</li>
                  ))}
                </ul>
                <p data-step={6} className="mt-[30px]">
                  <Link href="/thakali" data-cursor="EXPLORE" className="link-arrow text-cream-bright hover:text-gold-light"><span className="link-text">Explore Thakali Menu</span> <Arrow /></Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 thai */}
        <section id="thai" data-scene data-number="03" data-title="THAI" data-nav="/thai" style={{ background: "linear-gradient(180deg,#0E2A4A 0%,#DCE9F7 26%,#FBF7EE 100%)" }} aria-labelledby="thai-title">
          <div className="wrap pad-section">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-[clamp(30px,5vw,60px)]">
              <div>
                <Eyebrow n="03">Thai</Eyebrow>
                <AnimatedHeading id="thai-title" lines={["THE THAI", "EXPERIENCE"]} className="display text-[clamp(28px,4.6vw,52px)] text-navy" />
                <p data-step={3} className="mt-[22px] max-w-[50ch] text-[16px] leading-[1.78] text-slate [text-wrap:pretty]">
                  Bright flavors, aromatic ingredients, and dishes inspired by the vibrant culinary traditions of Thailand — tom yum and nam sai soups, green and red curries, papaya and squid salads, prawn tempura and the seafood platter.
                </p>
                <p data-step={5} className="mt-[30px]">
                  <Link href="/thai" data-cursor="EXPLORE" className="link-arrow text-navy hover:text-gold-ink"><span className="link-text">Explore Thai Menu</span> <Arrow /></Link>
                </p>
              </div>
              <div data-step={4}>
                <Link href="/thai" className="link-scene block" aria-label="Mixed grill plate: explore the Thai menu">
                  <TiltCard data-cursor="VIEW" className="food-card zoom-card relative overflow-hidden rounded-[14px] shadow-[0_26px_60px_rgba(14,42,74,.2)]">
                    <div data-tilt-img>
                      <ParallaxImage src={photos.grill.src} alt="" width={photos.grill.w} height={photos.grill.h} sizes="(min-width: 760px) 50vw, 100vw" cursor="VIEW" drift={24} className="aspect-[5/4]" />
                    </div>
                    <div className="food-shade zoom-caption absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(11,31,54,.86),transparent)] p-6 text-cream-bright">
                      <div className="food-caption">
                        <p className="mono-tag text-gold-light">24 Thai dishes</p>
                        <p className="display mt-2 text-[21px]">Tom Yum · Green Curry · Seafood Platter</p>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 04 the bar */}
        <section id="bar" data-scene data-number="04" data-title="THE BAR" data-nav="/bar" data-theme="dark" data-bg="#123253" className="relative overflow-hidden bg-navy-mid text-cream-bright" aria-labelledby="bar-title">
          <ParallaxImage src={photos.exterior.src} alt="" fill sizes="100vw" reveal={false} drift={60} scale={1.12} className="!absolute inset-0" imgClassName="object-[center_72%] opacity-[0.22]" />
          <div aria-hidden data-drift="opacity:0.55" className="absolute inset-0 bg-navy-deep/50" />
          <div className="wrap pad-section relative text-center">
            <Eyebrow n="04" light>The Bar</Eyebrow>
            <AnimatedHeading id="bar-title" lines={["Stay A Little Longer."]} className="accent-italic text-[clamp(32px,5.6vw,62px)] font-semibold" />
            <p data-step={3} className="mx-auto mt-[22px] max-w-[50ch] text-[16px] leading-[1.75] text-cream-bright/[0.85]">Good food, good company, and an atmosphere worth staying for.</p>
            <p data-step={4} className="mt-8">
              <Magnetic><Link href="/bar" data-cursor="EXPLORE" className="btn btn-ghost-gold px-8"><span className="btn-text">Visit the Bar</span><Arrow /></Link></Magnetic>
            </p>
          </div>
        </section>

        {/* 05 from our kitchen */}
        <section id="signatures" data-scene data-number="05" data-title="FROM OUR KITCHEN" data-bg="#fbf7ee" className="wrap-wide pad-section" aria-labelledby="signatures-title">
          <div className="mx-auto max-w-[620px] text-center">
            <Eyebrow n="05">From Our Kitchen</Eyebrow>
            <AnimatedHeading id="signatures-title" lines={["A TASTE OF THE TABLE"]} className="display text-[clamp(26px,4.4vw,48px)] text-navy" />
            <div data-step={3} className="mt-9 flex flex-wrap justify-center gap-3">
              <Magnetic><Link href="/thakali" data-cursor="EXPLORE" className="btn btn-navy px-[26px] py-[15px]"><span className="btn-text">Thakali Menu</span><Arrow /></Link></Magnetic>
              <Magnetic><Link href="/thai" data-cursor="EXPLORE" className="btn btn-outline px-[26px] py-[15px]"><span className="btn-text">Thai Menu</span><Arrow /></Link></Magnetic>
              <Magnetic><Link href="/gallery" data-cursor="VIEW" className="btn btn-outline px-[26px] py-[15px]"><span className="btn-text">The Gallery</span><Arrow /></Link></Magnetic>
            </div>
          </div>
        </section>

        {/* 06 the experience: the plate, served by scroll */}
        <ThaliAssembly />

        {/* 07 the printed menu, turned by scroll */}
        <MenuFlip />

        {/* 08 the team */}
        <section id="team" data-scene data-number="08" data-title="OUR TEAM" data-bg="#eff4fa" className="wrap-wide pad-section" aria-labelledby="team-title">
          <div className="mx-auto max-w-[760px] text-center">
            <Eyebrow n="08">Our Team</Eyebrow>
            <AnimatedHeading id="team-title" lines={["THE PEOPLE", "BEHIND THE PLATE."]} className="display text-[clamp(28px,4.6vw,56px)] leading-[1.06] text-navy" />
            <p data-step={3} className="mx-auto mt-5 max-w-[46ch] text-[16px] leading-[1.75] text-slate">Swad is cooked. Satkar is practised — and this is who practises it, in the kitchen and on the floor.</p>
          </div>
          <div data-step={4} className="mt-[clamp(28px,4vw,52px)]">
            <ParallaxImage
              src={photos.team.src}
              alt={photos.team.alt}
              width={photos.team.w}
              height={photos.team.h}
              sizes="(min-width: 1280px) 1180px, 94vw"
              cursor="VIEW"
              drift={26}
              className="mx-auto aspect-[3/2] w-full max-w-[1180px] rounded-[14px] shadow-[0_28px_64px_-32px_rgba(11,31,54,.5)]"
            />
          </div>
        </section>

        {/* 09 reservations */}
        <section id="reservations" data-scene data-number="09" data-title="RESERVATIONS" data-theme="dark" data-bg="#0b1f36" className="relative overflow-hidden text-cream-bright" aria-labelledby="reserve-title">
          <div data-drift="opacity:0.2" className="absolute inset-0">
            <ParallaxImage src={photos.exterior.src} alt="" fill sizes="100vw" reveal={false} drift={50} scale={1.12} className="!absolute inset-0" imgClassName="object-[center_60%] opacity-30" />
          </div>
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,31,54,.86),rgba(11,31,54,.94))]" />
          <div className="relative mx-auto max-w-[900px] px-[var(--gutter)] py-[clamp(56px,9vw,120px)] text-center">
            <Eyebrow n="08" light>Reservations</Eyebrow>
            <AnimatedHeading id="reserve-title" lines={["YOUR TABLE IS WAITING."]} className="display text-[clamp(28px,5vw,58px)] leading-[1.06]" />
            <p data-step={3} className="mx-auto mt-5 max-w-[48ch] text-[15.5px] leading-[1.75] text-cream-bright/80">Send a request with your date, time and party size. Our team confirms every booking by phone.</p>
            <div data-step={4} className="mt-8 flex flex-wrap justify-center gap-[14px]">
              <Magnetic strength={0.3} max={10}><Link href="/book" data-cursor="RESERVE" className="btn btn-gold px-[34px] py-[17px]"><span className="btn-text">Book a Table</span><Arrow /></Link></Magnetic>
              <Magnetic><Link href="/contact" data-cursor="EXPLORE" className="btn btn-ghost-light px-[34px] py-[17px]"><span className="btn-text">Visit Us</span></Link></Magnetic>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
