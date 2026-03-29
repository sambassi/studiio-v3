import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  objectives: string[],
  description: string
): ScheduleItem[] => {
  // Parse plan days
  const days = parseInt(planDays) || 30;
  const schedule: ScheduleItem[] = [];

  const objectiveMap: { [key: string]: string[] } = {
    promo: ['🎯 NOUVELLE SÉANCE EN LIVE!', '📣 NE MANQUE PAS CETTE SESSION', '🚀 OFFRE LIMITÉE'],
    motiv: ['💪 TU AS LA FORCE!', '⚡ TRANSFORMATION EN COURS', '🔥 DONNE TON MAX'],
    bienfaits: ['✨ LES BIENFAITS DE...', '❤️ TA SANTÉ D\'ABORD', '🧠 ÉQUILIBRE MENTAL'],
    abo: ['❤️ REJOINS LA COMMUNAUTÉ', '🎁 ABONNEMENT SPÉCIAL', '👥 PLUS NOUS, PLUS LOIN'],
    nutri: ['🥗 NUTRITION OPTIMALE', '🍎 BIENFAITS NUTRITIFS', '💚 MANGE INTELLIGENT'],
  };

  const networksEmojis: { [key: string]: string } = {
    instagram: '📷',
    tiktok: '♪',
    facebook: 'f',
    youtube: '▶️',
  };

  // Generate posts for each day at different times
  let currentDate = new Date();
  const times = ['06:00', '12:00', '18:00', '21:00'];
  let timeIndex = 0;

  for (let i = 0; i < days; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];

    // Vary objectives
    const objectiveKey = objectives[i % objectives.length];
    const captions = objectiveMap[objectiveKey] || ['✨ Nouveau contenu'];
    const caption =
      captions[Math.floor(Math.random() * captions.length)] +
      '\n\n' +
      `Jour ${i + 1} du planning IA\n\n` +
      '#afroboost #vidéo #fitness\n\n' +
      '👇 C\'est pour toi?';

    // Pick time
    const time = times[timeIndex % times.length];
    timeIndex++;

    schedule.push({
      date: dateStr,
      time,
      caption,
      platforms: networks,
    });

    // Move to next day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return schedule;
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const networks = JSON.parse(formData.get('networks') as string || '[]');
    const objectives = JSON.parse(formData.get('objectives') as string || '[]');
    const planDays = formData.get('planDays') as string;
    const enablePhoto = formData.get('enablePhoto') === 'true';
    const enableVoixOff = formData.get('enableVoixOff') === 'true';

    if (!networks.length || !objectives.length) {
      return NextResponse.json(
        { success: false, error: 'Networks and objectives are required' },
        { status: 400 }
      );
    }

    // Generate AI schedule
    const schedule = generateAISchedule(
      planDays,
      networks,
      objectives,
      'AI-generated planning'
    );

    // Create posts in database
    const createdPosts = [];

    for (const item of schedule) {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          id: uuidv4(),
          user_id: user.id,
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
        metadata: {
          networks,
          objectives,
          planDays,
          enablePhoto,
          enableVoixOff,
        },
      },
      message: `Planning généré avec ${createdPosts.length} posts!`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
