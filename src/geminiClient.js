// Modelos tentados em ordem quando a quota do anterior se esgota (429)
const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/**
 * Em desenvolvimento: chama o Google diretamente se existir VITE_GEMINI_API_KEY no .env
 * Em produção (Vercel): usa /api/gemini (sem expor a chave no browser; evita CORS)
 *
 * Em dev, faz fallback automático por modelos quando recebe 429 (quota esgotada).
 */
export async function geminiGenerateContent(payload) {
  const devKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (import.meta.env.DEV && devKey) {
    for (const model of FALLBACK_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(devKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 429 || response.status === 503) {
        console.warn(`geminiClient: modelo ${model} indisponível (${response.status}), tentando próximo...`);
        continue;
      }

      return response;
    }

    // Retorna uma Response sintética com o erro de quota total
    return new Response(
      JSON.stringify({ error: 'Quota esgotada em todos os modelos Gemini disponíveis. Tente novamente mais tarde.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
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
