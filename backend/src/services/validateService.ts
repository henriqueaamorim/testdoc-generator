import { Request, Response } from 'express';
import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import documentSchema from '../schemas/document.schema.json';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(documentSchema, 'Document');
const validate = ajv.getSchema('Document')!;

export async function validateHandler(req: Request, res: Response) {
  const document = req.body?.document;
  if (!document || typeof document !== 'object') {
    return res.status(400).json({ error: 'Invalid body: { document } required' });
  }
  const ok = validate(document) as boolean;
  if (!ok) {
    return res.status(422).json({ ok: false, errors: validate.errors });
  }
  return res.json({ ok: true, errors: [], warnings: [] });
}

