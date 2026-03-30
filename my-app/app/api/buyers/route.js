import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/routeUtils";

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can list buyers", 403, auth.requestId);
  }

  await dbConnect();

  const buyers = await User.find({ userType: "Buyer" })
    .select("_id name email")
    .sort({ name: 1 })
    .lean();

  return successResponse({ buyers }, 200, auth.requestId);
}
