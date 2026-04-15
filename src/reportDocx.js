/**
 * Preenchimento do modelo Word (OOXML) para o Relatório de acompanhamento.
 */

export function escapeXmlPreserve(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraphPlainTextFromOOXml(p) {
  const texts = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = re.exec(p))) texts.push(m[1]);
  return texts.join('');
}

function splitOOXmlParagraphs(xml) {
  return xml.split(/(?=<w:p\b)/);
}

function setLastPlaceholderWTextInParagraph(pXml, escapedValue) {
  const re = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
  let last = null;
  let m;
  while ((m = re.exec(pXml)) !== null) last = m;
  if (!last) return pXml;
  const inner = last[2];
  if (!/^[\s\u00a0]*$/.test(inner)) return pXml;
  return pXml.replace(last[0], `<w:t${last[1]}>${escapedValue}</w:t>`);
}

function replaceParagraphInnerSingleRun(pXml, escapedValue) {
  const full = pXml.match(/^(<w:p\b[^>]*>)([\s\S]*)(<\/w:p>)$/);
  if (!full) return pXml;
  const open = full[1];
  const inner = full[2];
  const close = full[3];
  const pPrMatch = inner.match(/^<w:pPr\b[\s\S]*?<\/w:pPr>/);
  const pPr = pPrMatch ? pPrMatch[0] : '';
  const rPr =
    '<w:rPr><w:rFonts w:ascii="Arimo" w:hAnsi="Arimo" w:eastAsia="Arimo" w:cs="Arimo"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="pt-BR"/></w:rPr>';
  const run = `<w:r>${rPr}<w:t xml:space="preserve">${escapedValue}</w:t></w:r>`;
  return `${open}${pPr}${run}${close}`;
}

function buildActivityParagraphOOXml(line) {
  const trimmed = String(line ?? '').trim();
  const pPr =
    '<w:pPr><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/><w:ind w:start="0" w:firstLine="0"/><w:jc w:val="start"/></w:pPr>';
  const rPrArimo =
    '<w:rPr><w:rFonts w:ascii="Arimo" w:hAnsi="Arimo" w:eastAsia="Arimo" w:cs="Arimo"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>';
  const xmlns =
    'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordml"';
  if (/^Dia\s/i.test(trimmed)) {
    return `<w:p ${xmlns}>${pPr}<w:r>${rPrArimo}<w:t xml:space="preserve">${escapeXmlPreserve(trimmed)}</w:t></w:r></w:p>`;
  }
  const r1 =
    '<w:r><w:rPr><w:rFonts w:ascii="Calibri (MS)" w:hAnsi="Calibri (MS)" w:eastAsia="Calibri (MS)" w:cs="Calibri (MS)"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">- </w:t></w:r>';
  const r2 = `<w:r>${rPrArimo}<w:t xml:space="preserve">${escapeXmlPreserve(trimmed)}</w:t></w:r>`;
  return `<w:p ${xmlns}>${pPr}${r1}${r2}</w:p>`;
}

/**
 * @param {string} xml — conteúdo de word/document.xml
 * @param {object} rep — payload normalizado (strings, atividades_realizadas: string[])
 */
export function fillRelatorioDocumentXml(xml, rep) {
  const parts = splitOOXmlParagraphs(xml);
  const plain = (p) => paragraphPlainTextFromOOXml(p).replace(/\s+/g, ' ').trim();
  const esc = (v) => escapeXmlPreserve(v ?? '');

  const patchLastIf = (predicate, value) => {
    const idx = parts.findIndex((p) => predicate(plain(p)));
    if (idx === -1) return;
    parts[idx] = setLastPlaceholderWTextInParagraph(parts[idx], esc(value));
  };

  patchLastIf((t) => /Escola/.test(t) && /atendida/i.test(t), rep.cabecalho?.escola_atendida ?? '');
  patchLastIf((t) => /^Ocupa/i.test(t.trim()), rep.cabecalho?.ocupacao ?? '');
  patchLastIf((t) => /Competidor/i.test(t) && /:/.test(t), rep.cabecalho?.competidor ?? '');
  patchLastIf((t) => t.includes('Treinador') && t.includes('escolar'), rep.cabecalho?.treinador_escolar ?? '');
  patchLastIf((t) => t.includes('Treinador') && t.includes('Regional'), rep.cabecalho?.treinador_regional ?? '');
  patchLastIf((t) => /^Data/i.test(t.trim()), rep.data_relatorio ?? '');

  const introHeadingIdx = parts.findIndex((p) => plain(p).includes('INTRODU'));
  if (introHeadingIdx !== -1 && parts[introHeadingIdx + 1]) {
    parts[introHeadingIdx + 1] = replaceParagraphInnerSingleRun(
      parts[introHeadingIdx + 1],
      esc(rep.introducao)
    );
  }

  const iAtiv = parts.findIndex((p) => plain(p).includes('ATIVIDADES REALIZADAS'));
  const iParecer = parts.findIndex((p) => plain(p).includes('PARECER') && plain(p).includes('CNICO'));
  if (iAtiv !== -1 && iParecer !== -1 && iParecer > iAtiv) {
    const lines = Array.isArray(rep.atividades_realizadas) ? rep.atividades_realizadas : [];
    const mid = lines.filter(Boolean).map((l) => buildActivityParagraphOOXml(l));
    parts.splice(iAtiv + 1, iParecer - iAtiv - 1, ...mid);
  }

  const repOne = (predicate, field, singleRun = true) => {
    const idx = parts.findIndex((p) => predicate(plain(p)));
    if (idx === -1) return;
    if (singleRun) parts[idx] = replaceParagraphInnerSingleRun(parts[idx], esc(field));
    else parts[idx] = setLastPlaceholderWTextInParagraph(parts[idx], esc(field));
  };

  repOne((t) => t.startsWith('Desenvolver'), rep.parecer_tecnico_desenvolvimento, true);
  repOne((t) => t.startsWith('Nota no simulado'), rep.nota_simulado_medias_objetivos, true);
  repOne((t) => t.includes('Pontos Fortes') && t.includes('competidor'), rep.pontos_fortes_competidor, false);
  repOne((t) => t.includes('Pontos de Melhoria') && t.includes('competidor'), rep.pontos_melhoria_competidor, false);
  repOne((t) => t.includes('infra') && t.includes('treinamento'), rep.consideracoes_infra_treinamento, true);
  repOne((t) => t.includes('docente'), rep.consideracoes_docente, true);
  repOne((t) => t.trim().startsWith('(inserir fotos'), rep.observacoes_complementares_fotos, true);

  const iEnc = parts.findIndex((p) => plain(p).includes('ENCAMINHAMENTOS'));
  if (iEnc !== -1) {
    const enc1 = parts.findIndex((p, i) => i > iEnc && plain(p).includes('encaminhamentos realizados'));
    const enc2 = parts.findIndex((p, i) => i > iEnc && plain(p).includes('Recomenda-se ter sempre'));
    if (enc1 !== -1) parts[enc1] = replaceParagraphInnerSingleRun(parts[enc1], esc(rep.encaminhamentos_paragrafo_1));
    if (enc2 !== -1) parts[enc2] = replaceParagraphInnerSingleRun(parts[enc2], esc(rep.encaminhamentos_paragrafo_2));
  }

  repOne((t) => t.startsWith('Local, data'), rep.local_data_assinatura, true);

  return parts.join('');
}

export function defaultRelatorioPayload() {
  return {
    cabecalho: {
      escola_atendida: '',
      ocupacao: '',
      competidor: '',
      treinador_escolar: '',
      treinador_regional: '',
    },
    data_relatorio: '',
    introducao: '',
    atividades_realizadas: [],
    parecer_tecnico_desenvolvimento: '',
    nota_simulado_medias_objetivos: '',
    pontos_fortes_competidor: '',
    pontos_melhoria_competidor: '',
    consideracoes_infra_treinamento: '',
    consideracoes_docente: '',
    observacoes_complementares_fotos: '',
    encaminhamentos_paragrafo_1: '',
    encaminhamentos_paragrafo_2: '',
    local_data_assinatura: '',
  };
}

export function mergeRelatorioPayload(parsed) {
  const d = defaultRelatorioPayload();
  if (!parsed || typeof parsed !== 'object') return d;
  return {
    ...d,
    ...parsed,
    cabecalho: { ...d.cabecalho, ...(parsed.cabecalho || {}) },
    atividades_realizadas: Array.isArray(parsed.atividades_realizadas)
      ? parsed.atividades_realizadas.map(String)
      : d.atividades_realizadas,
  };
}

export function parseGeminiJsonResponse(text) {
  let t = String(text ?? '').trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (fence) t = fence[1].trim();
  return JSON.parse(t);
}
