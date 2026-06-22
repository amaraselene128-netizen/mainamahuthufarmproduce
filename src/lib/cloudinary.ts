// Browser-only unsigned Cloudinary uploader.
// Uses the `egrotasks` unsigned upload preset configured on the `dpboreqsc` cloud.
// Never expose the API secret in the frontend — unsigned presets do not need it.

const CLOUD_NAME =
  (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME ?? "dpboreqsc";
const UPLOAD_PRESET =
  (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET ?? "egrotasks";

export type CloudinaryUpload = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
};

export async function uploadToCloudinary(
  file: File,
  opts: { folder?: string } = {},
): Promise<CloudinaryUpload> {
  if (!file) throw new Error("No file provided");
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("File too large (max 20MB)");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  if (opts.folder) form.append("folder", opts.folder);

  const resourceType = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("image/")
      ? "image"
      : "auto";

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: form },
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as CloudinaryUpload;
}

export async function uploadManyToCloudinary(
  files: File[],
  opts: { folder?: string } = {},
): Promise<CloudinaryUpload[]> {
  return Promise.all(files.map((f) => uploadToCloudinary(f, opts)));
}
