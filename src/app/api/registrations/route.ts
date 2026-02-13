import { NextResponse } from 'next/server';
import { getRegistrations, saveRegistration } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const registrations = getRegistrations();
  const filtered = eventId 
    ? registrations.filter(r => r.event_id === parseInt(eventId))
    : registrations;
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const data = await request.json();
  const lookingFor = data.looking_for || data.lookingFor;
  const eventId = Number(data.event_id || data.eventId || 1);
  
  if (!data.name || !data.email || !data.phone || !data.age || !data.gender || !lookingFor) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  
  const registration = saveRegistration({
    name: data.name,
    email: data.email,
    phone: data.phone,
    age: parseInt(data.age),
    gender: data.gender,
    looking_for: lookingFor,
    event_id: eventId,
  });
  
  return NextResponse.json(registration);
}
