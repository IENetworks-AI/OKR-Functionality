const services = [
  { title: 'Consultation', href: '#', img: '/images/consultation.png' },
  { title: 'Online Report', href: '#', img: '/images/online-report.png' },
  { title: 'Voice Report', href: '#', img: '/images/voice-report.png' },
  { title: 'Life Readings', href: '#', img: '/images/life-readings.png' }
];

export function Services() {
  return (
    <section id="services" className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex flex-row flex-wrap gap-4 py-4 justify-center">
          {services.map((s) => (
            <li key={s.title} className="bg-orange-500 rounded-md lg:w-[23.8%] w-[47%] py-3 min-h-15">
              <a href={s.href} className="text-xs text-white flex-col text-center flex justify-center items-center no-underline w-full h-full">
                <img alt={s.title} className="w-[40px] md:w-[50px] lg:w-[75px] aspect-square object-contain" src={s.img} />
                <span className="text-xs text-white">{s.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
