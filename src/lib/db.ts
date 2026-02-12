// Mock database for development without Supabase credentials

export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  age_range: string;
  location: string;
  price: string;
  status: 'open' | 'full' | 'closed';
}

export interface Registration {
  id: number;
  event_id: number;
  name: string;
  gender: string;
  age: number;
  email: string;
  phone?: string;
  wechat?: string;
  intro?: string;
  hope?: string;
  created_at: string;
}

// Mock data
export const mockEvents: Event[] = [
  { id: 1, title: '海边夜场 · 20-30', date: '2024-02-15', time: '20:00', age_range: '20-30', location: 'Huntington Beach', price: '$39', status: 'open' },
  { id: 2, title: '周末特场 · 25-35', date: '2024-02-22', time: '20:00', age_range: '25-35', location: 'Huntington Beach', price: '$39', status: 'open' },
  { id: 3, title: '春日限定 · 24-32', date: '2024-03-01', time: '20:00', age_range: '24-32', location: 'Huntington Beach', price: '$39', status: 'open' },
];

export const mockRegistrations: Registration[] = [];

// Database functions
export async function getEvents(): Promise<Event[]> {
  return mockEvents;
}

export async function getEvent(id: number): Promise<Event | undefined> {
  return mockEvents.find(e => e.id === id);
}

export async function createRegistration(data: Omit<Registration, 'id' | 'created_at'>): Promise<Registration> {
  const newReg: Registration = {
    ...data,
    id: mockRegistrations.length + 1,
    created_at: new Date().toISOString(),
  };
  mockRegistrations.push(newReg);
  return newReg;
}

export async function getRegistrations(eventId?: number): Promise<Registration[]> {
  if (eventId) {
    return mockRegistrations.filter(r => r.event_id === eventId);
  }
  return mockRegistrations;
}
