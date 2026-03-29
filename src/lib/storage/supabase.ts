import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use service role for server-side storage operations
const supabaseStorage = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_RUSHES = 'rushes';
const BUCKET_MUSIC = 'music';
const BUCKET_RENDERS = 'renders';
const BUCKET_CHARACTERS = 'characters';

/**
 * Initialize storage buckets (call once during setup)
 */
export async function initBuckets() {
  const buckets = [BUCKET_RUSHES, BUCKET_MUSIC, BUCKET_RENDERS, BUCKET_CHARACTERS];
  for (const bucket of buckets) {
    const { error } = await supabaseStorage.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 500 * 1024 * 1024, // 500MB
    });
    if (error && !error.message.includes('already exists')) {
      console.error(`Error creating bucket ${bucket}:`, error.message);
    }
  }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  file: File | Buffer,
  fileName: string,
  contentType: string,
  userId: string
): Promise<{ url: string; path: string }> {
  const ext = fileName.split('.').pop() || 'bin';
  const storagePath = `${userId}/${uuidv4()}.${ext}`;

  const { error } = await supabaseStorage.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseStorage.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return {
    url: urlData.publicUrl,
    path: storagePath,
  };
}

/**
 * Upload rush video files
 */
export async function uploadRush(file: File | Buffer, fileName: string, contentType: string, userId: string) {
  return uploadFile(BUCKET_RUSHES, file, fileName, contentType, userId);
}

/**
 * Upload music file
 */
export async function uploadMusic(file: File | Buffer, fileName: string, contentType: string, userId: string) {
  return uploadFile(BUCKET_MUSIC, file, fileName, contentType, userId);
}

/**
 * Upload character image
 */
export async function uploadCharacter(file: File | Buffer, fileName: string, contentType: string, userId: string) {
  return uploadFile(BUCKET_CHARACTERS, file, fileName, contentType, userId);
}

/**
 * Upload rendered video
 */
export async function uploadRender(file: Buffer, fileName: string, userId: string) {
  return uploadFile(BUCKET_RENDERS, file, fileName, 'video/mp4', userId);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabaseStorage.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get a signed URL for temporary access (private files)
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabaseStorage.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Signed URL failed: ${error.message}`);
  }

  return data.signedUrl;
}
