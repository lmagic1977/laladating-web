export type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  price: string;
  seats: number;
  status: "Open" | "Waitlist" | "Closed" | string;
};

export type Attendee = {
  id: string;
  name: string;
  age: number;
  job: string;
  contact: string;
  interests: string;
  intro?: string;
  status: "pending" | "approved" | "blacklist";
  eventId: string;
  headshotUrl?: string;
  fullshotUrl?: string;
};

export type Registration = {
  id: string;
  attendeeId: string;
  eventId: string;
  payment: string;
  status: "submitted" | "paid" | "canceled" | string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "super" | "manager" | "staff" | string;
};
