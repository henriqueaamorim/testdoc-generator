import { Request, Response } from 'express';
import { buildMarkdownFromDocument } from './markdownBuilder';

export async function exportHandler(req: Request, res: Response) {
  const { document, format } = req.body || {};
  if (!document || typeof document !== 'object') {
    return res.status(400).json({ error: 'Invalid body: { document } required' });
  }
  if (!['md', 'pdf', 'docx'].includes(format)) {
    return res.status(415).json({ error: 'Unsupported format' });
  }

  if (format === 'md') {
    const md = buildMarkdownFromDocument(document);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.send(md);
  }
  if (format === 'pdf') {
    const md = buildMarkdownFromDocument(document);
    // Placeholder: return base64 of markdown (replace later with real PDF)
    res.setHeader('Content-Type', 'application/pdf');
    const content = Buffer.from(md, 'utf-8').toString('base64');
    return res.json({ data: content, encoding: 'base64' });
  }
  if (format === 'docx') {
    const md = buildMarkdownFromDocument(document);
    // Placeholder: return base64 of markdown (replace later with real DOCX)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    const content = Buffer.from(md, 'utf-8').toString('base64');
    return res.json({ data: content, encoding: 'base64' });
  }
}

