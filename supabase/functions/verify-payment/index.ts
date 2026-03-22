/**
 * verify-payment — 단건 결제 검증 Edge Function
 *
 * 클라이언트에서 PortOne 결제 완료 후 paymentId를 전달하면:
 * 1. PortOne API로 결제 금액/상태 검증
 * 2. 고객 upsert
 * 3. payments 테이블에 저장
 * 4. 결과 반환
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PORTONE_API_URL = 'https://api.portone.io'

// 플랜별 금액 (DB 의존 없이 서버에서도 검증)
const PLAN_AMOUNTS: Record<string, number> = {
  'ot-wash':          50000,
  'ot-premium-wash': 120000,
}

Deno.serve(async (req: Request) => {
  // CORS
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
    const { paymentId, planId, customer } = await req.json()

    if (!paymentId || !planId || !customer?.email) {
      return respond({ success: false, message: '필수 파라미터가 누락되었습니다.' }, 400)
    }

    const expectedAmount = PLAN_AMOUNTS[planId]
    if (!expectedAmount) {
      return respond({ success: false, message: '유효하지 않은 플랜입니다.' }, 400)
    }

    // ── 1. PortOne API로 결제 조회 및 검증 ──
    const portoneRes = await fetch(`${PORTONE_API_URL}/payments/${encodeURIComponent(paymentId)}`, {
      headers: {
        Authorization: `PortOne ${Deno.env.get('PORTONE_API_SECRET')}`,
      },
    })

    if (!portoneRes.ok) {
      const err = await portoneRes.text()
      console.error('PortOne 조회 실패:', err)
      return respond({ success: false, message: '결제 정보를 확인할 수 없습니다.' }, 400)
    }

    const payment = await portoneRes.json()

    // 결제 상태 확인
    if (payment.status !== 'PAID') {
      return respond({ success: false, message: `결제가 완료되지 않았습니다. (상태: ${payment.status})` }, 400)
    }

    // 금액 위변조 검증
    if (payment.amount.total !== expectedAmount) {
      console.error(`금액 불일치: 기대=${expectedAmount}, 실제=${payment.amount.total}`)
      return respond({ success: false, message: '결제 금액이 일치하지 않습니다.' }, 400)
    }

    // ── 2. Supabase에 저장 ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 고객 upsert (이메일 기준)
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

    // 결제 내역 저장
    const { error: payErr } = await supabase.from('payments').insert({
      portone_id:  paymentId,
      customer_id: cust.id,
      plan_id:     planId,
      amount:      expectedAmount,
      status:      'paid',
      pay_method:  payment.method?.type ?? null,
      paid_at:     payment.paidAt ?? new Date().toISOString(),
    })

    if (payErr) {
      // 중복 결제 ID는 이미 처리된 것으로 간주
      if (payErr.code === '23505') {
        return respond({ success: true, message: '이미 처리된 결제입니다.' })
      }
      console.error('결제 저장 실패:', payErr)
      return respond({ success: false, message: '결제 내역 저장에 실패했습니다.' }, 500)
    }

    return respond({ success: true, paymentId })

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
