'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    lookingFor: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.age || !formData.gender || !formData.lookingFor) {
      setError(true);
      return;
    }

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setError(false);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="neon-card max-w-md mx-auto p-8 text-center">
        <div className="text-4xl mb-4">💕</div>
        <h2 className="text-2xl font-semibold mb-4">{t('register.success')}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold">{t('register.title')}</h1>
        <p className="mt-2 text-white/60">{t('register.subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300">
          {t('register.error')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="neon-card p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">{t('register.name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('register.email')} *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('register.phone')} *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('register.age')} *</label>
            <input
              type="number"
              name="age"
              min="18"
              max="99"
              value={formData.age}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white placeholder-white/40 focus:border-pink-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('register.gender')} *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
              required
            >
              <option value="" className="bg-gray-900">{t('common.loading')}</option>
              <option value="male" className="bg-gray-900">{t('register.male')}</option>
              <option value="female" className="bg-gray-900">{t('register.female')}</option>
              <option value="other" className="bg-gray-900">{t('register.other')}</option>
              <option value="prefer_not" className="bg-gray-900">{t('register.prefer_not')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('register.partner_gender')} *</label>
            <select
              name="lookingFor"
              value={formData.lookingFor}
              onChange={handleChange}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:border-pink-500 focus:outline-none"
              required
            >
              <option value="" className="bg-gray-900">{t('common.loading')}</option>
              <option value="men" className="bg-gray-900">{t('register.men')}</option>
              <option value="women" className="bg-gray-900">{t('register.women')}</option>
              <option value="everyone" className="bg-gray-900">{t('register.everyone')}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-full px-6 py-3 text-sm font-semibold neon-button mt-6"
        >
          {t('register.submit')}
        </button>
      </form>
    </div>
  );
}
