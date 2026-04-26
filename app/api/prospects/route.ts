import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "prospects list placeholder" });
}

export async function POST() {
  return NextResponse.json(
    { status: "prospect creation placeholder" },
    { status: 501 }
  );
}
