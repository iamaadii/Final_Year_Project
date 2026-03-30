import path from "path";
import { readdir, unlink } from "fs/promises";
import { z } from "zod";
import User from "@/models/User";
import { getDecryptedUser } from "@/lib/apiAuth";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";
import {
  isValidGst,
  isValidPan,
  isValidPhone,
  isValidUdyam,
  normalizeGst,
  normalizePan,
  normalizePhone,
  normalizeUdyam,
} from "@/lib/validators";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UPLOADS_URL_PREFIX = "/uploads/";
const UPLOADS_ROOT = path.resolve(process.cwd(), "public", "uploads");
const PROFILE_UPLOADS_DIR = path.resolve(UPLOADS_ROOT, "profiles");

const ProfileSchema = z.object({
  name: z.string().min(1),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  udhyamNumber: z.string().optional(),
  contactNumber: z.string().optional(),
  profileImage: z.string().optional(),
});

function resolveUploadPath(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  let cleanUrl = imageUrl.trim();
  if (!cleanUrl) return null;
  try {
    if (/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = new URL(cleanUrl).pathname || "";
    }
  } catch { return null; }
  cleanUrl = cleanUrl.split("?")[0].split("#")[0];
  if (!cleanUrl.startsWith(UPLOADS_URL_PREFIX)) return null;
  const relativePath = path.normalize(cleanUrl.slice(UPLOADS_URL_PREFIX.length).replace(/^[/\\]+/, ""));
  if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;
  const absolutePath = path.resolve(UPLOADS_ROOT, relativePath);
  if (absolutePath !== UPLOADS_ROOT && !absolutePath.startsWith(`${UPLOADS_ROOT}${path.sep}`)) return null;
  return absolutePath;
}

async function deleteOldUpload(imageUrl) {
  const filePath = resolveUploadPath(imageUrl);
  if (!filePath) return;
  try { await unlink(filePath); } catch (error) {
    if (error?.code !== "ENOENT") console.warn("PROFILE IMAGE DELETE ERROR:", error);
  }
}

function resolveProfileFileName(imageUrl) {
  const filePath = resolveUploadPath(imageUrl);
  if (!filePath) return "";
  if (path.dirname(filePath) !== PROFILE_UPLOADS_DIR) return "";
  return path.basename(filePath);
}

async function cleanupUserProfileUploads(userId, keepImageUrl) {
  const userIdPrefix = `${String(userId)}-`;
  const keepFileName = resolveProfileFileName(keepImageUrl);
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
        try { await unlink(path.join(PROFILE_UPLOADS_DIR, entry.name)); } catch (error) {
          if (error?.code !== "ENOENT") console.warn("PROFILE IMAGE CLEANUP DELETE ERROR:", error);
        }
      })
  );
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const decrypted = getDecryptedUser(auth.user);
  return successResponse({
    name: decrypted.name || "",
    email: decrypted.email || "",
    userType: decrypted.userType || "",
    gstNumber: decrypted.gstNumber || "",
    panNumber: decrypted.panNumber || "",
    udhyamNumber: decrypted.userType === "Seller" ? (decrypted.udhyamNumber || "") : "",
    contactNumber: decrypted.contactNumber || "",
    profileImage: decrypted.profileImage || "",
    kycStatus: decrypted.kycStatus || "pending",
  }, 200, auth.requestId);
}

export async function PUT(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(req, ProfileSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;
  try {
    const { name, gstNumber, panNumber, udhyamNumber, contactNumber, profileImage } = parsed.data;
    
    const sanitizedGst = normalizeGst(gstNumber || "");
    const sanitizedPan = normalizePan(panNumber || "");
    const sanitizedContact = normalizePhone(contactNumber || "");

    if (sanitizedGst && !isValidGst(sanitizedGst)) return errorResponse("VALIDATION_ERROR", "Invalid GST", 400, auth.requestId);
    if (sanitizedContact && !isValidPhone(sanitizedContact)) return errorResponse("VALIDATION_ERROR", "Invalid Phone", 400, auth.requestId);
    if (sanitizedPan && !isValidPan(sanitizedPan)) return errorResponse("VALIDATION_ERROR", "Invalid PAN", 400, auth.requestId);

    const prevImg = (auth.user.profileImage || "").trim();
    const nextImg = (profileImage || "").trim();
    const sanitizedUdyam = normalizeUdyam(udhyamNumber || "");

    if (auth.user.userType === "Seller" && sanitizedUdyam && !isValidUdyam(sanitizedUdyam)) {
      return errorResponse("VALIDATION_ERROR", "Invalid Udyam", 400, auth.requestId);
    }

    const update = {
      name: name.trim(),
      gstNumber: sanitizedGst, // Will be encrypted by pre-save
      panNumber: sanitizedPan, // Will be encrypted by pre-save
      contactNumber: sanitizedContact,
      profileImage: nextImg,
      udhyamNumber: auth.user.userType === "Seller" ? sanitizedUdyam : "",
    };

    const savedUser = await User.findByIdAndUpdate(auth.user._id, { $set: update }, { new: true });
    if (prevImg && prevImg !== nextImg) await deleteOldUpload(prevImg);
    await cleanupUserProfileUploads(savedUser._id, nextImg);

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "profile_updated",
      resource: "User",
      resourceId: savedUser._id,
      details: { updatedFields: Object.keys(update) },
      req,
    });

    return successResponse({ profile: getDecryptedUser(savedUser) }, 200, auth.requestId);
  } catch (error) {
    const err = error && typeof error === "object" ? error : null;
    return errorResponse("SERVER_ERROR", err?.message || "Server error", 500, auth.requestId);
  }
}
