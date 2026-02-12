'use client';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };
  
  if (submitted) {
    return (
      <div className="neon-card p-8 text-center">
        <div className="text-4xl">💕</div>
        <h2 className="mt-4 text-xl font-semibold">{t('register.success')}</h2>
      </div>
    );
  }
  
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center">{t('register.title')}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {[
          { key: 'name', label: t('register.name'), type: 'text' },
          { key: 'age', label: t('register.age'), type: 'number' },
          { key: 'email', label: t('register.email'), type: 'email' },
          { key: 'phone', label: t('register.phone'), type: 'tel' },
          { key: 'wechat', label: t('register.wechat'), type: 'text' },
        ].map((field) => (
          <div key={field.key} className="form-group">
            <label>{field.label}</label>
            <input type={field.type} required />
          </div>
        ))}
        <div className="form-group">
          <label>{t('register.gender')}</label>
          <select required>
            <option value="">{t('register.gender')}</option>
            <option value="male">{t('register.male')}</option>
            <option value="female">{t('register.female')}</option>
          </select>
        </div>
        <div className="form-group">
          <label>{t('register.intro')}</label>
          <textarea rows={3}></textarea>
        </div>
        <div className="form-group">
          <label>{t('register.hope')}</label>
          <textarea rows={2}></textarea>
        </div>
        <button type="submit" className="w-full neon-button">
          {t('register.submit')}
        </button>
      </form>
    </div>
  );
}
