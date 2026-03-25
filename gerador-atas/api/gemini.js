/**
 * Proxy server-side para a Generative Language API (Gemini).
 * Evita CORS no browser e mantém a chave só no servidor (Vercel).
 *
 * Variáveis na Vercel (qualquer uma):
 * - GEMINI_API_KEY (recomendado, não expõe no bundle)
 * - VITE_GEMINI_API_KEY (também lida no servidor)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'Chave Gemini não configurada no servidor. Defina GEMINI_API_KEY ou VITE_GEMINI_API_KEY na Vercel e faça redeploy.',
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      res.status(400).json({ error: 'JSON inválido no body' });
      return;
    }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Body obrigatório (JSON)' });
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json; charset=utf-8').send(text);
  } catch (e) {
    console.error('api/gemini:', e);
    res.status(500).json({ error: e.message || 'Erro ao contactar o Gemini' });
  }
}
