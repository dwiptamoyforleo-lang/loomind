import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI(apiKey ? { apiKey } : {});
}

// Generate with fallback models and retry for high-availability
async function generateWithFallback(ai: GoogleGenAI, generateConfig: any) {
  const models = [
    GEMINI_MODEL,
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        ...generateConfig,
        model,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} encounter issue:`, err?.message || err);
      lastError = err;
      // Short backoff before next model
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastError;
}

// Helper to clean base64 data URL
function stripBase64Prefix(dataUrl: string): string {
  if (dataUrl.includes(';base64,')) {
    return dataUrl.split(';base64,')[1];
  }
  return dataUrl;
}

// Convert files into GenAI content parts
function buildGenAIParts(files: Array<{ name: string; type: string; data?: string; textContent?: string }>) {
  const parts: any[] = [];

  for (const file of files) {
    const mime = (file.type || '').toLowerCase();

    // If it's a PDF
    if (mime.includes('pdf')) {
      if (file.data) {
        const cleanData = stripBase64Prefix(file.data);
        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanData
          }
        });
        parts.push({
          text: `[File attached: ${file.name} (PDF format)]`
        });
      } else if (file.textContent) {
        parts.push({
          text: `--- DOCUMENT: ${file.name} ---\n${file.textContent}\n--- END DOCUMENT ---`
        });
      }
    }
    // If it's an image
    else if (mime.startsWith('image/')) {
      if (file.data) {
        const cleanData = stripBase64Prefix(file.data);
        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanData
          }
        });
        parts.push({
          text: `[Image attached: ${file.name}]`
        });
      }
    }
    // Plain text / Markdown / Code / JSON / CSV / Text
    else {
      let content = file.textContent;
      if (!content && file.data) {
        try {
          const raw = stripBase64Prefix(file.data);
          content = Buffer.from(raw, 'base64').toString('utf-8');
        } catch {
          content = `[Binary content from ${file.name}]`;
        }
      }
      parts.push({
        text: `--- DOCUMENT: ${file.name} (${file.type || 'text'}) ---\n${content || ''}\n--- END DOCUMENT: ${file.name} ---`
      });
    }
  }

  return parts;
}

// 1. Summarization endpoint
app.post('/api/summarize', async (req, res) => {
  try {
    const { files = [], preset = 'executive', customFocus = '' } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one file or text document to summarize.' });
    }

    const ai = getGeminiClient();
    const model = GEMINI_MODEL;

    const presetPrompts: Record<string, string> = {
      executive: 'Focus on high-level strategic takeaways, core business or research findings, financial/technical impact, and clear executive decision points.',
      deep_dive: 'Provide an exhaustive, structured analytical breakdown with all nuances, background context, methodology, detailed findings, caveats, and conclusions.',
      actionable: 'Extract concrete action items, next steps, responsibilities, numerical targets, deadlines, and practical recommendations.',
      eli5: 'Explain the core concepts, importance, and takeaways in ultra-clear, simple everyday language without dense jargon.',
      study_guide: 'Create an engaging study guide with Key Concepts & Definitions, Core Highlights, and 5 Critical Q&A Knowledge Check cards.'
    };

    const styleInstruction = presetPrompts[preset] || presetPrompts.executive;
    const focusInstruction = customFocus ? `\nUser's specific focus instructions: "${customFocus}". Prioritize this aspect.` : '';

    const promptText = `
You are an expert document intelligence and executive briefing analyst.
Analyze the attached document(s) thoroughly and create a high-quality, comprehensive summary report.

Style & Mode: ${styleInstruction}${focusInstruction}

Please output your analysis formatted strictly in standard JSON with the following structure:
{
  "title": "A concise, engaging title for the briefing",
  "executiveSummary": "A polished narrative summary paragraph explaining the core theme, context, and overall significance.",
  "keyTakeaways": [
    "Bullet point highlight 1",
    "Bullet point highlight 2",
    "Bullet point highlight 3",
    "Bullet point highlight 4",
    "Bullet point highlight 5"
  ],
  "keyMetrics": [
    { "label": "Metric or Date name", "value": "Number / Value / Milestone", "context": "Brief context explanation" }
  ],
  "actionItems": [
    "Concrete actionable recommendation or next step"
  ],
  "topicBreakdown": [
    { "topic": "Key Section or Theme", "summary": "Detailed 2-3 sentence breakdown of this specific topic." }
  ],
  "suggestedQuestions": [
    "Insightful question a user could ask next about this document",
    "Another thought-provoking question",
    "A practical inquiry about data or risks in this document"
  ]
}

Return ONLY valid raw JSON without any markdown formatting wrappers or code fence quotes if possible, or inside a clean json code block.
`;

    const fileParts = buildGenAIParts(files);
    const contents = [...fileParts, { text: promptText }];

    const response = await generateWithFallback(ai, {
      contents,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      // Clean possible markdown code fences
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse JSON response:', e, responseText);
      // Fallback response
      parsedData = {
        title: 'Document Summary',
        executiveSummary: responseText,
        keyTakeaways: ['Analysis completed. Refer to narrative overview.'],
        keyMetrics: [],
        actionItems: [],
        topicBreakdown: [],
        suggestedQuestions: ['What are the primary conclusions of this document?', 'What are the main risks mentioned?']
      };
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate document summary. Please verify your file format.'
    });
  }
});

// 2. Chat / Q&A endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], files = [], question = '' } = req.body;

    if (!question && messages.length === 0) {
      return res.status(400).json({ error: 'Question or message history is required.' });
    }

    const ai = getGeminiClient();
    const model = GEMINI_MODEL;

    // System instruction
    const systemInstruction = `
You are "Gemini Notebook", an elite document research partner and knowledge assistant.
You help users explore, question, debate, and analyze their uploaded documents (PDFs, reports, code, notes) or discuss any topic in general.

Guidelines:
1. When documents are attached:
   - Ground your answers in the documents provided.
   - Quote or cite specific sections, tables, figures, or page numbers when possible.
   - If the user asks something that is NOT mentioned in the documents, state politely that the document does not mention it, and then share helpful general knowledge or context if appropriate.
2. When answering general questions (unrelated to the documents):
   - Provide brilliant, thorough, insightful, and accurate responses.
3. Formatting:
   - Use clean Markdown with clear headings (###), bold emphasis, bullet points, and code blocks with syntax highlighting where relevant.
   - Keep answers easy to read and structured for quick executive review.
`;

    // Build contents array
    const contents: any[] = [];

    // Add file context first if files exist
    if (files.length > 0) {
      const fileParts = buildGenAIParts(files);
      contents.push({
        role: 'user',
        parts: [
          ...fileParts,
          { text: 'I have attached the above documents as research sources for our conversation. Please refer to them when I ask questions.' }
        ]
      });
      contents.push({
        role: 'model',
        parts: [
          { text: `I have thoroughly reviewed your ${files.length} attached document(s) (${files.map((f: any) => f.name).join(', ')}). I am ready to answer any questions, extract data, compare sections, or discuss any related topic!` }
        ]
      });
    }

    // Add conversation history
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // If there is an active new question not yet in history
    if (question) {
      contents.push({
        role: 'user',
        parts: [{ text: question }]
      });
    }

    const response = await generateWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });

    const reply = response.text || 'I analyzed your request, but could not produce a text response. Please try rephrasing.';

    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to complete question. Please try again.'
    });
  }
});

// 3. Preloaded sample documents
app.get('/api/sample-docs', (_req, res) => {
  const samples = [
    {
      id: 'sample-ai-quantum',
      name: 'Quantum-AI-NextGen-Computing-Report-2026.pdf',
      type: 'text/markdown',
      size: '28 KB',
      description: 'Breakthrough hybrid quantum-classical algorithms, error mitigation, and 2026 enterprise roadmap.',
      textContent: `# Global Quantum-Classical AI Architecture Whitepaper (2026 Revision)
**Author:** Dr. Aris Thorne & The Advanced Computation Consortium  
**Date:** September 2026  
**Document ID:** QC-AI-2026-v4.2

## Executive Overview
The convergence of Noisy Intermediate-Scale Quantum (NISQ+) hardware with 100-billion parameter transformer architectures has yielded the first provable quantum advantage in molecular simulation and combinatorial logistics. Across 14 global benchmark trials in Q2 2026, the Hybrid Quantum Variational Pipeline (HQVP) achieved an 84.7x speedup over state-of-the-art FP8 GPU clusters while cutting energy consumption by 62%.

## 1. Core Architectural Pillars
### 1.1 Qubit Topology & Coherence Times
- **Physical Coherence:** Average T1 relaxation times expanded to 410 microseconds using topological fluxonium superconductors.
- **Surface Code Scaling:** 128 logical qubits sustained an error rate below 10^-5 across sustained 4-hour test cycles.
- **Interconnect:** Cryogenic optical links enabled multi-chassis entanglement across 4 cryostats separated by 12 meters.

### 1.2 The Hybrid Quantum-Classical Feedback Loop
Modern workloads are partitioned using dynamic graph routing:
- **Classical Node (V100/H200 equivalents):** Handles token embedding, matrix multiplication, and gradient accumulation.
- **Quantum Processing Unit (QPU-X):** Offloads non-convex optimization, Hamiltonian state estimation, and complex graph partition problems.

## 2. Benchmark Findings & Numerical Data
| Benchmark Domain | Classical GPU Cluster Time | Hybrid QPU-GPU Pipeline Time | Speedup Factor | Energy Reduction |
| :--- | :--- | :--- | :--- | :--- |
| Catalyst Binding Energy (FeMoco) | 148.2 hours | 1.75 hours | 84.7x | -62.4% |
| Global Supply Chain Routing (10k nodes) | 42.1 hours | 0.81 hours | 52.0x | -48.1% |
| Synthetic Drug Molecule Folding | 310.5 hours | 4.12 hours | 75.3x | -71.8% |
| Financial Risk Portfolio Monte Carlo (10M paths) | 18.4 hours | 0.35 hours | 52.5x | -55.0% |

## 3. Critical Risks & Engineering Bottlenecks
1. **Cryogenic Thermal Drift:** 3 out of 100 benchmark runs encountered thermal fluctuation spikes exceeding 18mK, forcing automatic error-quench protocols.
2. **Software Toolchain Fragmentation:** Lack of standard intermediate representations between QASM 3.0 and PyTorch 3.x induces a 4% translation overhead.
3. **Supply Chain Scarcity:** High-purity Helium-3 and isotopically purified Silicon-28 substrates face prolonged lead times of 14 to 18 months.

## 4. Strategic Recommendations & Roadmap
- **Immediate (Q4 2026):** Standardize on the OpenQuantum Graph API to eliminate compilation overheads.
- **Mid-term (2027):** Deploy fault-tolerant logical memory layers to support real-time genomic sequencing.
- **Long-term (2028+):** Commercial rollout of desktop-sized optical quantum co-processors for enterprise edge nodes.`
    },
    {
      id: 'sample-fintech-q3',
      name: 'OmniVanguard-Q3-2026-Financial-Audit.txt',
      type: 'text/markdown',
      size: '19 KB',
      description: 'Revenue performance, operating margins, churn reduction, and ARR breakdown.',
      textContent: `# OmniVanguard Corporation - Q3 2026 Financial & Operating Audit
**Filing Date:** October 2026  
**Auditor:** Deloitte & Touche LLP (Independent Review)  
**Fiscal Period:** July 1, 2026 - September 30, 2026

## 1. Financial Performance Summary
- **Gross Revenue:** $482.4 Million (+28.4% YoY, beating guidance of $465.0M)
- **Net Annual Recurring Revenue (ARR):** $1.92 Billion (Crossed $1.9B milestone for first time)
- **GAAP Operating Income:** $94.6 Million (19.6% Operating Margin vs 14.1% in Q3 2025)
- **Free Cash Flow (FCF):** $112.8 Million (23.4% FCF margin)
- **Cash & Short-Term Marketable Securities:** $840.5 Million with zero long-term debt maturities until 2031.

## 2. Segment Revenue Breakdown
- **Enterprise Cloud Infrastructure:** $264.2 Million (54.8% of total revenue, +34% YoY)
- **AI Automation & Developer Suite:** $141.5 Million (29.3% of total revenue, +61% YoY - Fastest growing segment)
- **Legacy Advisory & Managed Support:** $76.7 Million (15.9% of total revenue, -12% YoY - Managed transition phase)

## 3. Customer & Cohort Metrics
- **Total Active Enterprise Clients (> $100k ARR):** 2,410 clients (Net additions: 185 in Q3)
- **Net Revenue Retention (NRR):** 124.5% across enterprise accounts.
- **Customer Churn Rate:** Decreased to record low of 0.42% monthly (down from 0.88% in Q3 2025), largely attributed to automated workflow lock-in.

## 4. Headcount & Operational Efficiency
- Full-time employees: 3,420 (down 4% YoY following targeted automation of Tier 1 client onboarding).
- Revenue per employee: $561,000 (up from $420,000 in 2024, demonstrating severe operating leverage).

## 5. Risk Factors & Forward Guidance
- **Foreign Exchange Exposure:** The strengthening US Dollar produced a $14.2M headwind on European sales.
- **Capital Expenditures:** Projected to increase by $45M in Q4 2026 to fund sovereign data center builds in Frankfurt and Tokyo.
- **Q4 2026 Revenue Guidance:** Reaffirmed at $510M - $525M.`
    },
    {
      id: 'sample-clean-energy',
      name: 'Global-Renewable-Grid-Transition-2030.pdf',
      type: 'text/markdown',
      size: '22 KB',
      description: 'Grid parity analysis, next-gen sodium-ion battery storage, and carbon offset policy.',
      textContent: `# Global Energy Council: 2030 Clean Grid Transition Blueprint
**Publisher:** International Renewable Energy Policy Group  
**Published:** August 2026

## Executive Summary
For the first time in recorded industrial history, the Levelized Cost of Energy (LCOE) for paired Solar PV + Sodium-Ion Storage ($0.024/kWh) has undercut unabated Combined Cycle Gas Turbines ($0.048/kWh) across 72% of global geographic markets. This report evaluates the 5-year capital reallocation required to prevent grid instability during peak baseload transitions.

## Key Statistical Findings
1. **Sodium-Ion Commercialization:** Sodium-ion cell production reached 450 GWh in mid-2026, delivering 92% round-trip efficiency at a 44% cost reduction compared to Lithium Iron Phosphate (LFP).
2. **Grid Curtailment Reductions:** Advanced regional DC interties between Scandinavia and Southern Europe reduced renewable curtailment losses from 18.2% to 3.1%.
3. **Hydrogen Co-Generation:** Surplus midday solar output produced 1.8 Million metric tons of green hydrogen for industrial steel fabrication in Northern Europe.

## Priority Action Matrix for Municipalities
- **Permitting Fast-Track:** Standardize interconnection approvals within 45 days (currently averaging 310 days).
- **Virtual Power Plant (VPP) Mandates:** Require residential bidirectional EV charging stations to participate in grid frequency stabilization.
- **Transmission Line Capacity:** Allocate $180 Billion in public-private bonds to deploy high-voltage direct current (HVDC) lines.`
    }
  ];

  res.json({ samples });
});

// Setup Vite in Dev or Static in Production
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
