'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useEffect } from 'react';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    lookingFor: '',
    headshotUrl: '',
    fullshotUrl: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const check = async () => {
      const res = await fetch('/api/user/session', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setIsAuthed(Boolean(data?.authenticated));
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!isAuthed) {
      setError(true);
      setErrorMessage('请先注册/登录后再报名');
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone || !formData.age || !formData.gender || !formData.lookingFor || !formData.headshotUrl || !formData.fullshotUrl) {
      setError(true);
      setErrorMessage(t('register.error'));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          headshot_url: formData.headshotUrl,
          fullshot_url: formData.fullshotUrl,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setError(false);
        setErrorMessage('');
      } else {
        const data = await response.json().catch(() => ({ error: t('register.error') }));
        setError(true);
        setErrorMessage(data.error || t('register.error'));
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(true);
      setErrorMessage(t('register.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (field: 'headshotUrl' | 'fullshotUrl') =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setFormData((prev) => ({ ...prev, [field]: dataUrl }));
    };

  if (submitted) {
    return (
      <div className="neon-card max-w-md mx-auto p-8 text-center">
        <div className="text-4xl mb-4">💕</div>
        <h2 className="text-2xl font-semibold mb-4">{t('register.success')}</h2>
      </div>
    );
  }

  if (isAuthed === false) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="neon-card p-8 text-center">
          <h1 className="text-3xl font-semibold mb-4">{t('register.title')}</h1>
          <p className="text-white/70 mb-6">请先注册/登录，再进行活动报名。</p>
          <a href="/auth" className="rounded-full px-6 py-3 text-sm font-semibold neon-button">
            注册/登录
          </a>
        </div>
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
          {errorMessage || t('register.error')}
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
              <option value="" className="bg-gray-900">{t('common.select')}</option>
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
              <option value="" className="bg-gray-900">{t('common.select')}</option>
              <option value="men" className="bg-gray-900">{t('register.men')}</option>
              <option value="women" className="bg-gray-900">{t('register.women')}</option>
              <option value="everyone" className="bg-gray-900">{t('register.everyone')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">头像照片 *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange('headshotUrl')}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">全身照片 *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange('fullshotUrl')}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full px-6 py-3 text-sm font-semibold neon-button mt-6 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t('common.loading') : t('register.submit')}
        </button>
      </form>
    </div>
  );
}
