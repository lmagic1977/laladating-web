create table if not exists events (
  id text primary key,
  title text not null,
  date text not null,
  time text not null,
  location text not null,
  price text not null,
  seats integer not null,
  status text not null
);

create table if not exists attendees (
  id text primary key,
  name text not null,
  age integer not null,
  job text not null,
  contact text not null,
  interests text not null,
  intro text,
  status text not null,
  eventId text not null,
  headshotUrl text,
  fullshotUrl text
);

create table if not exists registrations (
  id text primary key,
  attendeeId text not null,
  eventId text not null,
  payment text not null,
  status text not null,
  createdAt text not null
);

create table if not exists admins (
  id text primary key,
  name text not null,
  email text not null,
  role text not null
);
