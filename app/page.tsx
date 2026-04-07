import { NokiaSnakeGame } from "@/components/NokiaSnakeGame";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero-copy">
        <p className="eyebrow">Classic pocket play</p>
        <h1>Potato Snake</h1>
        <p className="intro">
          Jump back to the days of simple phones, endless retries, and pure fun.
          Chase the potato, beat your best score, and relive that old-school rush.
        </p>
      </section>

      <NokiaSnakeGame />

      <p className="ownership-note">(c) 2026 Shahriar | All rights reserved | github.com/shahriarbd10</p>
    </main>
  );
}
