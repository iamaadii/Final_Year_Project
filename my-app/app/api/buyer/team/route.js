import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth, parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";
import bcrypt from "bcryptjs";

const ROLE_HIERARCHY = {
  "super_admin": 100,
  "company_admin": 80,
  "ap_manager": 60,
  "ap_clerk": 40,
  "view_only": 20
};

const CreateTeamMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["company_admin", "ap_manager", "ap_clerk", "view_only"]),
  designation: z.string().optional(),
});

export async function POST(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  
  const creator = auth.user;
  const creatorLevel = ROLE_HIERARCHY[creator.role] || 0;

  if (creatorLevel < ROLE_HIERARCHY.ap_manager) {
    return errorResponse("FORBIDDEN", "Insufficient permissions to invite team members", 403, auth.requestId);
  }

  const parsed = await parseBody(req, CreateTeamMemberSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  const { name, email, role, designation } = parsed.data;

  // RBAC Check: Cannot create a role higher than or equal to your own (unless super_admin)
  if (creator.role !== "super_admin" && ROLE_HIERARCHY[role] >= creatorLevel) {
    return errorResponse("FORBIDDEN", `You cannot invite a user with the role ${role}`, 403, auth.requestId);
  }

  try {
    await dbConnect();
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return errorResponse("CONFLICT", "User with this email already exists", 409, auth.requestId);
    }

    // Create new user linked to company
    // Default password for now (needs actual invite flow in production)
    const hashedPassword = await bcrypt.hash("Nexus3@Default", 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      userType: "Buyer",
      role,
      companyId: creator.companyId,
      companyName: creator.companyName,
      designation: designation || "Team Member",
      hasCompletedOnboarding: true,
      isVerified: true,
      status: "Active"
    });

    return successResponse({
      message: "Team member invited successfully",
      member: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    }, 201, auth.requestId);

  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
