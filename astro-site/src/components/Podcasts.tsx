/* eslint-disable @next/next/no-img-element */
'use client';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';

const items = [
  {
    title: 'Astrology Secrets EXPOSED',
    duration: '10:00',
    thumbnail: '/images/podcast-1.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    title: 'Share Market Astrology',
    duration: '07:12',
    thumbnail: '/images/podcast-2.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    title: 'Past Life and Karma',
    duration: '13:15',
    thumbnail: '/images/podcast-3.jpg',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  }
];

export function Podcasts() {
  return (
    <section id="podcasts" className="bg-orange-100 py-10 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-black">Astrology Podcasts</h2>
        </div>
        <div className="mt-8">
          <Swiper spaceBetween={16} slidesPerView={1} breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}>
            {items.map((p) => (
              <SwiperSlide key={p.title}>
                <div className="bg-white rounded-lg shadow-lg p-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg">
                    <img alt={p.title} className="object-cover" src={p.thumbnail} />
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-sm px-2 py-1 rounded">{p.duration}</div>
                  </div>
                  <h3 className="font-semibold text-black mt-4 mb-1 line-clamp-2">{p.title}</h3>
                  <a target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full bg-red-600 text-white py-1.5 px-2 rounded text-sm font-semibold hover:bg-red-700" href={p.url}>Watch</a>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
