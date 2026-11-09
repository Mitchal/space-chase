// The email a login code arrives in: plain text, short, and readable in a phone's notification.
export function loginCodeMessage(code) {
  return {
    subject: `${code} is your Space Chase code`,
    text: [
      `Your Space Chase login code: ${code}`,
      '',
      'Type it in the game within 10 minutes. It works once.',
      '',
      "If you didn't ask for it, ignore this email: nobody can log in without the code.",
    ].join('\n'),
  };
}
