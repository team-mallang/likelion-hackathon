import { NextResponse } from "next/server";

import { DocumentInspectionError, getOpenAIModel, inspectDocumentImage, isOpenAIConfigured } from "@project/ai";
import { documentInspectionSuccessResponseSchema } from "@project/shared";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const TIMEOUT_MS = 30_000;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File)) return NextResponse.json({ success: false, error: "IMAGE_REQUIRED" }, { status: 400 });
    if (!ALLOWED_MIME_TYPES.has(image.type)) return NextResponse.json({ success: false, error: "UNSUPPORTED_IMAGE_TYPE" }, { status: 415 });
    if (image.size === 0) return NextResponse.json({ success: false, error: "EMPTY_IMAGE" }, { status: 400 });
    if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ success: false, error: "IMAGE_TOO_LARGE" }, { status: 413 });
    if (!isOpenAIConfigured()) return NextResponse.json({ success: false, error: "OPENAI_NOT_CONFIGURED" }, { status: 503 });
    const bytes = new Uint8Array(await image.arrayBuffer());
    const inspection = await Promise.race([
      inspectDocumentImage({ mimeType: image.type, bytes }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new DocumentInspectionError()), TIMEOUT_MS)),
    ]);
    return NextResponse.json(documentInspectionSuccessResponseSchema.parse({
      success: true, data: inspection,
      meta: { provider: "openai", model: getOpenAIModel(), fallback: false },
    }));
  } catch (error) {
    if (error instanceof DocumentInspectionError) return NextResponse.json({ success: false, error: "DOCUMENT_INSPECTION_FAILED" }, { status: 502 });
    return NextResponse.json({ success: false, error: "INVALID_MULTIPART_REQUEST" }, { status: 400 });
  }
}
