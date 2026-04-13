import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { type, data } = body;

    if (type === "payment" && data?.id) {
      const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!accessToken) throw new Error("Mercado Pago no configurado");

      const paymentResp = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!paymentResp.ok) throw new Error("Error al obtener el pago");

      const payment = await paymentResp.json();
      const orderId = payment.external_reference;

      if (!orderId) throw new Error("external_reference no encontrado");

      let status = "pending";
      if (payment.status === "approved") status = "paid";
      else if (payment.status === "rejected" || payment.status === "cancelled") status = "cancelled";
      else if (payment.status === "refunded") status = "refunded";

      await supabase
        .from("orders")
        .update({
          status,
          mercadopago_payment_id: String(data.id),
          payment_method: payment.payment_type_id || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
