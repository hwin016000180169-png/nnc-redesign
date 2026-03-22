/**
 * issue-billing-key — 구독 빌링키 발급 + 첫 결제 Edge Function
 *
 * 클라이언트에서 PortOne 빌링키 발급 후 전달하면:
 * 1. 고객 upsert
 * 2. 빌링키 저장
 * 3. PortOne API로 첫 달 즉시 결제
 * 4. subscriptions + payments 테이블에 저장
 * 5. 결과 반환
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PORTONE_API_URL = 'https://api.portone.io'

const PLAN_AMOUNTS: Record<string, number> = {
  'sub-basic':    49000,
  'sub-standard': 89000,
  'sub-premium': 149000,
}

const PLAN_NAMES: Record<string, string> = {
  'sub-basic':    '베이직 구독',
  'sub-standard': '스탠다드 구독',
  'sub-premium':  '프리미엄 구독',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  try {
    const { billingKey, planId, customer } = await req.json()

    if (!billingKey || !planId || !customer?.email) {
      return respond({ success: false, message: '필수 파라미터가 누락되었습니다.' }, 400)
    }

    const amount = PLAN_AMOUNTS[planId]
    const planName = PLAN_NAMES[planId]
    if (!amount || !planName) {
      return respond({ success: false, message: '유효하지 않은 구독 플랜입니다.' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. 고객 upsert ──
    const { data: cust, error: custErr } = await supabase
      .from('customers')
      .upsert(
        { email: customer.email, name: customer.name, phone: customer.phone, org: customer.org },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (custErr) {
      console.error('고객 저장 실패:', custErr)
      return respond({ success: false, message: '고객 정보 저장에 실패했습니다.' }, 500)
    }

    // ── 2. 빌링키 저장 ──
    const { data: bk, error: bkErr } = await supabase
      .from('billing_keys')
      .insert({ customer_id: cust.id, billing_key: billingKey })
      .select('id')
      .single()

    if (bkErr) {
      console.error('빌링키 저장 실패:', bkErr)
      return respond({ success: false, message: '카드 정보 저장에 실패했습니다.' }, 500)
    }

    // ── 3. PortOne API로 첫 달 즉시 결제 ──
    const firstPaymentId = 'sub-first-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)

    const chargeRes = await fetch(`${PORTONE_API_URL}/payments/${encodeURIComponent(firstPaymentId)}/billing-key`, {
      method: 'POST',
      headers: {
        Authorization:  `PortOne ${Deno.env.get('PORTONE_API_SECRET')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingKey,
        orderName: `엔앤씨 ${planName} - 첫 달 결제`,
        customer: {
          fullName:    customer.name,
          phoneNumber: customer.phone,
          email:       customer.email,
        },
        amount:   { total: amount },
        currency: 'KRW',
      }),
    })

    const chargeData = await chargeRes.json()

    if (!chargeRes.ok || chargeData.status !== 'PAID') {
      console.error('첫 결제 실패:', chargeData)
      // 빌링키 비활성화
      await supabase.from('billing_keys').update({ is_active: false }).eq('id', bk.id)
      return respond({
        success: false,
        message: chargeData.message || '첫 결제에 실패했습니다. 카드 정보를 다시 확인해주세요.',
      }, 400)
    }

    // ── 4. 구독 + 결제 내역 저장 ──
    // 다음 결제일 = 오늘 + 1달
    const nextBillingDate = new Date()
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    const nextDateStr = nextBillingDate.toISOString().split('T')[0]

    const { data: sub, error: subErr } = await supabase
      .from('subscriptions')
      .insert({
        customer_id:       cust.id,
        plan_id:           planId,
        billing_key_id:    bk.id,
        status:            'active',
        start_date:        new Date().toISOString().split('T')[0],
        next_billing_date: nextDateStr,
      })
      .select('id')
      .single()

    if (subErr) {
      console.error('구독 저장 실패:', subErr)
      return respond({ success: false, message: '구독 정보 저장에 실패했습니다.' }, 500)
    }

    await supabase.from('payments').insert({
      portone_id:      firstPaymentId,
      customer_id:     cust.id,
      subscription_id: sub.id,
      plan_id:         planId,
      amount,
      status:          'paid',
      pay_method:      chargeData.method?.type ?? 'BILLING_KEY',
      paid_at:         chargeData.paidAt ?? new Date().toISOString(),
    })

    return respond({
      success:        true,
      subscriptionId: sub.id,
      nextBillingDate: nextDateStr,
    })

  } catch (err) {
    console.error('서버 오류:', err)
    return respond({ success: false, message: '서버 오류가 발생했습니다.' }, 500)
  }
})

function respond(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
