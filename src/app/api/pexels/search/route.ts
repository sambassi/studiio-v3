import { NextRequest, NextResponse } from 'next/server';

// Pexels API for free stock photos
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// French-to-English translation map for common fitness/body terms
// Exact word map
const FR_EN_MAP: Record<string, string> = {
  // People
  'femme': 'woman', 'homme': 'man', 'fille': 'girl', 'garçon': 'boy',
  'femmee': 'woman', 'personne': 'person', 'gens': 'people',
  // Skin / appearance
  'noir': 'black', 'noire': 'black', 'blanc': 'white', 'blanche': 'white',
  'musclé': 'muscular', 'musclée': 'muscular', 'musclees': 'muscular',
  'sportif': 'athletic', 'sportive': 'athletic',
  'beau': 'handsome', 'belle': 'beautiful', 'joli': 'pretty', 'jolie': 'pretty',
  'mignon': 'cute', 'mignonne': 'cute',
  // Emotions
  'content': 'happy', 'contente': 'happy', 'heureux': 'happy', 'heureuse': 'happy',
  'souriant': 'smiling', 'souriante': 'smiling', 'sourire': 'smile',
  'confiant': 'confident', 'confiante': 'confident',
  'fier': 'proud', 'fière': 'proud',
  'motivé': 'motivated', 'motivée': 'motivated',
  'déterminé': 'determined', 'déterminée': 'determined',
  'énergique': 'energetic', 'dynamique': 'dynamic',
  // Fitness activities
  'fitness': 'fitness', 'yoga': 'yoga', 'boxe': 'boxing',
  'course': 'running', 'courir': 'running', 'cour': 'running', 'coureur': 'runner', 'coureuse': 'runner',
  'marche': 'walking', 'marcher': 'walking',
  'danse': 'dancing', 'danser': 'dancing', 'danseur': 'dancer', 'danseuse': 'dancer',
  'musculation': 'weightlifting', 'haltères': 'dumbbells',
  'salle': 'gym', 'sport': 'sport', 'entraînement': 'workout', 'entrainement': 'workout',
  'coach': 'coach', 'entraineur': 'trainer', 'entraîneur': 'trainer',
  'étirement': 'stretching', 'pompes': 'pushups', 'squat': 'squat',
  // Body
  'jeune': 'young', 'mince': 'slim', 'fort': 'strong', 'forte': 'strong',
  'abdos': 'abs', 'bras': 'arms', 'jambes': 'legs', 'corps': 'body',
  'grand': 'tall', 'grande': 'tall', 'petit': 'short', 'petite': 'short',
  // Ethnicity
  'africain': 'african', 'africaine': 'african',
  'asiatique': 'asian', 'latin': 'latin', 'latina': 'latina',
  // Nutrition & health
  'nutrition': 'nutrition', 'repas': 'meal', 'healthy': 'healthy',
  'santé': 'health', 'bien-être': 'wellness', 'naturel': 'natural', 'naturelle': 'natural',
  // Context
  'portrait': 'portrait', 'photo': 'photo', 'affiche': 'poster',
  // Articles / prepositions (filtered out)
  'une': '', 'un': '', 'le': '', 'la': '', 'les': '', 'de': '', 'du': '', 'des': '',
  'qui': '', 'que': '', 'est': '', 'en': '', 'et': '', 'au': '', 'aux': '',
  'avec': '', 'dans': '', 'sur': '', 'pour': '',
};

// Prefix map for partial/truncated words (user typing "cour" for "courir")
const FR_PREFIX_MAP: [string, string][] = [
  ['cour', 'running'],   // cour, cours, course, courir, coureur
  ['muscl', 'muscular'], // musclé, musclée, muscles
  ['sport', 'athletic'], // sportif, sportive
  ['entraîn', 'workout'], // entraînement, entraîneur
  ['entrain', 'workout'],
  ['danse', 'dancing'],
  ['march', 'walking'],
  ['sourian', 'smiling'],
];

// Words indicating the query is about a person (to append "portrait" for better results)
const PERSON_WORDS = new Set(['woman', 'man', 'girl', 'boy', 'person', 'people', 'runner', 'dancer', 'trainer', 'coach', 'black', 'african', 'asian', 'latin', 'latina']);

function translateToEnglish(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const translated: string[] = [];
  let hasPerson = false;

  for (const w of words) {
    // Try exact match first
    if (FR_EN_MAP[w] !== undefined) {
      const en = FR_EN_MAP[w];
      if (en) {
        translated.push(en);
        if (PERSON_WORDS.has(en)) hasPerson = true;
      }
      continue;
    }
    // Try prefix match for truncated words
    let matched = false;
    for (const [prefix, en] of FR_PREFIX_MAP) {
      if (w.startsWith(prefix)) {
        translated.push(en);
        matched = true;
        break;
      }
    }
    if (!matched) {
      translated.push(w); // Keep original if no translation found
    }
  }

  // If query mentions a person, add "portrait" for better people-focused results
  if (hasPerson && !translated.includes('portrait')) {
    translated.push('portrait');
  }

  return translated.join(' ');
}

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
  { id: 9, src: { medium: 'https://images.pexels.com/photos/6454071/pexels-photo-6454071.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/6454071/pexels-photo-6454071.jpeg' } },
  { id: 10, src: { medium: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/3757954/pexels-photo-3757954.jpeg' } },
  { id: 11, src: { medium: 'https://images.pexels.com/photos/6456149/pexels-photo-6456149.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/6456149/pexels-photo-6456149.jpeg' } },
  { id: 12, src: { medium: 'https://images.pexels.com/photos/6455927/pexels-photo-6455927.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/6455927/pexels-photo-6455927.jpeg' } },
  { id: 13, src: { medium: 'https://images.pexels.com/photos/6456300/pexels-photo-6456300.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/6456300/pexels-photo-6456300.jpeg' } },
  { id: 14, src: { medium: 'https://images.pexels.com/photos/3768901/pexels-photo-3768901.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/3768901/pexels-photo-3768901.jpeg' } },
  { id: 15, src: { medium: 'https://images.pexels.com/photos/4162488/pexels-photo-4162488.jpeg?auto=compress&cs=tinysrgb&w=400', original: 'https://images.pexels.com/photos/4162488/pexels-photo-4162488.jpeg' } },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || 'fitness';
  const perPage = parseInt(searchParams.get('per_page') || '15');

  // Auto-translate French to English for better Pexels results
  const englishQuery = translateToEnglish(query);

  // If we have a Pexels API key, use the real API
  if (PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(englishQuery)}&per_page=${perPage}&orientation=portrait`,
        {
          headers: { Authorization: PEXELS_API_KEY },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.photos?.length > 0) {
          return NextResponse.json({ photos: data.photos, translated: englishQuery });
        }
      }
    } catch (error) {
      console.error('Pexels API error:', error);
    }
  }

  // Fallback: return curated fitness photos (shuffled)
  const shuffled = [...FALLBACK_PHOTOS].sort(() => Math.random() - 0.5).slice(0, perPage);
  return NextResponse.json({ photos: shuffled, fallback: true });
}
