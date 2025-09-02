import { Request, Response } from 'express';

function matchSection(md: string, title: string): string {
  const re = new RegExp(`###\\s+${title}\\s*\\n+([\\s\\S]*?)(?=\\n### |\\n## |\\n$)`, 'i');
  const m = md.match(re);
  return m ? m[1] : '';
}

function parseMarkdownTable(sectionMd: string): string[][] {
  const raw = sectionMd.split('\n').map(s => s.trim()).filter(Boolean);
  const cand = raw.filter(l => l.includes('|'));
  if (cand.length < 2) return [];
  const norm = cand
    .map(l => (l.startsWith('|') ? l : '|' + l))
    .map(l => (l.endsWith('|') ? l : l + '|'));
  const sep = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/;
  const hadHeader = norm.some(l => sep.test(l));
  const noSep = norm.filter(l => !sep.test(l));
  const data = hadHeader ? noSep.slice(1) : noSep;
  const rows = data.map(line => line.slice(1, -1).split('|').map(c => c.trim()));
  const real = rows.filter(cells => cells.some(c => c && c !== '---' && c !== '-'));
  return real;
}

function mapRequirements(rows: string[][]) {
  return rows.map(cells => ({
    id: cells[0] || '',
    descricao: [cells[1] || '', ...cells.slice(2)].filter(Boolean).join(' | ')
  }));
}

function mapTestCases(rows: string[][]) {
  return rows.map(cells => ({
    id: cells[0] || '',
    functionality: cells[1] || '',
    testScript: [cells[2] || '', ...cells.slice(3)].filter(Boolean).join(' | ')
  }));
}

export async function parseMarkdownHandler(req: Request, res: Response) {
  const { content } = req.body || {};
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid body: { content } string required' });
  }
  if (Buffer.byteLength(content, 'utf-8') > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'File too large' });
  }

  const text = content.replace(/\u0000/g, '');

  const requisitosSection = matchSection(text, 'Requisitos');
  const casosSection = matchSection(text, 'Casos de Teste');

  const reqRows = parseMarkdownTable(requisitosSection);
  const tcRows = parseMarkdownTable(casosSection);

  const requirements = mapRequirements(reqRows);
  const testCases = mapTestCases(tcRows);

  const warnings: any[] = [];

  // Duplicate ID detection (preserve-first)
  const seenReq = new Set<string>();
  requirements.forEach((r, idx) => {
    if (r.id && seenReq.has(r.id)) {
      warnings.push({ scope: 'requirements', row: idx + 1, type: 'duplicateId', message: `ID duplicado ${r.id}` });
    } else if (r.id) {
      seenReq.add(r.id);
    }
  });

  const seenTc = new Set<string>();
  testCases.forEach((t, idx) => {
    if (t.id && seenTc.has(t.id)) {
      warnings.push({ scope: 'testCases', row: idx + 1, type: 'duplicateId', message: `ID duplicado ${t.id}` });
    } else if (t.id) {
      seenTc.add(t.id);
    }
  });

  const out = {
    projectName: '',
    projectVersion: '',
    testResponsible: '',
    startDate: '',
    expectedDeliveryDate: '',
    planning: {},
    project: {
      requirements,
      testCases
    },
    execution: {},
    delivery: {},
    warnings
  };

  return res.json(out);
}

