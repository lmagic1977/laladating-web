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

// Local storage helpers for demo mode
export function getEvents(): Event[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('lala_events');
  if (saved) {
    return JSON.parse(saved);
  }
  // Default events
  return [
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
}

export function getRegistrations(): Registration[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('lala_registrations');
  return saved ? JSON.parse(saved) : [];
}

export function saveRegistration(reg: Omit<Registration, 'id' | 'created_at'>): Registration {
  const registrations = getRegistrations();
  const newReg: Registration = {
    ...reg,
    id: Date.now(),
    created_at: new Date().toISOString(),
  };
  registrations.push(newReg);
  localStorage.setItem('lala_registrations', JSON.stringify(registrations));
  return newReg;
}
