import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const { fileName, contentType, bucket } = await req.json();

    const allowedBuckets = ['rushes', 'music', 'characters', 'voiceover'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ success: false, error: 'Bucket non autorisé' }, { status: 400 });
    }

    const ext = fileName.split('.').pop() || 'bin';
    const storagePath = `${session.user.id}/${uuidv4()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(storagePath);

    if (error) {
      console.error('Presign error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path: storagePath,
        publicUrl: urlData.publicUrl,
      },
    });
  } catch (error: any) {
    console.error('Presign error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
