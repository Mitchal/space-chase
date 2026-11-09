// A device renaming itself (POST /score with `was`): the old name's rows for that day move to the new name, and the
// old name is let go so anyone may claim it. Only the device that owns the old name can do this; for any other `was`
// (someone else's name, or one nobody owns) nothing happens, so `was` can't touch anyone else's rows.
import { ownerOf, releaseName } from './name-owners.js';
import { moveDay } from './scores-db.js';

// → true when the rows moved.
export async function renameDay(db, { day, from, to, name, owner }) {
  if (from === to || (await ownerOf(db, from)) !== owner) return false;
  await db.batch([...moveDay(db, { day, from, to, name }), releaseName(db, from, owner)]);
  return true;
}
