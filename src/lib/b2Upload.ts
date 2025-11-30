import { supabase } from './supabase';

/**
 * Upload a file to Backblaze B2 via Supabase Edge Function
 * Replaces supabase.storage with B2
 */
export async function uploadToB2(
  file: File,
  folderPath: string
): Promise<{ publicUrl: string; error: string | null }> {
  try {
    const filename = `${folderPath}/${Date.now()}-${file.name}`;
    const contentType = file.type || 'application/octet-stream';

    // Upload file via Edge Function (server-side, no CORS issues)
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('filename', filename);
    uploadFormData.append('contentType', contentType);

    const { data: uploadData, error: uploadError } = await supabase.functions.invoke(
      'upload-to-b2',
      {
        body: uploadFormData
      }
    );

    if (uploadError || !uploadData?.publicUrl) {
      return {
        publicUrl: '',
        error: uploadError?.message || 'Failed to upload file to B2'
      };
    }

    return {
      publicUrl: uploadData.publicUrl,
      error: null
    };
  } catch (err) {
    return {
      publicUrl: '',
      error: err instanceof Error ? err.message : 'Upload failed'
    };
  }
}

/**
 * Get a B2 file URL from a stored filename
 */
export function getB2FileUrl(filename: string): string {
  return `${import.meta.env.VITE_B2_PUBLIC_URL}/${filename}`;
}

/**
 * Note: File deletion from B2 would require a separate Edge Function
 * For now, files can be managed through Backblaze B2 console
 */
