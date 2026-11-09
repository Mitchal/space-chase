// Sends through Mailgun (https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages).
// Needs the secret MAILGUN_API_KEY, MAILGUN_DOMAIN (the sending domain added in Mailgun), EMAIL_FROM on that domain,
// and MAILGUN_REGION = "eu" when the domain lives in Mailgun's EU region (README).
export async function sendWithMailgun(env, { to, subject, text }) {
  const host = env.MAILGUN_REGION === 'eu' ? 'api.eu.mailgun.net' : 'api.mailgun.net';
  const form = new FormData();
  // o:tracking off: no tracking pixel or rewritten links in a login email.
  for (const [k, v] of Object.entries({ from: env.EMAIL_FROM, to, subject, text, 'o:tracking': 'no' })) form.append(k, v);
  const res = await fetch(`https://${host}/v3/${encodeURIComponent(env.MAILGUN_DOMAIN)}/messages`, {
    method: 'POST',
    headers: { authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Mailgun answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
}
