import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-[clamp(60px,10vw,140px)] text-center">
      <p className="eyebrow mb-4 text-gold-ink">404</p>
      <h1 className="display text-[clamp(28px,5vw,52px)] text-navy">That page is not on the menu.</h1>
      <Link href="/" className="btn btn-navy mt-8">Back to home</Link>
    </section>
  );
}
