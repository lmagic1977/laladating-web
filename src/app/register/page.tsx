'use client';

import { useEffect } from 'react';

export default function RegisterPage() {
  useEffect(() => {
    window.location.replace('/account');
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="neon-card p-8 text-center">
        <h1 className="text-2xl font-semibold">Registration moved</h1>
        <p className="mt-3 text-white/70">
          Please complete your profile in My Account, then choose an event to register.
        </p>
        <a href="/account" className="mt-6 inline-block rounded-full px-5 py-2 text-sm font-semibold neon-button">
          Go to My Account
        </a>
      </div>
    </div>
  );
}
