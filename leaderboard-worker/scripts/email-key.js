// Prints the email key the Worker stores for an address (src/auth/email-key.js), to find or remove someone's account
// by hand when they write in (README, "Remove an account by hand"). Needs the live pepper, from where you saved it:
//   EMAIL_PEPPER='…' node scripts/email-key.js anna@example.com
// (In PowerShell: $env:EMAIL_PEPPER='…'; node scripts/email-key.js anna@example.com)
import { cleanEmail } from '../src/auth/email-address.js';
import { emailKey, pepperSet } from '../src/auth/email-key.js';

const email = cleanEmail(process.argv[2] ?? '');
if (!email) { console.error('Usage: node scripts/email-key.js <email address>'); process.exit(1); }
if (!pepperSet(process.env)) { console.error('Set EMAIL_PEPPER to the live pepper first (at least 32 characters).'); process.exit(1); }
console.log(await emailKey(process.env.EMAIL_PEPPER, email));
