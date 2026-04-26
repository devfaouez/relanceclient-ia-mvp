import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "reminder send placeholder",
      rule: "No email is sent without explicit human validation."
    },
    { status: 501 }
  );
}
