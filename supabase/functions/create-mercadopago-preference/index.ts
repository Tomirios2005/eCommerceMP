import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, apikey",
};

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    main_image: string;
  };
  quantity: number;
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // ── 1. Required env vars ───────────────────────────────────────────────────
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) return jsonError("Mercado Pago no configurado", 503);

    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appUrl          = Deno.env.get("APP_URL") || "https://e-commerce-eight-drab-11.vercel.app";

    // ── 2. Authenticate the caller ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("No autorizado", 401);

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return jsonError("Token inválido o expirado", 401);

    // ── 3. Parse and validate request body ────────────────────────────────────
    let orderId: string, items: CartItem[], total: number;
    try {
      const body = await req.json() as { orderId?: string; items?: CartItem[]; total?: number };
      if (!body.orderId || !body.items?.length || body.total == null) {
        return jsonError("Faltan campos requeridos: orderId, items, total", 400);
      }
      orderId = body.orderId;
      items   = body.items;
      total   = body.total;
    } catch {
      return jsonError("Cuerpo de solicitud inválido (JSON esperado)", 400);
    }

    // ── 4. Verify order ownership and status ──────────────────────────────────
    const supabase = createClient(supabaseUrl, supabaseService);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (orderError || !order) {
      return jsonError(
        "Pedido no encontrado, no pertenece al usuario o ya fue procesado",
        403
      );
    }

    // ── 5. Create Mercado Pago preference ─────────────────────────────────────
    const preference = {
      items: items.map((item: CartItem) => ({
        id:          item.product.id,
        title:       item.product.name,
        quantity:    item.quantity,
        unit_price:  item.product.price,
        currency_id: "ARS",
        ...(item.product.main_image ? { picture_url: item.product.main_image } : {}),
      })),
      back_urls: {
        success: `${appUrl}/orders?payment=success`,
        failure: `${appUrl}/orders?payment=failure`,
        pending: `${appUrl}/orders?payment=pending`,
      },
      auto_return: "approved",
      external_reference: orderId,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: { order_id: orderId, user_id: user.id },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errData = await mpResponse.json().catch(() => ({}));
      const detail  = errData?.message
        || errData?.cause?.[0]?.description
        || "error desconocido";
      console.error("Mercado Pago API error:", mpResponse.status, errData);
      return jsonError(`Error al crear preferencia de pago: ${detail}`, 502);
    }

    const preferenceData = await mpResponse.json();

    // ── 6. Persist preference id (non-fatal if it fails) ──────────────────────
    const { error: updateError } = await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preferenceData.id })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order with preference id:", updateError.message);
    }

    return new Response(
      JSON.stringify({
        id:                 preferenceData.id,
        init_point:         preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno del servidor";
    console.error("Unhandled error:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
