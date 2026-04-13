import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Mercado Pago no configurado" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId, items, total } = await req.json() as { orderId: string; items: CartItem[]; total: number };

    const appUrl = Deno.env.get("VITE_APP_URL") || "http://localhost:5173";

    const preference = {
      items: items.map((item: CartItem) => ({
        id: item.product.id,
        title: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        currency_id: "ARS",
        picture_url: item.product.main_image,
      })),
      back_urls: {
        success: `${appUrl}/orders/${orderId}?payment=success`,
        failure: `${appUrl}/orders/${orderId}?payment=failure`,
        pending: `${appUrl}/orders/${orderId}?payment=pending`,
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
      const errorData = await mpResponse.text();
      throw new Error(`Mercado Pago error: ${errorData}`);
    }

    const preferenceData = await mpResponse.json();

    await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preferenceData.id })
      .eq("id", orderId);

    return new Response(
      JSON.stringify({
        id: preferenceData.id,
        init_point: preferenceData.init_point,
        sandbox_init_point: preferenceData.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
