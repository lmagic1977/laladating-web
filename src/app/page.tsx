export default function Home() {
  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            在 Huntington Beach 让火花快一点
          </h1>
          <p className="mt-4 text-base text-white/70">
            LALA Speed Dating 面向年轻单身人群。50-80 人一场，线下见面，现场互动。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/events" className="rounded-full px-4 py-2 text-sm font-semibold neon-button">
              查看活动
            </a>
            <a
              href="/register"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              立即报名
            </a>
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-white/80">
            下一场活动
          </div>
          <h3 className="mt-4 text-xl font-semibold">Speed Dating · 20-30</h3>
          <p className="mt-1 text-sm text-white/60">海边舞蹈学校 · 20:00</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "人/场", value: "50-80" },
              { label: "轮互动", value: "8" },
              { label: "分钟", value: "90" },
            ].map((item) => (
              <div key={item.label} className="neon-card p-3 text-center">
                <div className="text-lg font-semibold text-yellow-300">{item.value}</div>
                <div className="text-xs text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
          <a href="/onsite" className="mt-6 inline-block rounded-full px-4 py-2 text-sm neon-button">
            进入现场模式
          </a>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">近期活动</h2>
          <a href="/events" className="text-sm text-white/60 hover:text-white">
            全部活动
          </a>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "海边夜场 · 20-30",
            "周末特场 · 25-35",
            "春日限定 · 24-32",
          ].map((title) => (
            <div key={title} className="neon-card p-5">
              <div className="text-xs uppercase text-cyan-300">Open</div>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-white/60">Huntington Beach</p>
              <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                <span>20:00</span>
                <span className="text-pink-300">$39</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold">现场玩法</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>心动选择：每轮结束后选择心动对象</li>
            <li>现场投票：最有趣/最想再见</li>
            <li>抽奖环节：互动参与即可抽奖</li>
          </ul>
        </div>
        <div className="neon-card p-6">
          <h3 className="text-lg font-semibold">活动流程</h3>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li>签到进入现场模式</li>
            <li>主持人组织每轮配对</li>
            <li>每轮结束心动/投票</li>
            <li>结束公布投票与抽奖</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
