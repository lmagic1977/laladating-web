'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function OnsitePage() {
  const { t } = useLanguage();
  const [eventCode, setEventCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds] = useState(8);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isBreak, setIsBreak] = useState(false);
  const [showVote, setShowVote] = useState(false);
  const [votes, setVotes] = useState<number[]>([]);

  useEffect(() => {
    if (!joined || isBreak) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowVote(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [joined, isBreak]);

  const handleJoin = () => {
    if (eventCode.trim()) {
      setJoined(true);
    }
  };

  const handleNextRound = () => {
    setShowVote(false);
    setTimeLeft(5);
    if (currentRound < totalRounds) {
      setCurrentRound((prev) => prev + 1);
    } else {
      setIsBreak(true);
    }
  };

  const handleVote = (index: number) => {
    setVotes((prev) => [...prev, index]);
    // Move to next round after voting
    handleNextRound();
  };

  const handleSkip = () => {
    setVotes((prev) => [...prev, -1]);
    handleNextRound();
  };

  const startDating = () => {
    setIsBreak(false);
    setTimeLeft(5);
  };

  if (!joined) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-3xl font-semibold mb-8">{t('onsite.title')}</h1>
        
        <div className="neon-card p-8">
          <h2 className="text-xl font-semibold mb-4">{t('onsite.enter_code')}</h2>
          <input
            type="text"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder={t('onsite.event_code')}
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-center text-lg text-white placeholder-white/40 focus:border-pink-500 focus:outline-none mb-6"
          />
          <button
            onClick={handleJoin}
            className="w-full rounded-full px-6 py-3 text-sm font-semibold neon-button"
          >
            {t('onsite.enter_code')}
          </button>
        </div>
      </div>
    );
  }

  if (isBreak && currentRound > totalRounds) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-6">💕</div>
        <h1 className="text-3xl font-semibold mb-4">{t('onsite.all_done')}</h1>
        <p className="text-white/60 mb-8">{t('onsite.view_results')}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full px-6 py-3 text-sm font-semibold neon-button"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (isBreak) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="text-2xl font-semibold mb-6">{t('onsite.break')}</h1>
        <div className="neon-card p-8 mb-6">
          <p className="text-white/70 mb-4">{t('onsite.ladies_next')}</p>
          <p className="text-white/70">{t('onsite.gentlemen_next')}</p>
        </div>
        <button
          onClick={startDating}
          className="rounded-full px-8 py-3 text-sm font-semibold neon-button"
        >
          {t('onsite.start')}
        </button>
      </div>
    );
  }

  if (showVote) {
    const partners = Array.from({ length: 5 }, (_, i) => i + 1);
    return (
      <div className="max-w-md mx-auto py-12">
        <h2 className="text-xl font-semibold text-center mb-6">{t('onsite.vote_prompt')}</h2>
        <div className="grid gap-3">
          {partners.map((num) => (
            <button
              key={num}
              onClick={() => handleVote(num - 1)}
              className="neon-card p-4 text-center hover:bg-white/10 transition-colors"
            >
              Partner {num}
            </button>
          ))}
        </div>
        <button
          onClick={handleSkip}
          className="w-full mt-6 rounded-lg border border-white/20 px-4 py-3 text-white/60 hover:bg-white/10 transition-colors"
        >
          {t('onsite.no_vote')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold">{t('onsite.title')}</h1>
        <p className="text-white/60 mt-2">
          {t('onsite.round_of')} {currentRound} {t('onsite.of')} {totalRounds}
        </p>
      </div>

      <div className="neon-card p-12 text-center mb-6">
        <div className="text-6xl mb-4">💬</div>
        <div className="text-5xl font-bold text-yellow-300">{timeLeft}</div>
        <p className="text-white/60 mt-2">{t('onsite.minutes')}</p>
      </div>

      <div className="text-center text-white/60">
        <p className="text-lg">{t('onsite.time_up')}</p>
      </div>
    </div>
  );
}
