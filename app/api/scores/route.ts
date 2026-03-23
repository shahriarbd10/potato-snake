import { NextResponse } from "next/server";
import { getScoresCollection } from "@/lib/mongodb";

function normalizeName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 24);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = normalizeName(body?.name);
    const score = Number(body?.score);

    if (!name || Number.isNaN(score) || score <= 0) {
      return NextResponse.json({ error: "Invalid score payload." }, { status: 400 });
    }

    const collection = await getScoresCollection();
    const now = new Date();

    await collection.updateOne(
      { name },
      {
        $max: { score: Math.floor(score) },
        $set: { updatedAt: now },
        $setOnInsert: { createdAt: now, name }
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save score." }, { status: 500 });
  }
}
