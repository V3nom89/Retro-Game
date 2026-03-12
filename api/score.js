import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  // GET /api/score?username=XXX&game=YYY
  if (req.method === "GET") {
    const { username, game } = req.query;
    if (!username) return res.status(400).json({ error: "username mancante" });
    if (!game) return res.status(400).json({ error: "game mancante" });
    const rows = await sql`
      SELECT high_score FROM game_scores
      WHERE LOWER(username) = LOWER(${username}) AND game = ${game}
    `;
    return res.status(200).json({ high_score: rows[0]?.high_score ?? 0 });
  }

  // POST /api/score  { username, game, score }
  if (req.method === "POST") {
    const { username, game, score } = req.body;
    if (!username || !game || score == null)
      return res.status(400).json({ error: "dati mancanti" });

    // Upsert: inserisci o aggiorna solo se il nuovo score è maggiore
    const rows = await sql`
      INSERT INTO game_scores (username, game, high_score, updated_at)
      VALUES (LOWER(${username}), ${game}, ${Math.floor(score)}, NOW())
      ON CONFLICT (username, game)
      DO UPDATE SET
        high_score = GREATEST(game_scores.high_score, EXCLUDED.high_score),
        updated_at = NOW()
      RETURNING high_score
    `;
    return res.status(200).json({ high_score: rows[0].high_score });
  }

  return res.status(405).end();
}
