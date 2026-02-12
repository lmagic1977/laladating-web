'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType { 
  lang: Language; 
  setLang: (l: Language) => void; 
  toggleLang: () => void; 
  t: (k: string) => string; 
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.events': 'Events',
    'nav.register': 'Register',
    'nav.onsite': 'Onsite',
    'nav.admin': 'Admin',
    'nav.cta': 'Register Now',
    'common.round': 'Round',
    'common.date': 'Date',
    'common.registrations': 'Registrations',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'home.hero_title': 'Let the sparks fly a little faster',
    'home.hero_subtitle': 'LALA Speed Dating for young singles. 50-80 people per event, offline meetups with live interactions.',
    'home.view_events': 'View Events',
    'home.register_now': 'Register Now',
    'home.next_event': 'Next Event',
    'home.age_range': 'Age',
    'home.rounds': 'Rounds',
    'home.duration': 'Minutes',
    'home.upcoming': 'Upcoming Events',
    'home.enter_onsite': 'Enter Live Mode',
    'events.all': 'All Events',
    'events.open': 'Open',
    'events.full': 'Full',
    'events.closed': 'Closed',
    'events.subtitle': 'Choose the session that fits you best.',
    'events.location': 'Huntington Beach',
    'event.beach_20_30': 'Beach Night · 20-30',
    'event.weekend_25_35': 'Weekend Special · 25-35',
    'event.spring_24_32': 'Spring Special · 24-32',
    'how.title': 'How It Works',
    'how.step1_title': 'Check-in',
    'how.step1_desc': 'Scan the QR code to check in on site.',
    'how.step2_title': 'Matching',
    'how.step2_desc': 'Host organizes each round pairing.',
    'how.step3_title': 'Crush Choice',
    'how.step3_desc': 'Choose your crush after each round.',
    'how.step4_title': 'Results',
    'how.step4_desc': 'Vote and see the results.',
    'features.title': 'Features',
    'features.crush': 'Crush Choice',
    'features.crush_desc': 'Choose your favorite each round',
    'features.vote': 'Live Voting',
    'features.vote_desc': 'Vote for most fun and most wanted',
    'features.raffle': 'Raffle',
    'features.raffle_desc': 'Join games and win prizes',
    'register.title': 'Register',
    'register.name': 'Name',
    'register.age': 'Age',
    'register.email': 'Email',
    'register.phone': 'Phone',
    'register.wechat': 'WeChat',
    'register.gender': 'Gender',
    'register.male': 'Male',
    'register.female': 'Female',
    'register.intro': 'Self Introduction',
    'register.hope': 'Who are you hoping to meet?',
    'register.submit': 'Submit Registration',
    'register.success': 'Registration successful!',
    'admin.title': 'Admin Dashboard',
    'admin.events': 'Events',
    'admin.attendees': 'Attendees',
    'admin.registrations': 'Registrations',
    'admin.add_event': 'Add Event',
    'admin.pending_reviews': 'Pending Reviews',
    'admin.new': 'new',
    'admin.no_pending': 'No pending registrations',
  },
  zh: {
    'nav.home': '首页',
    'nav.events': '活动',
    'nav.register': '报名',
    'nav.onsite': '现场',
    'nav.admin': '后台',
    'nav.cta': '立即报名',
    'common.round': '轮次',
    'common.date': '日期',
    'common.registrations': '报名数',
    'common.status': '状态',
    'common.actions': '操作',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.success': '成功',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.back': '返回',
    'home.hero_title': '让火花快一点',
    'home.hero_subtitle': 'LALA Speed Dating 面向年轻单身人群。每场 50-80 人，线下见面，现场互动。',
    'home.view_events': '查看活动',
    'home.register_now': '立即报名',
    'home.next_event': '下一场活动',
    'home.age_range': '年龄',
    'home.rounds': '轮',
    'home.duration': '分钟',
    'home.upcoming': '近期活动',
    'home.enter_onsite': '进入现场模式',
    'events.all': '全部活动',
    'events.open': '报名中',
    'events.full': '已满员',
    'events.closed': '已结束',
    'events.subtitle': '选择最适合你的场次。',
    'events.location': '亨廷顿海滩',
    'event.beach_20_30': '海边夜场 · 20-30',
    'event.weekend_25_35': '周末特场 · 25-35',
    'event.spring_24_32': '春日限定 · 24-32',
    'how.title': '现场流程',
    'how.step1_title': '签到入场',
    'how.step1_desc': '扫描二维码完成现场签到。',
    'how.step2_title': '每轮配对',
    'how.step2_desc': '主持人组织每轮配对。',
    'how.step3_title': '心动选择',
    'how.step3_desc': '每轮结束后选择心动对象。',
    'how.step4_title': '公布结果',
    'how.step4_desc': '投票并查看结果。',
    'features.title': '活动特色',
    'features.crush': '心动选择',
    'features.crush_desc': '每轮选择你最想继续认识的人',
    'features.vote': '现场投票',
    'features.vote_desc': '投票最有趣/最想再见',
    'features.raffle': '抽奖环节',
    'features.raffle_desc': '参与互动即可抽奖',
    'register.title': '立即报名',
    'register.name': '姓名',
    'register.age': '年龄',
    'register.email': '邮箱',
    'register.phone': '手机号',
    'register.wechat': '微信号',
    'register.gender': '性别',
    'register.male': '男',
    'register.female': '女',
    'register.intro': '自我介绍',
    'register.hope': '你想认识怎样的人？',
    'register.submit': '提交报名',
    'register.success': '报名成功！',
    'admin.title': '管理后台',
    'admin.events': '活动管理',
    'admin.attendees': '参与者',
    'admin.registrations': '报名列表',
    'admin.add_event': '新增活动',
    'admin.pending_reviews': '待审核报名',
    'admin.new': '个新',
    'admin.no_pending': '暂无待审核的报名',
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('locale') as Language;
    const browserLang = navigator.language.split('-')[0] === 'zh' ? 'zh' : 'en';
    const initial = saved || browserLang;
    setLangState(initial);
    document.documentElement.setAttribute('lang', initial);
  }, []);
  
  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', l);
      document.documentElement.setAttribute('lang', l);
    }
  };
  
  const toggleLang = () => setLang(lang === 'en' ? 'zh' : 'en');
  const t = (k: string): string => translations[lang]?.[k] || k;
  
  return <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { 
  const c = useContext(LanguageContext); 
  if (!c) throw new Error('useLanguage required'); 
  return c; 
}

export function LangToggle() {
  const { lang, toggleLang } = useLanguage();
  return (
    <button 
      onClick={toggleLang} 
      className="rounded-full border border-white/20 px-3 py-1 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
    >
      {lang === 'en' ? 'EN' : '中文'}
    </button>
  );
}
