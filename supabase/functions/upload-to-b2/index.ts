import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";

const B2_KEY_ID = Deno.env.get("B2_KEY_ID");
const B2_APPLICATION_KEY = Deno.env.get("B2_APPLICATION_KEY");
const B2_S3_ENDPOINT = Deno.env.get("B2_S3_ENDPOINT");
const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const s3 = new S3Client({
  region: "eu-central-003",
  endpoint: B2_S3_ENDPOINT,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APPLICATION_KEY
  }
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;
    const contentType = formData.get('contentType') as string;

    if (!file || !filename) {
      return new Response(
        JSON.stringify({ error: 'Missing file or filename' }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const fileBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: filename,
      Body: new Uint8Array(fileBuffer),
      ContentType: contentType || "video/mp4"
    });

    await s3.send(command);

    const publicUrl = `${Deno.env.get('VITE_B2_PUBLIC_URL')}/${filename}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        publicUrl,
        filename
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Upload failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
