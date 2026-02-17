import { NextResponse } from 'next/server';
import { getRegistrations, isDuplicateRegistration, saveRegistration } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('event_id');
  const registrations = getRegistrations();
  const filtered = eventId 
    ? registrations.filter(r => String(r.event_id) === String(eventId))
    : registrations;
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const data = await request.json();
  const lookingFor = data.looking_for || data.lookingFor;
  const eventId = Number(data.event_id || data.eventId || 1);
  const registrations = getRegistrations();
  
  if (!data.name || !data.email || !data.phone || !data.age || !data.gender || !lookingFor || !data.headshot_url || !data.fullshot_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const payload = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    age: parseInt(data.age),
    gender: data.gender,
    looking_for: lookingFor,
    event_id: eventId,
    headshot_url: data.headshot_url,
    fullshot_url: data.fullshot_url,
  };

  if (isDuplicateRegistration(payload, registrations)) {
    return NextResponse.json(
      { error: 'You are already registered for this event / 您已报名该活动' },
      { status: 409 }
    );
  }
  
  const registration = saveRegistration(payload);
  
  return NextResponse.json(registration);
}
