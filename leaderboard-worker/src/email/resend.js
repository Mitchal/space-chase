// Sends through Resend (https://resend.com/docs/api-reference/emails/send-email).
// Needs the secret RESEND_API_KEY and EMAIL_FROM, an address on a domain verified in Resend (README).
export async function sendWithResend(env, { to, subject, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Resend answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
