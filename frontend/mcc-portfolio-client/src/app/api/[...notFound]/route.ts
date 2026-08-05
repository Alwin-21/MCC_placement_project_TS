import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: 404,
      error: "Not Found",
      message: "The requested API endpoint does not exist. Please check the URL path and HTTP method.",
    },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      status: 404,
      error: "Not Found",
      message: "The requested API endpoint does not exist. Please check the URL path and HTTP method.",
    },
    { status: 404 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      status: 404,
      error: "Not Found",
      message: "The requested API endpoint does not exist. Please check the URL path and HTTP method.",
    },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      status: 404,
      error: "Not Found",
      message: "The requested API endpoint does not exist. Please check the URL path and HTTP method.",
    },
    { status: 404 }
  );
}
