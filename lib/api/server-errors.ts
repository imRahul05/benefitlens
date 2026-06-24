import { NextResponse } from "next/server";

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export function internalServerError(prefix: string, error: unknown) {
  return NextResponse.json(
    { error: `${prefix}: ${getErrorMessage(error)}` },
    { status: 500 },
  );
}
