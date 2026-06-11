import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import OpenAI, { toFile } from 'openai';
import type { GalleryDiagram } from './galleryData.js';
import type { TitleSuggestion } from './gallery.js';

const TITLE_MODEL = process.env.OPENAI_TITLE_MODEL ?? 'gpt-4o-mini';
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';

export type RedrawResult =
  | { status: 'not_configured'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ok'; imageUrl: string; message: string };

let client: OpenAI | null | undefined;

function getClient(): OpenAI | null {
  if (client !== undefined) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  client = apiKey ? new OpenAI({ apiKey }) : null;
  return client;
}

export function aiConfigured(): boolean {
  return getClient() !== null;
}

function diagramTextSummary(diagram: GalleryDiagram): string {
  if (diagram.nodes.length === 0) {
    return `Title: ${diagram.title}\nCategory: ${diagram.category}\nDescription: ${diagram.description}\nTags: ${diagram.tags.join(', ')}`;
  }
  const nodeLines = diagram.nodes.map((n) => `- ${n.label.replace(/\n/g, ' ')}`).join('\n');
  const edgeLines = diagram.edges.map((e) => `- ${e.from} -> ${e.to}`).join('\n');
  return `Title: ${diagram.title}\nCategory: ${diagram.category}\nComponents:\n${nodeLines}\nConnections:\n${edgeLines}`;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function shortCode(): string {
  return crypto.randomBytes(2).toString('hex');
}

/**
 * Suggests a title and filename for a diagram using an OpenAI vision model.
 * Returns null if no API key is configured or the call fails, so callers can
 * fall back to the heuristic suggestion.
 */
export async function suggestTitleWithAI(diagram: GalleryDiagram, imagePath: string | null): Promise<TitleSuggestion | null> {
  const openai = getClient();
  if (!openai) return null;

  const instructions =
    'You help label architecture diagrams stored in a design gallery. Diagrams are saved with filenames following the ' +
    'pattern "img_<4charcode>_<TitleInCamelCase>_<YYYYMMDD>_<4charcode>_<DescriptorInCamelCase>.png" (a ChatGPT-style export name). ' +
    `Use today's date ${dateStamp()} and the random codes ${shortCode()} and ${shortCode()} for the two code segments. ` +
    'Read the diagram and respond with strict JSON: {"suggestedTitle": string, "suggestedFilename": string, "rationale": string}. ' +
    'The title should be a short, human-readable description of what the diagram shows. The rationale should briefly explain why, ' +
    "citing specific elements you noticed in the diagram's content.";

  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: 'text', text: diagramTextSummary(diagram) }];
  if (imagePath && fs.existsSync(imagePath)) {
    const b64 = fs.readFileSync(imagePath).toString('base64');
    content.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } });
  }

  try {
    const response = await openai.chat.completions.create({
      model: TITLE_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content }
      ]
    });
    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.suggestedTitle !== 'string' || typeof parsed.suggestedFilename !== 'string') return null;
    return {
      suggestedTitle: parsed.suggestedTitle,
      suggestedFilename: parsed.suggestedFilename,
      rationale: typeof parsed.rationale === 'string' ? parsed.rationale : '',
      source: 'openai'
    };
  } catch (err) {
    console.error('suggestTitleWithAI failed', err);
    return null;
  }
}

/**
 * Redraws a diagram based on free-text instructions using an OpenAI image model.
 * Saves the result under outputDir and returns its public URL path.
 */
export async function redrawWithAI(
  diagram: GalleryDiagram,
  instructions: string,
  imagePath: string | null,
  outputDir: string,
  publicUrlPrefix: string
): Promise<RedrawResult> {
  const openai = getClient();
  if (!openai) {
    return {
      status: 'not_configured',
      message:
        'Image regeneration requires an OPENAI_API_KEY to be configured on the server. Set the environment variable and restart the server to enable this feature.'
    };
  }

  try {
    const prompt = `${diagramTextSummary(diagram)}\n\nRequested change: ${instructions}\n\nRedraw this as a clean architecture diagram with labeled boxes and arrows reflecting the requested change.`;
    let b64: string | undefined;

    if (imagePath && fs.existsSync(imagePath)) {
      const file = await toFile(fs.createReadStream(imagePath), path.basename(imagePath), { type: 'image/png' });
      const response = await openai.images.edit({ model: IMAGE_MODEL, image: file, prompt });
      b64 = response.data?.[0]?.b64_json;
    } else {
      const response = await openai.images.generate({ model: IMAGE_MODEL, prompt, size: '1536x1024' });
      b64 = response.data?.[0]?.b64_json;
    }

    if (!b64) return { status: 'error', message: 'The image model did not return image data.' };

    fs.mkdirSync(outputDir, { recursive: true });
    const filename = `${diagram.id}-${Date.now()}.png`;
    fs.writeFileSync(path.join(outputDir, filename), Buffer.from(b64, 'base64'));

    return { status: 'ok', imageUrl: `${publicUrlPrefix}/${filename}`, message: 'Redrawn diagram generated successfully.' };
  } catch (err) {
    console.error('redrawWithAI failed', err);
    return { status: 'error', message: err instanceof Error ? err.message : 'Image regeneration failed.' };
  }
}
