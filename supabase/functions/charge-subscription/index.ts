/**
 * charge-subscription — 월간 정기결제 CRON Edge Function
 *
 * Supabase 대시보드 → Edge Functions → Schedule 에서
 * 매일 오전 9시 실행으로 등록하세요:
 *   Cron expression: 0 0 * * *   (UTC 00:00 = KST 09:00)
 *
 * 동작:
 * 1. next_billing_date <= 오늘 인 active 구독 조회
 * 2. 각 구독의 빌링키로 PortOne API 결제 시도
 * 3. 성공 → next_billing_date + 1달, payments 저장
 * 4. 실패 → status = 'past_due', payments에 실패 기록
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PORTONE_API_URL = 'https://api.portone.io'

Deno.serve(async (req: Request) => {
  // CRON 요청 또는 수동 POST 허용
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const today = new Date().toISOString().split('T')[0]
  console.log(`[charge-subscription] 실행 날짜: ${today}`)

  // ── 1. 오늘 결제 대상 구독 조회 ──
  const { data: subscriptions, error: fetchErr } = await supabase
    .from('subscriptions')
    .select(`
      id,
      plan_id,
      next_billing_date,
      customer_id,
      billing_key_id,
      billing_keys ( billing_key ),
      customers ( name, email, phone ),
      plans ( name, amount )
    `)
    .eq('status', 'active')
    .lte('next_billing_date', today)

  if (fetchErr) {
    console.error('구독 조회 실패:', fetchErr)
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 })
  }

  console.log(`[charge-subscription] 결제 대상: ${subscriptions?.length ?? 0}건`)

  const results = { success: 0, failed: 0, errors: [] as string[] }

  for (const sub of subscriptions ?? []) {
    const billingKey = (sub.billing_keys as any)?.billing_key
    const customer   = sub.customers as any
    const plan       = sub.plans as any

    if (!billingKey) {
      console.warn(`구독 ${sub.id}: 빌링키 없음, 건너뜀`)
      results.errors.push(`${sub.id}: 빌링키 없음`)
      continue
    }

    const paymentId = `sub-recurring-${sub.id}-${Date.now()}`

    try {
      // ── 2. PortOne API로 정기결제 시도 ──
      const chargeRes = await fetch(
        `${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}/billing-key`,
        {
          method: 'POST',
          headers: {
            Authorization:  `PortOne ${Deno.env.get('PORTONE_API_SECRET')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billingKey,
            orderName: `엔앤씨 ${plan.name} - 정기결제`,
            customer: {
              fullName:    customer.name,
              phoneNumber: customer.phone,
              email:       customer.email,
            },
            amount:   { total: plan.amount },
            currency: 'KRW',
          }),
        }
      )

      const chargeData = await chargeRes.json()

      if (chargeRes.ok && chargeData.status === 'PAID') {
        // ── 3. 성공: 다음 결제일 갱신 ──
        const nextDate = new Date(sub.next_billing_date)
        nextDate.setMonth(nextDate.getMonth() + 1)
        const nextDateStr = nextDate.toISOString().split('T')[0]

        await supabase
          .from('subscriptions')
          .update({ next_billing_date: nextDateStr })
          .eq('id', sub.id)

        await supabase.from('payments').insert({
          portone_id:      paymentId,
          customer_id:     sub.customer_id,
          subscription_id: sub.id,
          plan_id:         sub.plan_id,
          amount:          plan.amount,
          status:          'paid',
          pay_method:      chargeData.method?.type ?? 'BILLING_KEY',
          paid_at:         chargeData.paidAt ?? new Date().toISOString(),
        })

        console.log(`구독 ${sub.id}: 결제 성공 (${plan.amount.toLocaleString()}원) → 다음 결제일: ${nextDateStr}`)
        results.success++

      } else {
        // ── 4. 실패: past_due 처리 ──
        const failReason = chargeData.message || chargeData.code || '알 수 없는 오류'

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('id', sub.id)

        await supabase.from('payments').insert({
          portone_id:      paymentId,
          customer_id:     sub.customer_id,
          subscription_id: sub.id,
          plan_id:         sub.plan_id,
          amount:          plan.amount,
          status:          'failed',
          fail_reason:     failReason,
        })

        console.warn(`구독 ${sub.id}: 결제 실패 — ${failReason}`)
        results.failed++
        results.errors.push(`${sub.id}: ${failReason}`)
      }

    } catch (err) {
      console.error(`구독 ${sub.id} 처리 중 예외:`, err)
      results.failed++
      results.errors.push(`${sub.id}: 예외 발생`)
    }
  }

  console.log(`[charge-subscription] 완료 — 성공: ${results.success}, 실패: ${results.failed}`)

  return new Response(
    JSON.stringify({ date: today, ...results }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
})
