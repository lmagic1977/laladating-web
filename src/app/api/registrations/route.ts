import { NextResponse } from 'next/server';
import { createRegistration, getRegistrations } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const registrations = await getRegistrations(eventId ? parseInt(eventId) : undefined);
  return NextResponse.json(registrations);
}

export async function POST(request: Request) {
  const data = await request.json();
  const registration = await createRegistration(data);
  return NextResponse.json(registration);
}
