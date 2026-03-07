import { NextResponse } from "next/server"

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function apiError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}
