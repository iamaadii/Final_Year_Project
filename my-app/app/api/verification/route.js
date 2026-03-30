import dbConnect from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";
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

function resolveRedirectPath(userType) {
  if (userType === "Seller") return "/seller/dashboard";
  if (userType === "Financier") return "/financier/dashboard";
  return "/buyer/dashboard";
}

const VerificationSchema = z.object({
  gstNumber: z.string().min(1),
  panNumber: z.string().min(1),
  contactNumber: z.string().min(1),
  udhyamNumber: z.string().optional(),
});

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const parsed = await parseBody(req, VerificationSchema, auth.requestId);
    if (!parsed.ok) return parsed.response;
    const { gstNumber, panNumber, contactNumber, udhyamNumber } = parsed.data;

    const sanitizedGst = normalizeGst(gstNumber);
    const sanitizedPan = normalizePan(panNumber);
    const sanitizedContact = normalizePhone(contactNumber);

    if (!isValidGst(sanitizedGst)) {
      return errorResponse("VALIDATION_ERROR", "Please enter a valid GST number", 400, auth.requestId);
    }

    if (!isValidPhone(sanitizedContact)) {
      return errorResponse("VALIDATION_ERROR", "Please enter a valid contact number", 400, auth.requestId);
    }
    if (!isValidPan(sanitizedPan)) {
      return errorResponse("VALIDATION_ERROR", "Please enter a valid PAN number (example: ABCDE1234F)", 400, auth.requestId);
    }

    const existingUser = await User.findById(auth.user._id);
    if (!existingUser) {
      return errorResponse("NOT_FOUND", "User not found", 404, auth.requestId);
    }

    const updates = {
      $set: {
        gstNumber: sanitizedGst,
        panNumber: sanitizedPan,
        contactNumber: sanitizedContact,
        isVerified: true,
      },
    };

    if (existingUser.userType === "Seller") {
      const sanitizedUdhyam = normalizeUdyam(udhyamNumber || "");
      if (!sanitizedUdhyam) {
        return errorResponse("VALIDATION_ERROR", "Udhyam number is required for sellers", 400, auth.requestId);
      }
      if (!isValidUdyam(sanitizedUdhyam)) {
        return errorResponse("VALIDATION_ERROR", "Please enter a valid Udyam number (example: UDYAM-MH-12-1234567)", 400, auth.requestId);
      }
      updates.$set.udhyamNumber = sanitizedUdhyam;
    } else {
      updates.$unset = { udhyamNumber: 1 };
    }

    await User.collection.updateOne({ _id: existingUser._id }, updates);
    const updatedUser = await User.findById(auth.user._id);

    await writeAudit({
      user: auth.user,
      companyId: auth.companyId,
      action: "user_verified",
      resource: "User",
      resourceId: auth.user._id,
      details: { userType: updatedUser?.userType },
      req,
    });

    return successResponse(
      {
        message: "Verification details saved successfully",
        redirectTo: resolveRedirectPath(updatedUser?.userType),
      },
      200,
      auth.requestId,
    );
  } catch (error) {
    console.error("VERIFICATION ERROR:", error);
    return errorResponse("SERVER_ERROR", "Server error", 500, req.headers.get("x-request-id"));
  }
}
