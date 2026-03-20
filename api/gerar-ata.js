export default async function handler(req, res) {
    // Apenas aceita pedidos POST (que é o que o nosso frontend faz)
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido.' });
    }
  
    const { textoBruto, contexto } = req.body;
  
    if (!textoBruto) {
      return res.status(400).json({ error: 'O texto bruto é obrigatório.' });
    }
  
    // Chaves da Azure OpenAI (serão lidas das variáveis de ambiente da Vercel)
    const apiKey = process.env.AZURE_OPENAI_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT; 
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT; // ex: gpt-4 ou gpt-35-turbo
    const apiVersion = '2024-02-15-preview'; // Versão padrão da API da Azure
  
    if (!apiKey || !endpoint || !deploymentName) {
      return res.status(500).json({ error: 'Configuração da API Azure em falta.' });
    }
  
    // O "Cérebro" da operação: Como a IA deve agir e formatar
    const systemPrompt = `
      Atuas como um Analista de Qualidade e Gestor Rigoroso das Competições Senac. 
      O teu objetivo é transformar anotações soltas, transcrições de áudio confusas ou rascunhos de reuniões numa ATA profissional, clara e estruturada.
      
      O tom de voz deve refletir a filosofia da "Jornada do Herói" do Senac: foco na superação de limites, desenvolvimento técnico de excelência e ascensão profissional do aluno.
      
      Regras estritas de formatação (Usa Markdown):
      1. Não adiciones introduções como "Aqui está o resumo...". Devolve APENAS o conteúdo da ATA.
      2. Usa sempre a seguinte estrutura exata:
  
      📋 **RESUMO DA ASSESSORIA**
      - **Data:** ${contexto.data.split('-').reverse().join('/')}
      - **Escola:** ${contexto.escola || 'Não informada'}
      - **Treinador:** ${contexto.treinador || 'Não informado'}
  
      🎯 **PONTOS PRINCIPAIS:**
      - [Extrai os tópicos mais importantes abordados de forma objetiva]
  
      🚧 **DIFICULDADES SUPERADAS:**
      - [Identifica os problemas, dúvidas ou erros mencionados e como foram/serão resolvidos]
  
      🚀 **PRÓXIMOS PASSOS:**
      - [Lista as metas claras, exercícios ou tarefas para o próximo encontro]
    `;
  
    try {
      // Faz a chamada à API da Microsoft Azure OpenAI
      const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Por favor, formata este relato/transcrição: \n\n${textoBruto}` }
          ],
          temperature: 0.3, // Temperatura baixa para ser objetivo e não "inventar" factos
          max_tokens: 800
        })
      });
  
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Erro da Azure:", errorData);
        throw new Error("Falha na comunicação com a Azure OpenAI");
      }
  
      const data = await response.json();
      const ataFormatada = data.choices[0].message.content.trim();
  
      // Devolve o texto bonito para o nosso Frontend (App.jsx)
      return res.status(200).json({ ataFormatada });
  
    } catch (error) {
      console.error("Erro na Serverless Function:", error);
      return res.status(500).json({ error: 'Erro interno ao gerar a ATA.' });
    }
  }