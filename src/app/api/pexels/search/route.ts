import { NextRequest, NextResponse } from 'next/server';

// Pexels API for free stock photos
// Uses Pexels API key from env, falls back to curated fitness photos
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// Fallback curated photos when no API key
const FALLBACK_PHOTOS = [
  { id: 1, src: { medium: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg' } },
  { id: 2, src: { medium: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg' } },
  { id: 3, src: { medium: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg' } },
  { id: 4, src: { medium: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg' } },
  { id: 5, src: { medium: 'https://images.pexels.com/photos/3836861/pexels-photo-3836861.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/3836861/pexels-photo-3836861.jpeg' } },
  { id: 6, src: { medium: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg' } },
  { id: 7, src: { medium: 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg' } },
  { id: 8, src: { medium: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg' } },
  { id: 9, src: { medium: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/416778/pexels-photo-416778.jpeg' } },
  { id: 10, src: { medium: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg' } },
  { id: 11, src: { medium: 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg' } },
  { id: 12, src: { medium: 'https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg' } },
  { id: 13, src: { medium: 'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg' } },
  { id: 14, src: { medium: 'https://images.pexels.com/photos/3768901/pexels-photo-3768901.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/3768901/pexels-photo-3768901.jpeg' } },
  { id: 15, src: { medium: 'https://images.pexels.com/photos/4162488/pexels-photo-4162488.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/4162488/pexels-photo-4162488.jpeg' } },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'fitness';
  const perPage = parseInt(searchParams.get('per_page') || '15');

  // If we have a Pexels API key, use the real API
  if (PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
        {
          headers: { Authorization: PEXELS_API_KEY },
        }
      );

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ photos: data.photos });
      }
    } catch (error) {
      console.error('Pexels API error:', error);
    }
  }

  // Fallback: return curated fitness photos (shuffled)
  const shuffled = [...FALLBACK_PHOTOS].sort(() => Math.random() - 0.5).slice(0, perPage);
  return NextResponse.json({ photos: shuffled });
}
