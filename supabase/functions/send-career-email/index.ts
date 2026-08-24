// Supabase Edge Function: send-career-email
// Deploy command: supabase functions deploy send-career-email

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Reject non-POST HTTP methods
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authenticated user" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.substring(7).trim();

  // IMPORTANT:
  // The Supabase platform has already verified this JWT because verify_jwt = true.
  // We decode the already-verified JWT payload to read the authenticated student's claims.
  try {
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(
            token.split(".")[1]
              .replace(/-/g, "+")
              .replace(/_/g, "/")
          ),
          (c) => c.charCodeAt(0)
        )
      )
    );

    const userId = payload.sub || payload.id;
    const email = payload.email;

    if (!userId || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authenticated user information unavailable",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        userId,
        email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Verified JWT payload could not be read:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Authenticated user information unavailable",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});




