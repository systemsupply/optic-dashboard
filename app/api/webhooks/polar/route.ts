import { Webhooks } from '@polar-sh/nextjs'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Maps Polar product IDs to internal plan names.
const PRODUCT_PLAN_MAP: Record<string, string> = {
  'ce334a96-7bbe-4f88-9bc4-0c08384757a1': 'pro', // Optic Pro
  '6db25977-65ab-4e58-bd2e-fdc55e18bb86': 'max', // Optic Max
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  // Subscription becomes active (after checkout, including trial start)
  onSubscriptionActive: async (payload) => {
    const { customer, productId, id: subscriptionId, status } = payload.data
    const userId = customer.externalId
    const plan = PRODUCT_PLAN_MAP[productId]

    if (!userId || !plan) return

    await supabaseAdmin
      .from('clients')
      .update({
        plan,
        polar_subscription_id: subscriptionId,
        subscription_status: status,
      })
      .eq('user_id', userId)
  },

  // Plan changes, renewals, status changes (e.g. past_due)
  onSubscriptionUpdated: async (payload) => {
    const { customer, productId, id: subscriptionId, status } = payload.data
    const userId = customer.externalId
    const plan = PRODUCT_PLAN_MAP[productId]

    if (!userId) return

    const update: Record<string, unknown> = {
      polar_subscription_id: subscriptionId,
      subscription_status: status,
    }
    if (plan) update.plan = plan

    await supabaseAdmin.from('clients').update(update).eq('user_id', userId)
  },

  // Customer canceled — keep their plan until current_period_end (revoke handles downgrade)
  onSubscriptionCanceled: async (payload) => {
    const { customer } = payload.data
    const userId = customer.externalId

    if (!userId) return

    await supabaseAdmin
      .from('clients')
      .update({ subscription_status: 'canceled' })
      .eq('user_id', userId)
  },

  // Customer un-cancels before period end
  onSubscriptionUncanceled: async (payload) => {
    const { customer, status } = payload.data
    const userId = customer.externalId

    if (!userId) return

    await supabaseAdmin
      .from('clients')
      .update({ subscription_status: status })
      .eq('user_id', userId)
  },

  // Subscription period has ended without renewal — downgrade to starter
  onSubscriptionRevoked: async (payload) => {
    const { customer } = payload.data
    const userId = customer.externalId

    if (!userId) return

    await supabaseAdmin
      .from('clients')
      .update({
        plan: 'starter',
        subscription_status: 'revoked',
        polar_subscription_id: null,
      })
      .eq('user_id', userId)
  },
})
