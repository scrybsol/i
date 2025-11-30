import { S3Client, GetObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import { createClient } from 'npm:@supabase/supabase-js';

const B2_KEY_ID = Deno.env.get("B2_KEY_ID");
const B2_APPLICATION_KEY = Deno.env.get("B2_APPLICATION_KEY");
const B2_S3_ENDPOINT = Deno.env.get("B2_S3_ENDPOINT");
const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME");
const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

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
    const { filename, userId } = await req.json();

    if (!filename || !userId) {
      return new Response(JSON.stringify({ error: 'Missing filename or userId' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const command = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: filename
    });

    const signedReadUrl = await getSignedUrl(s3, command, {
      expiresIn: 900
    });

    const muxResponse = await fetch("https://api.mux.com/video/v1/assets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`)
      },
      body: JSON.stringify({
        input: { url: signedReadUrl },
        playback_policy: ["public"]
      })
    });

    const muxData = await muxResponse.json();

    if (!muxData.data || !muxData.data.id) {
      return new Response(JSON.stringify({ error: 'Failed to create Mux asset' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const assetId = muxData.data.id;

    const { error: dbError } = await supabaseAdmin
      .from('video_uploads')
      .insert([
        {
          user_id: userId,
          filename: filename,
          b2_url: signedReadUrl,
          asset_id: assetId,
          status: 'processing'
        }
      ]);

    if (dbError) {
      console.error("Database insert error:", dbError);
      return new Response(JSON.stringify({ error: dbError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify(muxData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Process video error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to process video'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
