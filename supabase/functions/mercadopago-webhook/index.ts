import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// No CORS needed — this endpoint is called server-to-server by Mercado Pago.
// IMPORTANT: verify_jwt must be false in config.toml for this function.

const STATUS_MAP: Record<string, string> = {
  approved:    "paid",
  rejected:    "cancelled",
  cancelled:   "cancelled",
  refunded:    "refunded",
  charged_back: "refunded",
};

Deno.serve(async (req: Request) => {
  // MP sends a GET probe when the webhook is first registered — respond 200.
  if (req.method !== "POST") {
    return new Response("ok", { status: 200 });
  }

  // Always return 200 to Mercado Pago, even on errors.
  // If we return 4xx/5xx, MP will retry the webhook indefinitely.
  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("[webhook] MERCADOPAGO_ACCESS_TOKEN not set");
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Parse notification ─────────────────────────────────────────────────
    // MP sends two formats:
    //   1. New webhooks: POST body  { type: "payment", data: { id: "123" } }
    //   2. Old IPN:      query params ?topic=payment&id=123  (body may be empty)

    let type: string | null       = null;
    let paymentId: string | null  = null;

    const url = new URL(req.url);

    try {
      const body = await req.json();
      type      = body.type      ?? body.topic   ?? null;
      paymentId = body.data?.id  != null ? String(body.data.id) : null;
    } catch {
      // Body is empty or not JSON — fall through to query params
    }

    // Fallback: old IPN query params
    if (!type)      type      = url.searchParams.get("topic");
    if (!paymentId) paymentId = url.searchParams.get("id");

    if (type !== "payment" || !paymentId) {
      console.log(`[webhook] Ignoring notification — type: ${type}, id: ${paymentId}`);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // ── Fetch payment from MP API ──────────────────────────────────────────
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpResp.ok) {
      console.error(`[webhook] MP API error ${mpResp.status} for payment ${paymentId}`);
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }

    const payment = await mpResp.json();
    const orderId = payment.external_reference;

    if (!orderId) {
      console.error(`[webhook] Payment ${paymentId} has no external_reference`);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const newStatus = STATUS_MAP[payment.status] ?? "pending";

    console.log(`[webhook] Payment ${paymentId} → MP status: ${payment.status} → order status: ${newStatus} (order ${orderId})`);

    // ── Update order ───────────────────────────────────────────────────────
    const { error } = await supabase
      .from("orders")
      .update({
        status:                   newStatus,
        mercadopago_payment_id:   paymentId,
        payment_method:           payment.payment_type_id ?? "",
        updated_at:               new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      console.error(`[webhook] Failed to update order ${orderId}:`, error.message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[webhook] Unhandled error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
});
