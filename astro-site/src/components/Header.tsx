export function Header() {
  return (
    <header className="bg-white border-b border-purple-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" />
          <div className="font-bold text-lg">AstroBrand</div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-700">
          <a href="#services" className="hover:text-purple-600">Services</a>
          <a href="#podcasts" className="hover:text-purple-600">Podcasts</a>
          <a href="#about" className="hover:text-purple-600">About</a>
          <a href="#contact" className="hover:text-purple-600">Contact</a>
        </nav>
        <a className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold" href="#book">Book Appointment</a>
      </div>
    </header>
  );
}
