import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { status: "reminder generation placeholder" },
    { status: 501 }
  );
}
