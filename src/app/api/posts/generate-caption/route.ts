import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

const generateCaptionFromDescription = (
  description: string,
  platforms: string[]
): string => {
  const lines: string[] = [];

  if (description.toLowerCase().includes('sport') || description.toLowerCase().includes('fitness')) {
    lines.push('💪 TA SÉANCE COMMENCE ICI! 🔥');
  } else if (description.toLowerCase().includes('nutrition') || description.toLowerCase().includes('recette')) {
    lines.push('🥗 NUTRITION OPTIMALE 💚');
  } else if (description.toLowerCase().includes('motivation')) {
    lines.push('⚡ PRÊT À TRANSFORMER TA VIE? 🚀');
  } else if (description.toLowerCase().includes('cardio')) {
    lines.push('❤️‍🔥 CARDIO EXPLOSIF! 💥');
  } else if (description.toLowerCase().includes('sommeil') || description.toLowerCase().includes('repos')) {
    lines.push('😴 LE REPOS C\'EST AUSSI UN ENTRAÎNEMENT 🌙');
  } else if (description.toLowerCase().includes('cours')) {
    lines.push('🎯 NOUVEAU COURS DISPONIBLE! 🔥');
  } else {
    lines.push('✨ NOUVEAU CONTENU 🎯');
  }

  lines.push('');
  lines.push(description);
  lines.push('');

  if (platforms.includes('instagram')) {
    lines.push('📌 Save ce post pour revenir plus tard');
  }
  if (platforms.includes('tiktok')) {
    lines.push('♪ Partage avec tes potes');
  }
  if (platforms.includes('youtube')) {
    lines.push('🔔 Abonne-toi pour plus de contenu');
  }

  lines.push('');
  const hashtags: string[] = [];

  if (description.toLowerCase().includes('sport') || description.toLowerCase().includes('fitness')) {
    hashtags.push('#sport', '#fitness', '#entrainement', '#musculation');
  }
  if (description.toLowerCase().includes('cardio')) {
    hashtags.push('#cardio', '#hiit', '#endurance', '#energie');
  }
  if (description.toLowerCase().includes('nutrition')) {
    hashtags.push('#nutrition', '#sante', '#alimentation', '#bienfaits');
  }
  if (description.toLowerCase().includes('motivation')) {
    hashtags.push('#motivation', '#mindset', '#transformation', '#objectif');
  }
  if (description.toLowerCase().includes('cours')) {
    hashtags.push('#cours', '#coaching', '#programme', '#training');
  }

  hashtags.push('#afroboost', '#video', '#contenu');

  if (platforms.includes('instagram')) {
    hashtags.push('#reels', '#instagram');
  }
  if (platforms.includes('tiktok')) {
    hashtags.push('#fyp', '#viral');
  }

  lines.push(hashtags.join(' '));
  lines.push('');
  lines.push('👇 Dis-moi tes objectifs en commentaire!');

  return lines.join('\n');
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Non autorise' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { description, platforms = [] } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: 'Description requise' },
        { status: 400 }
      );
    }

    const caption = generateCaptionFromDescription(description, platforms);

    return NextResponse.json({
      success: true,
      caption,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
