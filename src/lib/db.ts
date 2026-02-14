// Database types and local storage helpers
export interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  price: string;
  age_range: string;
  max_participants: number;
  status: 'active' | 'closed';
  created_at: string;
}

export interface Registration {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  looking_for: string;
  event_id: number;
  created_at: string;
}

export interface Attendee {
  id: string;
  name: string;
  age: number;
  job: string;
  contact: string;
  interests: string;
  intro?: string;
  status: string;
  eventId: string;
  headshotUrl?: string;
  fullshotUrl?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

// In-memory fallback for server-side runtime/demo mode
let serverEvents: Event[] = [
  {
    id: 1,
    name: 'Beach Vibes Speed Dating (20-30)',
    date: '2024-02-15',
    time: '20:00',
    location: 'Huntington Beach',
    price: '$39',
    age_range: '20-30',
    max_participants: 20,
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Weekend Speed Dating (25-35)',
    date: '2024-02-22',
    time: '20:00',
    location: 'Huntington Beach',
    price: '$39',
    age_range: '25-35',
    max_participants: 20,
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

let serverRegistrations: Registration[] = [];

function normalizeEventName(value: string): string {
  return value.trim().toLowerCase();
}

// Local storage helpers for demo mode
export function getEvents(): Event[] {
  if (typeof window === 'undefined') return serverEvents;
  const saved = localStorage.getItem('lala_events');
  if (saved) {
    return JSON.parse(saved);
  }
  return serverEvents;
}

export function isDuplicateEvent(
  event: Pick<Event, 'name' | 'date' | 'time'>,
  events: Event[] = getEvents()
): boolean {
  const name = normalizeEventName(event.name);
  return events.some(
    (item) =>
      normalizeEventName(item.name) === name &&
      item.date === event.date &&
      item.time === event.time
  );
}

export function saveEvent(event: Omit<Event, 'id' | 'created_at'>): Event {
  if (isDuplicateEvent(event)) {
    throw new Error('DUPLICATE_EVENT');
  }

  const newEvent: Event = {
    ...event,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };

  if (typeof window === 'undefined') {
    serverEvents.push(newEvent);
  } else {
    const events = getEvents();
    events.push(newEvent);
    localStorage.setItem('lala_events', JSON.stringify(events));
  }

  return newEvent;
}

export function deleteEventById(id: number): boolean {
  if (typeof window === 'undefined') {
    const before = serverEvents.length;
    serverEvents = serverEvents.filter((e) => e.id !== id);
    return serverEvents.length < before;
  }
  const events = getEvents();
  const next = events.filter((e) => e.id !== id);
  localStorage.setItem('lala_events', JSON.stringify(next));
  return next.length < events.length;
}

export function getRegistrations(): Registration[] {
  if (typeof window === 'undefined') return serverRegistrations;
  const saved = localStorage.getItem('lala_registrations');
  return saved ? JSON.parse(saved) : [];
}

export function isDuplicateRegistration(
  reg: Pick<Registration, 'event_id' | 'email' | 'phone'>,
  registrations: Registration[] = getRegistrations()
): boolean {
  const email = normalizeEmail(reg.email);
  const phone = normalizePhone(reg.phone);

  return registrations.some((item) => {
    if (item.event_id !== reg.event_id) return false;
    return normalizeEmail(item.email) === email || normalizePhone(item.phone) === phone;
  });
}

export function saveRegistration(reg: Omit<Registration, 'id' | 'created_at'>): Registration {
  if (isDuplicateRegistration(reg)) {
    throw new Error('DUPLICATE_REGISTRATION');
  }

  const newReg: Registration = {
    ...reg,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };

  if (typeof window === 'undefined') {
    serverRegistrations.push(newReg);
  } else {
    const registrations = getRegistrations();
    registrations.push(newReg);
    localStorage.setItem('lala_registrations', JSON.stringify(registrations));
  }

  return newReg;
}
