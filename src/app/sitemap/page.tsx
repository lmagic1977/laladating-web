const links = [
  { href: '/', label: '首页 / Home' },
  { href: '/events', label: '活动 / Events' },
  { href: '/onsite', label: '现场 / Onsite' },
  { href: '/auth', label: '注册登录 / Register & Login' },
  { href: '/contact', label: '联系我们 / Contact' },
  { href: '/privacy', label: '隐私政策 / Privacy' },
  { href: '/terms', label: '服务条款 / Terms' },
  { href: '/sitemap.xml', label: 'XML 网站地图 / XML Sitemap' },
];

export default function SiteMapPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">网站地图 / Sitemap</h1>
      <div className="neon-card rounded-2xl p-6">
        <ul className="space-y-3 text-white/85">
          {links.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="hover:text-pink-300">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
