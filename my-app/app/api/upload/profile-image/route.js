import crypto from "crypto";
import path from "path";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import User from "@/models/User";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOADS_URL_PREFIX = "/uploads/";
const UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");
const PROFILE_UPLOADS_DIR = path.resolve(UPLOADS_ROOT, "profiles");

function resolveUploadPath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;

  let cleanUrl = imageUrl.trim();
  if (!cleanUrl) return null;

  try {
    if (/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = new URL(cleanUrl).pathname || "";
    }
  } catch {
    return null;
  }

  cleanUrl = cleanUrl.split("?")[0].split("#")[0];
  if (!cleanUrl.startsWith(UPLOADS_URL_PREFIX)) return null;

  const relativePath = path.normalize(
    cleanUrl.slice(UPLOADS_URL_PREFIX.length).replace(/^[/\\]+/, "")
  );
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;

  const absolutePath = path.resolve(UPLOADS_ROOT, relativePath);
  if (absolutePath !== UPLOADS_ROOT && !absolutePath.startsWith(`${UPLOADS_ROOT}${path.sep}`)) return null;

  return absolutePath;
}

async function deleteUpload(imageUrl) {
  const filePath = resolveUploadPath(imageUrl);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("PROFILE IMAGE TEMP DELETE ERROR:", error);
    }
  }
}

async function cleanupUserProfileUploads(userId, keepFileName) {
  const userIdPrefix = `${String(userId)}-`;
  let entries = [];
  try {
    entries = await readdir(PROFILE_UPLOADS_DIR, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    console.warn("PROFILE IMAGE CLEANUP READ ERROR:", error);
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(userIdPrefix) && entry.name !== keepFileName)
      .map(async (entry) => {
        try {
          await unlink(path.join(PROFILE_UPLOADS_DIR, entry.name));
        } catch (error) {
          if (error?.code !== "ENOENT") {
            console.warn("PROFILE IMAGE CLEANUP DELETE ERROR:", error);
          }
        }
      })
  );
}

export async function POST(req) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const user = await User.findById(auth.user._id).select("_id profileImage");
    if (!user) {
      return errorResponse("NOT_FOUND", "User not found", 404, auth.requestId);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const previousImage = formData.get("previousImage");

    if (!file || typeof file === "string") {
      return errorResponse("VALIDATION_ERROR", "Image file is required", 400, auth.requestId);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Only JPG, PNG, or WEBP images are allowed",
        400,
        auth.requestId,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Image size must be 2MB or less",
        400,
        auth.requestId,
      );
    }

    const extension = EXT_BY_TYPE[file.type] || "jpg";
    const fileName = `${user._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const uploadDir = PROFILE_UPLOADS_DIR;
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // If user re-uploads before saving profile, remove the prior temporary file.
    if (
      previousImage &&
      typeof previousImage === "string" &&
      previousImage.trim() &&
      previousImage.trim() !== `/uploads/profiles/${fileName}` &&
      previousImage.trim() !== (user?.profileImage || "")
    ) {
      await deleteUpload(previousImage);
    }

    // Make newly uploaded image the current one immediately.
    const nextImageUrl = `/uploads/profiles/${fileName}`;
    user.profileImage = nextImageUrl;
    await user.save();
    await cleanupUserProfileUploads(user._id, fileName);

    return successResponse({ imageUrl: nextImageUrl }, 200, auth.requestId);
  } catch (error) {
    console.error("PROFILE IMAGE UPLOAD ERROR:", error);
    return errorResponse("SERVER_ERROR", "Server error", 500, requestId);
  }
}
