/**
 * Em desenvolvimento: chama o Google diretamente se existir VITE_GEMINI_API_KEY no .env
 * Em produção (Vercel): usa /api/gemini (sem expor a chave no browser; evita CORS)
 */
export async function geminiGenerateContent(payload) {
  const devKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (import.meta.env.DEV && devKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(devKey)}`;
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  return fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** true se em dev falta .env local; em produção o proxy usa variáveis do servidor */
export function isGeminiConfiguredForCurrentEnv() {
  if (import.meta.env.DEV) {
    return Boolean(import.meta.env.VITE_GEMINI_API_KEY);
  }
  return true;
}
