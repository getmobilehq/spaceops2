import { getResend } from "@/lib/resend"

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}) {
  const resend = getResend()
  await resend.emails.send({
    from: `SpaceOps <${process.env.RESEND_FROM_EMAIL || "noreply@spacops.app"}>`,
    ...opts,
  })
}
