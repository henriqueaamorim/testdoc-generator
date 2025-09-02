import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { v4 as uuidv4 } from "uuid";
import Ajv2020Default from "ajv/dist/2020.js";
import addFormatsDefault from "ajv-formats";
import { testDocSchema } from "../shared/schema.js";
import { parseMarkdownDocument } from "../parser/index.js";
import { exportToMarkdown } from "../exporters/md.js";

const app = express();
app.use(express.json({ limit: "6mb" }));

const allowedOrigin = process.env.FRONTEND_ORIGIN || undefined;
app.use(
	cors({
		origin: allowedOrigin || false,
		credentials: true,
	})
);
app.use(helmet());
app.use(
	rateLimit({
		windowMs: 60 * 1000,
		max: 60,
		standardHeaders: true,
		legacyHeaders: false,
	})
);

// Correlation-Id
app.use((req, res, next) => {
	const cid = (req.headers["x-correlation-id"] as string) || uuidv4();
	res.setHeader("x-correlation-id", cid);
	next();
});

// Idempotency-Key passthrough (no store in MVP)
app.use((req, res, next) => {
	const key = req.headers["idempotency-key"] as string | undefined;
	if (key) res.setHeader("idempotency-key", key);
	next();
});

const Ajv = Ajv2020Default as unknown as { new (opts?: any): any };
const addFormats = addFormatsDefault as unknown as (ajv: any) => any;
const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
addFormats(ajv);
const schemaForAjv: any = { ...testDocSchema };
if (schemaForAjv.$schema) delete schemaForAjv.$schema;
const validateDoc = ajv.compile(schemaForAjv);

app.get("/v1/health", (_req, res) => {
	res.status(200).json({ status: "ok" });
});

app.post("/v1/parse/markdown", (req, res) => {
	const { content, options } = req.body || {};
	if (typeof content !== "string") return res.status(400).json({ error: "content must be string" });
	if (Buffer.byteLength(content, "utf8") > 5 * 1024 * 1024) return res.status(413).json({ error: "file too large" });
	try {
		const doc = parseMarkdownDocument(content, options);
		return res.status(200).json(doc);
	} catch (e: any) {
		return res.status(422).json({ error: "parse error", details: e?.message });
	}
});

app.post("/v1/validate", (req, res) => {
	const document = req.body?.document ?? req.body;
	const ok = validateDoc(document);
	if (!ok) {
		return res.status(200).json({ ok: false, errors: validateDoc.errors ?? [], warnings: [] });
	}
	return res.status(200).json({ ok: true, errors: [], warnings: [] });
});

app.post("/v1/export", (req, res) => {
	const { document, format } = req.body || {};
	if (!["md", "pdf", "docx"].includes(format)) return res.status(415).json({ error: "unsupported format" });
	const ok = validateDoc(document);
	if (!ok) return res.status(400).json({ error: "invalid document", details: validateDoc.errors });
	const nameSafe = `${document.projectName}_v${document.projectVersion}_${new Date().toISOString().slice(0, 10)}`.replace(/\s+/g, "_");
	if (format === "md") {
		const md = exportToMarkdown(document);
		const data = Buffer.from(md, "utf8").toString("base64");
		return res.status(200).json({ filename: `${nameSafe}.md`, mime: "text/markdown", data });
	}
	// Stubs for pdf/docx to be implemented with puppeteer/docx
	if (format === "pdf") {
		return res.status(415).json({ error: "pdf export not configured in this environment" });
	}
	if (format === "docx") {
		return res.status(415).json({ error: "docx export not configured in this environment" });
	}
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
app.listen(port, () => {
	console.log(`Server listening on :${port}`);
});