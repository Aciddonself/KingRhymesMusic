import { randomUUID } from "node:crypto";
import path from "node:path";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type MediaKind = "audio" | "preview" | "cover" | "image" | "hero";

const publicBucket = process.env.SUPABASE_PUBLIC_BUCKET || "kingrhymes-media";
const privateBucket = process.env.SUPABASE_PRIVATE_BUCKET || "kingrhymes-audio";
const folders: Record<MediaKind, string> = {
  audio: "audio",
  preview: "previews",
  cover: "covers",
  image: "gallery",
  hero: "hero",
};

let bucketSetup: Promise<void> | undefined;

async function ensureBuckets() {
  bucketSetup ??= (async () => {
    const storage = createSupabaseAdmin().storage;
    const { data, error } = await storage.listBuckets();
    if (error) throw new Error(`Could not list Supabase Storage buckets: ${error.message}`);

    const buckets = [
      { name: publicBucket, isPublic: true },
      { name: privateBucket, isPublic: false },
    ];
    for (const bucket of buckets) {
      const existing = data.find((item) => item.name === bucket.name);
      if (existing) {
        if (existing.public !== bucket.isPublic) {
          throw new Error(`Supabase Storage bucket "${bucket.name}" must be ${bucket.isPublic ? "public" : "private"}`);
        }
        continue;
      }

      const { error: createError } = await storage.createBucket(bucket.name, {
        public: bucket.isPublic,
      });
      if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw new Error(`Could not create Supabase Storage bucket "${bucket.name}": ${createError.message}`);
      }
    }
  })();

  return bucketSetup;
}

export async function storeMedia(kind: MediaKind, originalName: string, contentType: string, bytes: Uint8Array) {
  const extension = path.extname(originalName).toLowerCase();
  if (!/^\.[a-z0-9]{2,5}$/.test(extension)) throw new Error("Unsupported file extension");

  const isPrivate = kind === "audio";
  const bucket = isPrivate ? privateBucket : publicBucket;
  const key = `${folders[kind]}/${Date.now()}-${randomUUID()}${extension}`;
  await ensureBuckets();

  const { error } = await createSupabaseAdmin().storage.from(bucket).upload(key, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Could not upload to Supabase Storage: ${error.message}`);

  if (isPrivate) return `supabase-audio://${key}`;
  const { data } = createSupabaseAdmin().storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

export async function getPrivateMediaUrl(storedPath: string, expiresIn = 300, disposition = "attachment") {
  if (!storedPath.startsWith("supabase-audio://")) return null;
  const key = storedPath.slice("supabase-audio://".length);
  if (!key || key.split("/").some((part) => part === "..")) throw new Error("Invalid private media key");

  await ensureBuckets();
  const { data, error } = await createSupabaseAdmin()
    .storage.from(privateBucket)
    .createSignedUrl(key, expiresIn, {
      download: disposition === "attachment" ? path.basename(key) : undefined,
    });
  if (error) throw new Error(`Could not sign the Supabase Storage download URL: ${error.message}`);
  return { url: data.signedUrl };
}
