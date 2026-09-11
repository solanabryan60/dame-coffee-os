import { findCateringDepositStatus, markCateringDepositPaid } from '@/app/lib/supabase-admin';
import { verifyCateringDepositPayment } from '@/app/lib/square';

export const dynamic = 'force-dynamic';

function json(payload: object, status = 200) {
  return Response.json(payload, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request: Request) {
  // The unguessable request UUID is a receipt capability. Return no contact or event data.
  const id = new URL(request.url).searchParams.get('request') || '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json({ error: 'Open the return link from your deposit checkout.' }, 400);
  try {
    const record = await findCateringDepositStatus(id);
    if (!record?.square_order_id) return json({ error: 'We could not find this request. Please contact Dame if you were charged.' }, 404);
    if (['refunded', 'refund_pending', 'cancelled'].includes(record.status)) return json({ status: record.status });
    // A signed Square webhook already verified the payment and updated this
    // server-only record, so a temporary Square read outage cannot hide success.
    if (record.status === 'deposit_paid' && record.deposit_paid_at) return json({ status: 'paid', amountCents: 20000 });
    const verified = await verifyCateringDepositPayment(record.square_order_id);
    if (verified.refunded) return json({ status: 'refund_pending' });
    if (verified.paid && verified.paymentId) {
      await markCateringDepositPaid({ requestId: id, squarePaymentId: verified.paymentId });
      return json({ status: 'paid', amountCents: 20000 });
    }
    return json({ status: 'pending' });
  } catch {
    return json({ error: 'We could not check your payment just now. If you paid, do not pay again. Retry here or contact Dame.' }, 503);
  }
}
