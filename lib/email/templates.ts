function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
    <div style="background:#18181b;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">SpaceOps</h1>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:12px;">SpaceOps — Quality control for janitorial services</p>
    </div>
  </div>
</body>
</html>`
}

export function welcomeEmail({
  firstName,
  orgName,
  loginUrl,
}: {
  firstName: string
  orgName: string
  loginUrl: string
}): { subject: string; html: string } {
  return {
    subject: `Welcome to SpaceOps, ${firstName}!`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;">Welcome to SpaceOps!</h2>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        Hi ${firstName},
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        Your organisation <strong>${orgName}</strong> has been created. You can now start managing your cleaning operations.
      </p>
      <p style="margin:0 0 24px;color:#3f3f46;line-height:1.6;">
        Here&rsquo;s what you can do next:
      </p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#3f3f46;line-height:1.8;">
        <li>Add your first building</li>
        <li>Invite team members</li>
        <li>Set up cleaning checklists</li>
      </ul>
      <a href="${loginUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Log In to SpaceOps
      </a>
    `),
  }
}

export function inviteEmail({
  firstName,
  inviterOrgName,
  role,
  acceptUrl,
}: {
  firstName: string
  inviterOrgName: string
  role: string
  acceptUrl: string
}): { subject: string; html: string } {
  return {
    subject: `You've been invited to join ${inviterOrgName} on SpaceOps`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;">You&rsquo;re Invited!</h2>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        Hi ${firstName},
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        You&rsquo;ve been invited to join <strong>${inviterOrgName}</strong> on SpaceOps as a <strong>${role}</strong>.
      </p>
      <p style="margin:0 0 24px;color:#3f3f46;line-height:1.6;">
        Click the button below to accept the invitation and set up your account.
      </p>
      <a href="${acceptUrl}" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;">
        Accept Invitation
      </a>
    `),
  }
}

export function subscriptionConfirmEmail({
  orgName,
  planName,
  periodEnd,
}: {
  orgName: string
  planName: string
  periodEnd: string
}): { subject: string; html: string } {
  return {
    subject: `Your ${planName} subscription is active`,
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;">Subscription Confirmed</h2>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        Great news! Your <strong>${orgName}</strong> organisation is now on the <strong>${planName}</strong> plan.
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        Your current billing period ends on <strong>${periodEnd}</strong>.
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        You now have access to all ${planName} features. Enjoy!
      </p>
    `),
  }
}

export function subscriptionCanceledEmail({
  orgName,
  periodEnd,
}: {
  orgName: string
  periodEnd: string
}): { subject: string; html: string } {
  return {
    subject: "Your SpaceOps subscription has been canceled",
    html: emailWrapper(`
      <h2 style="margin:0 0 16px;color:#18181b;font-size:18px;">Subscription Canceled</h2>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        Your subscription for <strong>${orgName}</strong> has been canceled.
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        You&rsquo;ll continue to have access to your current plan features until <strong>${periodEnd}</strong>. After that, your organisation will be moved to the Free plan.
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        If this was a mistake, you can resubscribe at any time from your Billing settings.
      </p>
    `),
  }
}
