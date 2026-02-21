const links = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/onsite', label: 'Onsite' },
  { href: '/auth', label: 'Register & Login' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/sitemap.xml', label: 'XML Sitemap' },
];

export default function SiteMapPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Sitemap</h1>
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
