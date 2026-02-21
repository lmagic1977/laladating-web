export default function ContactPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <div className="neon-card rounded-2xl p-6">
        <div className="space-y-2 text-white/85">
          <p><span className="font-semibold">Founder/CEO:</span> Yangtuoge</p>
          <p>
            <span className="font-semibold">Phone:</span>{' '}
            <a href="tel:+16269752527" className="text-cyan-300 hover:text-cyan-200">626-975-2527</a>
          </p>
          <p><span className="font-semibold">WeChat:</span> RUNMUNT</p>
          <p>
            <span className="font-semibold">WhatsApp:</span>{' '}
            <a href="https://wa.me/18624383400" target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
              +1 862 438 3400
            </a>
          </p>
          <p><span className="font-semibold">Location:</span> Huntington Beach, California</p>
        </div>
      </div>
    </section>
  );
}
