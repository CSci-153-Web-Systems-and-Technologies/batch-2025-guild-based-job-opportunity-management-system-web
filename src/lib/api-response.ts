import { NextResponse } from 'next/server'

export type ErrorPayload = {
  message: string
  code?: string
  meta?: Record<string, any> | null
}

export function errorResponse(message: string, status = 500, code?: string, meta?: Record<string, any> | null) {
  const payload = { error: { message, code: code ?? undefined, meta: meta ?? undefined } }
  return NextResponse.json(payload, { status })
}

export function successResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status })
}

export default { errorResponse, successResponse }
