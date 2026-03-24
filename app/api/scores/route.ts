import { NextResponse } from "next/server";
import { getScoresCollection } from "@/lib/mongodb";

function normalizeName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

function normalizePlayerId(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 64);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const playerId = normalizePlayerId(body?.playerId);
    const name = normalizeName(body?.name);
    const score = Number(body?.score);

    if (!playerId || !name || Number.isNaN(score) || score <= 0) {
      return NextResponse.json({ error: "Invalid score payload." }, { status: 400 });
    }

    const collection = await getScoresCollection();
    const now = new Date();
    const nextScore = Math.floor(score);

    await collection.updateOne(
      { playerId },
      {
        $max: { score: nextScore },
        $set: { name, updatedAt: now },
        $setOnInsert: { createdAt: now, playerId }
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Score API error", error);
    return NextResponse.json({ error: "Unable to save score." }, { status: 500 });
  }
}
