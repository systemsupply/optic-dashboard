import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { message, userEmail } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const { error } = await resend.emails.send({
    from: 'Optic Support <support@optic.sh>',
    to: 'support@system.supply',
    replyTo: userEmail ?? 'support@optic.sh',
    subject: `Support request${userEmail ? ` from ${userEmail}` : ''}`,
    text: `${message}\n\n---\nSent from the Optic dashboard support panel${userEmail ? `\nUser: ${userEmail}` : ''}`,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
