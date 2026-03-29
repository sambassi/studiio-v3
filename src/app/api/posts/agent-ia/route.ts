import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface ScheduleItem {
  date: string;
  time: string;
  caption: string;
  platforms: string[];
}

const generateAISchedule = (
  planDays: string,
  networks: string[],
  objectives: string[]
): ScheduleItem[] => {
  const days = parseInt(planDays) || 30;
  const schedule: ScheduleItem[] = [];

  const objectiveMap: Record<string, string[]> = {
    promo: ['🎯 NOUVELLE SÉANCE EN LIVE!', '📣 NE MANQUE PAS CETTE SESSION', '🚀 OFFRE LIMITÉE'],
    motiv: ['💪 TU AS LA FORCE!', '⚡ TRANSFORMATION EN COURS', '🔥 DONNE TON MAX'],
    bienfaits: ['✨ LES BIENFAITS DE...', '❤️ TA SANTÉ D\'ABORD', '🧠 ÉQUILIBRE MENTAL'],
    abo: ['❤️ REJOINS LA COMMUNAUTÉ', '🎁 ABONNEMENT SPÉCIAL', '👥 ENSEMBLE ON VA PLUS LOIN'],
    nutri: ['🥗 NUTRITION OPTIMALE', '🍎 BIENFAITS NUTRITIFS', '💚 MANGE INTELLIGENT'],
  };

  const currentDate = new Date();
  const times = ['06:00', '12:00', '18:00', '21:00'];
  let timeIndex = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    const objectiveKey = objectives[i % objectives.length];
    const captions = objectiveMap[objectiveKey] || ['✨ Nouveau contenu'];
    const caption =
      captions[Math.floor(Math.random() * captions.length)] +
      '\n\n' +
      `Jour ${i + 1} du planning IA\n\n` +
      '#afroboost #fitness #video\n\n' +
      '👇 C\'est pour toi?';

    const time = times[timeIndex % times.length];
    timeIndex++;

    schedule.push({
      date: dateStr,
      time,
      caption,
      platforms: networks,
    });
  }

  return schedule;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorise' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const networks = JSON.parse(formData.get('networks') as string || '[]');
    const objectives = JSON.parse(formData.get('objectives') as string || '[]');
    const planDays = (formData.get('planDays') as string) || '30';

    if (!networks.length || !objectives.length) {
      return NextResponse.json(
        { success: false, error: 'Reseaux et objectifs requis' },
        { status: 400 }
      );
    }

    const schedule = generateAISchedule(planDays, networks, objectives);

    const createdPosts = [];
    for (const item of schedule) {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          id: uuidv4(),
          user_id: session.user.id,
          caption: item.caption,
          platforms: item.platforms,
          scheduled_date: item.date,
          scheduled_time: item.time,
          status: 'scheduled',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && post) {
        createdPosts.push(post);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        planGenerated: true,
        postsCreated: createdPosts.length,
        posts: createdPosts,
      },
      message: `Planning genere avec ${createdPosts.length} posts!`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
