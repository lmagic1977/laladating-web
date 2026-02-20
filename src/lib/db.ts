// Database types and local storage helpers
export interface Event {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  event_code: string;
  price: string;
  age_range: string;
  max_participants: number;
  organizer_name?: string;
  organizer_phone?: string;
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
  event_id: string | number;
  headshot_url: string;
  fullshot_url: string;
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
    event_code: 'HB-20240215-A1B2',
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
    event_code: 'HB-20240222-C3D4',
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

export function updateEventStatusById(id: number, status: "active" | "closed"): boolean {
  if (typeof window === "undefined") {
    const target = serverEvents.find((e) => e.id === id);
    if (!target) return false;
    target.status = status;
    return true;
  }

  const events = getEvents();
  const target = events.find((e) => e.id === id);
  if (!target) return false;
  target.status = status;
  localStorage.setItem("lala_events", JSON.stringify(events));
  return true;
}

export function updateEventById(
  id: number,
  patch: Partial<
    Pick<
      Event,
      | "name"
      | "date"
      | "time"
      | "location"
      | "event_code"
      | "price"
      | "age_range"
      | "max_participants"
      | "organizer_name"
      | "organizer_phone"
      | "status"
    >
  >
): Event | null {
  const applyPatch = (target: Event) => {
    if (patch.name !== undefined) target.name = patch.name;
    if (patch.date !== undefined) target.date = patch.date;
    if (patch.time !== undefined) target.time = patch.time;
    if (patch.location !== undefined) target.location = patch.location;
    if (patch.event_code !== undefined) target.event_code = patch.event_code;
    if (patch.price !== undefined) target.price = patch.price;
    if (patch.age_range !== undefined) target.age_range = patch.age_range;
    if (patch.max_participants !== undefined) target.max_participants = patch.max_participants;
    if (patch.organizer_name !== undefined) target.organizer_name = patch.organizer_name;
    if (patch.organizer_phone !== undefined) target.organizer_phone = patch.organizer_phone;
    if (patch.status !== undefined) target.status = patch.status;
  };

  if (typeof window === "undefined") {
    const target = serverEvents.find((e) => e.id === id);
    if (!target) return null;
    applyPatch(target);
    return target;
  }

  const events = getEvents();
  const target = events.find((e) => e.id === id);
  if (!target) return null;
  applyPatch(target);
  localStorage.setItem("lala_events", JSON.stringify(events));
  return target;
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
    if (String(item.event_id) !== String(reg.event_id)) return false;
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
