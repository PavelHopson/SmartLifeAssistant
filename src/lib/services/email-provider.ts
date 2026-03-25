// Email provider abstraction with Resend support

export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<boolean>;
}

// Development provider — logs to console
class DevEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string): Promise<boolean> {
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[DEV EMAIL] Body: ${html.substring(0, 200)}...`);
    return true;
  }
}

// Resend provider
class ResendEmailProvider implements EmailProvider {
  private apiKey: string;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to,
          subject,
          html,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("[RESEND] Failed to send email:", err);
      return false;
    }
  }
}

// Factory: env-based selection
export function createEmailProvider(): EmailProvider {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Smart Life <noreply@smartlife.app>";

  if (resendKey) {
    return new ResendEmailProvider(resendKey, fromEmail);
  }

  return new DevEmailProvider();
}

// Email templates
export function renderEmailTemplate(
  type: string,
  data: Record<string, string | number>
): { subject: string; html: string } {
  switch (type) {
    case "action_generated":
      return {
        subject: `Smart Life: ${data.count} new actions ready`,
        html: emailLayout(`
          <h2>New actions detected</h2>
          <p>We found <strong>${data.count} actions</strong> that could save you money.</p>
          <p>Potential savings: <strong>£${data.savings}/year</strong></p>
          <a href="${data.appUrl}/actions" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Review Actions</a>
        `),
      };

    case "action_requires_manual_step":
      return {
        subject: `Smart Life: "${data.title}" needs your attention`,
        html: emailLayout(`
          <h2>Manual step required</h2>
          <p><strong>${data.title}</strong></p>
          <p>${data.description}</p>
          ${data.url ? `<a href="${data.url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Complete Step</a>` : ""}
          <p style="margin-top:16px;"><a href="${data.appUrl}/tasks">View all tasks</a></p>
        `),
      };

    case "reminder_due":
      return {
        subject: `Smart Life: "${data.title}" is ${data.urgency}`,
        html: emailLayout(`
          <h2>Task Reminder</h2>
          <p><strong>${data.title}</strong> is <strong>${data.urgency}</strong>.</p>
          <a href="${data.appUrl}/tasks" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">View Tasks</a>
        `),
      };

    case "savings_detected":
      return {
        subject: `Smart Life: £${data.amount} in potential savings found`,
        html: emailLayout(`
          <h2>Savings Detected!</h2>
          <p>We found <strong>£${data.amount}/year</strong> in potential savings.</p>
          <p>${data.issues} issues need your attention.</p>
          <a href="${data.appUrl}/wow" style="display:inline-block;padding:12px 24px;background:#22c55e;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">See What We Found</a>
        `),
      };

    default:
      return {
        subject: `Smart Life: ${data.title || "Update"}`,
        html: emailLayout(`<p>${data.body || "You have a new update."}</p>`),
      };
  }
}

function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#1a1a1a;">
  <div style="margin-bottom:24px;">
    <strong style="font-size:18px;">Smart Life Assistant</strong>
  </div>
  ${content}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#737373;">
    <p>You received this email because you use Smart Life Assistant.</p>
  </div>
</body></html>`;
}
