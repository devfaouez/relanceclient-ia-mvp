import { NextResponse } from "next/server";

type ProspectRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: ProspectRouteContext) {
  return NextResponse.json({
    status: "prospect detail placeholder",
    id: context.params.id
  });
}

export async function PATCH() {
  return NextResponse.json(
    { status: "prospect update placeholder" },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { status: "prospect deletion placeholder" },
    { status: 501 }
  );
}
