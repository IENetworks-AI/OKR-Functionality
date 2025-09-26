export function Hero() {
  return (
    <section className="bg-gradient-to-b from-orange-50 to-purple-50 py-10">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
          <h2 className="text-2xl font-bold text-black mb-4">Free Kundli</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Your name" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Year</label>
                <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="1990" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Month</label>
                <select className="w-full px-3 py-2 border border-purple-200 rounded-lg">
                  <option>Month</option>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Day</label>
                <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hour</label>
                <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="1-12" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minute</label>
                <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="0-59" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">AM/PM</label>
                <select className="w-full px-3 py-2 border border-purple-200 rounded-lg">
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>
            <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold">Generate Kundli</button>
          </form>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
          <h2 className="text-2xl font-bold text-black mb-4">Free Horoscope Matching</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {['Male', 'Female'].map((label) => (
              <div key={label} className="space-y-3">
                <div className="bg-blue-100 py-2 rounded-lg text-center font-semibold">{label} Profile Details</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="John Smith" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Year</label>
                    <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="1990" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Month</label>
                    <select className="w-full px-3 py-2 border border-purple-200 rounded-lg">
                      <option>Month</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Day</label>
                    <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="1" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hour</label>
                    <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="1-12" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Minute</label>
                    <input type="number" className="w-full px-3 py-2 border border-purple-200 rounded-lg" placeholder="0-59" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">AM/PM</label>
                    <select className="w-full px-3 py-2 border border-purple-200 rounded-lg">
                      <option>AM</option>
                      <option>PM</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold">Match Horoscope</button>
        </div>
      </div>
    </section>
  );
}
