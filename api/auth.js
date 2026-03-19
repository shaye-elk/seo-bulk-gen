export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = process.env.ACCESS_PASSWORD;
  if (!password) {
    // No password configured — allow access
    return res.status(200).json({ ok: true });
  }

  const { password: submitted } = req.body || {};
  if (submitted === password) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: 'Invalid access code' });
}
