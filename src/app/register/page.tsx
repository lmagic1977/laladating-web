'use client';

import { useEffect } from 'react';

export default function RegisterPage() {
  useEffect(() => {
    window.location.replace('/account');
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="neon-card p-8 text-center">
        <h1 className="text-2xl font-semibold">报名入口已迁移</h1>
        <p className="mt-3 text-white/70">
          请在“我的账户”中先完善个人资料，再选择活动进行报名。
        </p>
        <a href="/account" className="mt-6 inline-block rounded-full px-5 py-2 text-sm font-semibold neon-button">
          前往我的账户
        </a>
      </div>
    </div>
  );
}
