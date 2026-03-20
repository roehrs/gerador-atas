// Arquivo: api/gerar-ata.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { textoBruto, contexto } = req.body;

  if (!textoBruto) {
    return res.status(400).json({ error: 'O texto bruto é obrigatório.' });
  }

  // IMPORTANTE: Em produção na Vercel, você cadastra GEMINI_API_KEY no painel de Environment Variables.
  // Localmente, você pode usar a chave direta temporariamente, mas com ASPAS.
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCQ-q3kQ61f9EWk_y85nDONkJBDeBeSozU";

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  const dataFormatada = contexto?.data ? contexto.data.split('-').reverse().join('/') : 'Não informada';
  const escolaStr = contexto?.escola || 'Não informada';
  const treinadorStr = contexto?.treinador || 'Não informado';

  const systemPrompt = `Você é um assistente especialista em gestão educacional e documentação corporativa de alto nível. 
Sua missão é LER, INTERPRETAR, SINTETIZAR e ABSTRAIR o texto de entrada referente a um encontro de alinhamento entre a gestão e o Treinador Escolar.

## ESTRUTURA OBRIGATÓRIA DA ATA:
Gere a resposta em formato Markdown rigorosamente com esta estrutura:

# Ata de Alinhamento de Treinamento
**Data:** ${dataFormatada}
**Escola/Unidade:** ${escolaStr}
**Treinador:** ${treinadorStr}

## 1. Objetivo do Encontro
[Resumo do encontro]

## 2. Tópicos Discutidos e Dúvidas Esclarecidas
* **[Tema]:** [Síntese]

## 3. Recomendações e Ajustes de Treinamento
* **[Foco]:** [Orientação]

## 4. Próximos Passos
* [Ação] - Prazo: [Prazo]`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: "user",
          parts: [{ text: `Analise a transcrição abaixo e elabore a Ata final:\n\nTRANSCRIÇÃO:\n${textoBruto}` }]
        }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!response.ok) {
      throw new Error(`Erro do Google: ${await response.text()}`);
    }

    const data = await response.json();
    const ataFormatada = data.candidates[0].content.parts[0].text.trim();
    
    return res.status(200).json({ ataFormatada });

  } catch (error) {
    console.error("Erro no Backend:", error);
    return res.status(500).json({ error: 'Erro interno ao gerar a ATA com a IA.' });
  }
}