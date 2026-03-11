import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import path from "path";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import dbConnect from "@/lib/db";
import User from "@/models/User";

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
  try {
    await dbConnect();

    const token = req.cookies.get("token")?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch {
      return NextResponse.json({ message: "Invalid session" }, { status: 401 });
    }

    const user = await User.findById(payload?.id).select("_id profileImage");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const previousImage = formData.get("previousImage");

    if (!file || typeof file === "string") {
      return NextResponse.json({ message: "Image file is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, or WEBP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Image size must be 2MB or less" },
        { status: 400 }
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

    return NextResponse.json(
      { imageUrl: nextImageUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("PROFILE IMAGE UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
