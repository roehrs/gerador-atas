/**
 * Proxy server-side para a Generative Language API (Gemini).
 * Evita CORS no browser e mantém a chave só no servidor (Vercel).
 *
 * Variáveis na Vercel (qualquer uma):
 * - GEMINI_API_KEY (recomendado, não expõe no bundle)
 * - VITE_GEMINI_API_KEY (também lida no servidor)
 */

// Modelos tentados em ordem quando a quota do anterior se esgota (429)
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).setHeader('Allow', 'POST').json({ error: 'Method not allowed' });
    return;
  }

  const apiKeys = [
    process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
  ].filter(Boolean);

  if (apiKeys.length === 0) {
    res.status(500).json({
      error: 'Chave Gemini não configurada no servidor. Defina GEMINI_API_KEY na Vercel e faça redeploy.',
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

  try {
    for (const [keyIndex, apiKey] of apiKeys.entries()) {
      for (const model of FALLBACK_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (r.status === 429 || r.status === 503 || r.status === 404) {
          console.warn(`api/gemini: chave ${keyIndex + 1}, modelo ${model} indisponível (${r.status}), tentando próximo...`);
          continue;
        }

        const text = await r.text();
        res.status(r.status).setHeader('Content-Type', 'application/json; charset=utf-8').send(text);
        return;
      }
    }

    res.status(429).json({ error: 'Quota esgotada em todos os modelos e chaves Gemini disponíveis. Tente novamente mais tarde.' });
  } catch (e) {
    console.error('api/gemini:', e);
    res.status(500).json({ error: e.message || 'Erro ao contactar o Gemini' });
  }
}
