import { NextResponse } from 'next/server';

// Used by the share CLI dashboard to check the gateway is reachable.
export async function GET() {
  return NextResponse.json({ ok: true, service: 'small-software-cloud-gateway' });
}
