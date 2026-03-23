import { NextResponse } from "next/server";
import { getScoresCollection } from "@/lib/mongodb";

export async function GET() {
  try {
    const collection = await getScoresCollection();
    const scores = await collection
      .find({}, { projection: { _id: 0, name: 1, score: 1, updatedAt: 1 } })
      .sort({ score: -1, updatedAt: 1 })
      .limit(100)
      .toArray();

    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ error: "Unable to load leaderboard." }, { status: 500 });
  }
}
