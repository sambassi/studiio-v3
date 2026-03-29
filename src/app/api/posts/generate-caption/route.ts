import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';

const generateCaptionFromDescription = (
  description: string,
  platforms: string[]
): string => {
  // Template-based caption generation
  const lines: string[] = [];

  // Add opening hook based on description
  if (description.toLowerCase().includes('sport') || description.toLowerCase().includes('fitness')) {
    lines.push('💪 TA SÉANCE COMMENCE ICI! 🔥');
  } else if (description.toLowerCase().includes('nutrition') || description.toLowerCase().includes('recette')) {
    lines.push('🥗 NUTRITION OPTIMALE 💚');
  } else if (description.toLowerCase().includes('motivation')) {
    lines.push('⚡ PRÊT À TRANSFORMER TA VIE? 🚀');
  } else if (description.toLowerCase().includes('sommeil') || description.toLowerCase().includes('repos')) {
    lines.push('😴 LE REPOS C\'EST AUSSI UNE ENTRAÎNEMENT 🌙');
  } else {
    lines.push('✨ NOUVEAU CONTENU 🎯');
  }

  // Add description line
  lines.push('');
  lines.push(description);
  lines.push('');

  // Add platform-specific CTA
  if (platforms.includes('instagram')) {
    lines.push('📌 Save ce post pour revenir plus tard');
  }
  if (platforms.includes('tiktok')) {
    lines.push('♪ Partage avec tes potes');
  }
  if (platforms.includes('youtube')) {
    lines.push('🔔 S\'abonner pour plus de contenu');
  }

  // Add hashtags based on description
  lines.push('');
  const hashtags: string[] = [];

  if (description.toLowerCase().includes('sport') || description.toLowerCase().includes('fitness')) {
    hashtags.push('#sport', '#fitness', '#entraînement', '#musculation');
  }
  if (description.toLowerCase().includes('nutrition')) {
    hashtags.push('#nutrition', '#santé', '#alimentation', '#bienfaits');
  }
  if (description.toLowerCase().includes('motivation')) {
    hashtags.push('#motivation', '#mindset', '#transformation', '#objectif');
  }

  hashtags.push('#afroboost', '#vidéo', '#contenupour');

  if (platforms.includes('instagram')) {
    hashtags.push('#reels', '#instagram');
  }
  if (platforms.includes('tiktok')) {
    hashtags.push('#fyp', '#viral');
  }

  lines.push(hashtags.join(' '));

  // Add engagement CTA
  lines.push('');
  lines.push('👇 Dis-moi tes objectifs en commentaire!');

  return lines.join('\n');
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { description, platforms = [] } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }

    // Generate caption using template-based approach
    const caption = generateCaptionFromDescription(description, platforms);

    return NextResponse.json({
      success: true,
      caption,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
