import Fastify from 'fastify'
import cors from '@fastify/cors'
import { z } from 'zod'
import {
  getAwardDelta,
  isKarmaAwardReason,
  karmaPointsToInr,
  maxRedeemKarmaForSubtotalInr,
  type KarmaAwardReason,
} from '@roorq/karma'
import { pool } from './db.js'
import { env } from './env.js'
import { getUserIdFromBearer } from './auth.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: env.corsOrigin === true || env.corsOrigin === 'true' ? true : String(env.corsOrigin).split(','),
  credentials: true,
})

const AwardBodySchema = z.object({
  userId: z.string().uuid(),
  reason: z.string(),
  referenceId: z.string().uuid().optional().nullable(),
  delta: z.number().int(),
})

app.post('/api/karma/award', async (request, reply) => {
  const key = request.headers['x-internal-key']
  if (key !== env.karmaInternalApiKey) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  const parsed = AwardBodySchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid body' })
  }

  const { userId, reason, referenceId, delta } = parsed.data
  if (!isKarmaAwardReason(reason)) {
    return reply.code(400).send({ error: 'Invalid reason for award' })
  }
  const expected = getAwardDelta(reason as KarmaAwardReason)
  if (delta !== expected) {
    return reply.code(400).send({ error: 'Delta does not match KARMA_RULES for reason' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (referenceId) {
      const existing = await client.query(
        `SELECT id FROM public.karma_ledger
         WHERE user_id = $1 AND reason = $2::karma_reason AND reference_id = $3
         LIMIT 1`,
        [userId, reason, referenceId]
      )
      if (existing.rowCount) {
        await client.query('COMMIT')
        const bal = await client.query(`SELECT karma_balance FROM public.users WHERE id = $1`, [userId])
        return reply.send({ idempotent: true, balance: bal.rows[0]?.karma_balance ?? 0 })
      }
    }

    await client.query(
      `INSERT INTO public.karma_ledger (user_id, delta, reason, reference_id)
       VALUES ($1, $2, $3::karma_reason, $4)`,
      [userId, delta, reason, referenceId ?? null]
    )
    const bal = await client.query(`SELECT karma_balance FROM public.users WHERE id = $1`, [userId])
    await client.query('COMMIT')
    return reply.send({ idempotent: false, balance: bal.rows[0]?.karma_balance ?? 0 })
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    request.log.error(e)
    return reply.code(500).send({ error: 'Award failed' })
  } finally {
    client.release()
  }
})

app.get('/api/users/me/karma', async (request, reply) => {
  const userId = await getUserIdFromBearer(request.headers.authorization)
  if (!userId) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  const client = await pool.connect()
  try {
    const bal = await client.query(`SELECT karma_balance FROM public.users WHERE id = $1`, [userId])
    const balance = bal.rows[0]?.karma_balance ?? 0
    const tx = await client.query(
      `SELECT id, delta, reason::text AS reason, reference_id, created_at, expires_at
       FROM public.karma_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    )
    return reply.send({
      balance: Number(balance),
      recentTransactions: tx.rows,
    })
  } finally {
    client.release()
  }
})

const RedeemBodySchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().int().positive(),
})

app.post('/api/karma/redeem', async (request, reply) => {
  const userId = await getUserIdFromBearer(request.headers.authorization)
  if (!userId) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }

  const parsed = RedeemBodySchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid body' })
  }

  const { orderId, amount } = parsed.data
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const u = await client.query(
      `SELECT karma_balance FROM public.users WHERE id = $1 FOR UPDATE`,
      [userId]
    )
    if (!u.rowCount) {
      await client.query('ROLLBACK')
      return reply.code(404).send({ error: 'User not found' })
    }
    const balance = Number(u.rows[0].karma_balance ?? 0)

    const o = await client.query(
      `SELECT id, user_id, total_amount, discount_amount, karma_credits_used, payment_status
       FROM public.parent_orders
       WHERE id = $1
       FOR UPDATE`,
      [orderId]
    )
    if (!o.rowCount) {
      await client.query('ROLLBACK')
      return reply.code(404).send({ error: 'Order not found' })
    }
    const order = o.rows[0] as {
      user_id: string
      total_amount: string | number
      discount_amount: string | number
      karma_credits_used: string | number
      payment_status: string
    }
    if (order.user_id !== userId) {
      await client.query('ROLLBACK')
      return reply.code(403).send({ error: 'Forbidden' })
    }
    if (Number(order.karma_credits_used) > 0) {
      await client.query('ROLLBACK')
      return reply.code(400).send({ error: 'Karma already applied to this order' })
    }
    if (['paid', 'cancelled'].includes(String(order.payment_status))) {
      await client.query('ROLLBACK')
      return reply.code(400).send({ error: 'Order cannot be modified' })
    }

    const totalAmount = Number(order.total_amount)
    const previousDiscount = Number(order.discount_amount ?? 0)
    const subtotalGross = totalAmount + previousDiscount
    if (subtotalGross <= 0) {
      await client.query('ROLLBACK')
      return reply.code(400).send({ error: 'Invalid order amount' })
    }

    if (amount > balance) {
      await client.query('ROLLBACK')
      return reply.code(400).send({ error: 'Insufficient balance' })
    }
    const cap = maxRedeemKarmaForSubtotalInr(subtotalGross)
    if (amount > cap) {
      await client.query('ROLLBACK')
      return reply.code(400).send({ error: 'Amount exceeds 20% of order subtotal' })
    }

    const discountInr = karmaPointsToInr(amount)
    const newTotal = Math.max(0, subtotalGross - discountInr)
    if (newTotal < 0) {
      await client.query('ROLLBACK')
      return reply.code(400).send({ error: 'Redeem results in negative total' })
    }

    await client.query(
      `INSERT INTO public.karma_ledger (user_id, delta, reason, reference_id)
       VALUES ($1, $2, 'REDEMPTION_AT_CHECKOUT', $3::uuid)`,
      [userId, -amount, orderId]
    )

    await client.query(
      `UPDATE public.parent_orders
       SET total_amount = $1,
           discount_amount = $2,
           karma_credits_used = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [newTotal, previousDiscount + discountInr, amount, orderId]
    )

    const b2 = await client.query(`SELECT karma_balance FROM public.users WHERE id = $1`, [userId])
    await client.query('COMMIT')
    return reply.send({
      balance: Number(b2.rows[0]?.karma_balance ?? 0),
      discountInr,
      newTotal,
    })
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // ignore
    }
    request.log.error(e)
    return reply.code(500).send({ error: 'Redeem failed' })
  } finally {
    client.release()
  }
})

app.get('/health', async () => ({ ok: true }))

const start = async () => {
  try {
    await app.listen({ port: env.port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void start()
