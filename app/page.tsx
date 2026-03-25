import { NokiaSnakeGame } from "@/components/NokiaSnakeGame";

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero-copy">
        <p className="eyebrow">Classic pocket play</p>
        <h1>Potato Snake</h1>
        <p className="intro">
          A dark retro snake game with a chunky pixel trail, wraparound movement,
          and a tiny potato snack waiting on the grid.
        </p>
      </section>

      <NokiaSnakeGame />

      <p className="ownership-note">(c) 2026 Shahriar | All rights reserved | github.com/shahriarbd10</p>
    </main>
  );
}



