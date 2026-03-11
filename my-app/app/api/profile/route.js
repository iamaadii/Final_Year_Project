import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import path from "path";
import { readdir, unlink } from "fs/promises";
import dbConnect from "@/lib/db";
import User from "@/models/User";
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

async function deleteOldUpload(imageUrl) {
  const filePath = resolveUploadPath(imageUrl);
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("PROFILE IMAGE DELETE ERROR:", error);
    }
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

async function getUserFromToken(req) {
  const token = req.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (!payload?.id) return null;

    await dbConnect();
    const user = await User.findById(payload.id);
    return user || null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    name: user.name || "",
    email: user.email || "",
    userType: user.userType || "",
    gstNumber: user.gstNumber || "",
    panNumber: user.panNumber || "",
    udhyamNumber: user.userType === "Seller" ? (user.udhyamNumber || "") : "",
    contactNumber: user.contactNumber || "",
    profileImage: user.profileImage || "",
  });
}

export async function PUT(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, gstNumber, panNumber, udhyamNumber, contactNumber, profileImage } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }

    const sanitizedGst = normalizeGst(gstNumber || "");
    const sanitizedPan = normalizePan(panNumber || "");
    const sanitizedContact = normalizePhone(contactNumber || "");

    if (sanitizedGst && !isValidGst(sanitizedGst)) {
      return NextResponse.json({ message: "Please enter a valid GST number" }, { status: 400 });
    }

    if (sanitizedContact && !isValidPhone(sanitizedContact)) {
      return NextResponse.json({ message: "Please enter a valid contact number" }, { status: 400 });
    }
    if (sanitizedPan && !isValidPan(sanitizedPan)) {
      return NextResponse.json({ message: "Please enter a valid PAN number (example: ABCDE1234F)" }, { status: 400 });
    }

    const previousProfileImage = (user.profileImage || "").trim();
    const nextProfileImage = (profileImage || "").trim();

    user.name = name.trim();
    user.gstNumber = sanitizedGst;
    user.panNumber = sanitizedPan;
    const sanitizedUdyam = normalizeUdyam(udhyamNumber || "");

    if (user.userType === "Seller" && sanitizedUdyam && !isValidUdyam(sanitizedUdyam)) {
      return NextResponse.json(
        { message: "Please enter a valid Udyam number (example: UDYAM-MH-12-1234567)" },
        { status: 400 }
      );
    }

    user.udhyamNumber = user.userType === "Seller" ? sanitizedUdyam : undefined;
    user.contactNumber = sanitizedContact;
    user.profileImage = nextProfileImage;

    await user.save();
    if (previousProfileImage && previousProfileImage !== nextProfileImage) {
      await deleteOldUpload(previousProfileImage);
    }
    await cleanupUserProfileUploads(user._id, nextProfileImage);

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: {
        name: user.name || "",
        email: user.email || "",
        userType: user.userType || "",
        gstNumber: user.gstNumber || "",
        panNumber: user.panNumber || "",
        udhyamNumber: user.userType === "Seller" ? (user.udhyamNumber || "") : "",
        contactNumber: user.contactNumber || "",
        profileImage: user.profileImage || "",
      },
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
