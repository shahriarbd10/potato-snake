import { NextResponse } from "next/server";
import { getScoresCollection } from "@/lib/mongodb";
import { getPlayerNameValidationError, normalizePlayerName } from "@/lib/playerNameModeration";

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
    const name = normalizePlayerName(body?.name);
    const score = Number(body?.score);
    const nameError = getPlayerNameValidationError(name);

    if (!playerId || nameError || Number.isNaN(score) || score <= 0) {
      return NextResponse.json(
        { error: nameError ?? "Invalid score payload." },
        { status: 400 }
      );
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
