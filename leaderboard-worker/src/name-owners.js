// The name_owners table (migrations/0003_name_owners.sql): each name on the board belongs to the device that first
// posted with it. owner is the device key's hash (device-key.js); key is the name folded to lower case (nameKey).

// Claims key for owner if nobody has it yet. → true when owner holds it now (just claimed, or already theirs).
// Two devices claiming at once: only one insert lands, and each then reads who won.
export async function claimName(db, key, owner, now = Date.now()) {
  await db.prepare(`INSERT INTO name_owners (name_key, owner, claimed_at) VALUES (?1, ?2, ?3)
    ON CONFLICT (name_key) DO NOTHING`).bind(key, owner, now).run();
  return (await ownerOf(db, key)) === owner;
}

export const ownerOf = (db, key) =>
  db.prepare('SELECT owner FROM name_owners WHERE name_key = ?1').bind(key).first('owner');

// Lets go of a name (after a rename), so anyone may claim it again. Only its owner can.
export const releaseName = (db, key, owner) =>
  db.prepare('DELETE FROM name_owners WHERE name_key = ?1 AND owner = ?2').bind(key, owner);
