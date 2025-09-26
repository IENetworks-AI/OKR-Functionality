export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-indigo-50 to-purple-50 text-gray-700 py-12 px-4 md:px-8 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-purple-800">About</h3>
          <p className="text-sm font-semibold text-gray-600 leading-relaxed">
            A modern astrology website template built with Next.js and Tailwind CSS.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4 text-purple-800">Quick Links</h3>
          <ul className="space-y-2 text-sm font-semibold text-gray-600">
            <li><a className="hover:text-purple-600" href="#">Free Daily Horoscope</a></li>
            <li><a className="hover:text-purple-600" href="#">Free Kundli</a></li>
            <li><a className="hover:text-purple-600" href="#">Kundli Matching</a></li>
            <li><a className="hover:text-purple-600" href="#">Panchang</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4 text-purple-800">Services</h3>
          <ul className="space-y-2 text-sm font-semibold text-gray-600">
            <li><a className="hover:text-purple-600" href="#">Consultation</a></li>
            <li><a className="hover:text-purple-600" href="#">Online Report</a></li>
            <li><a className="hover:text-purple-600" href="#">Voice Report</a></li>
            <li><a className="hover:text-purple-600" href="#">Marriage Astrology</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4 text-purple-800">Get In Touch</h3>
          <div className="space-y-2 text-sm font-semibold text-gray-600">
            <p>Our Office: City, State</p>
            <p><a className="hover:text-purple-600" href="tel:+910000000000">+91-0000000000</a></p>
            <p><a className="hover:text-purple-600" href="mailto:info@example.com">info@example.com</a></p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-purple-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className="text-sm font-semibold tracking-wide text-gray-600">© AstroBrand 2025</p>
        <div className="flex gap-4 text-amber-500">
          <a className="hover:text-purple-600" href="#" aria-label="Facebook">FB</a>
          <a className="hover:text-purple-600" href="#" aria-label="Instagram">IG</a>
          <a className="hover:text-purple-600" href="#" aria-label="X">X</a>
          <a className="hover:text-purple-600" href="#" aria-label="YouTube">YT</a>
        </div>
      </div>
    </footer>
  );
}
