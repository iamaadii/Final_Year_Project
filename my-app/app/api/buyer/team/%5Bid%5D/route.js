import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAuth, parseBody, successResponse, errorResponse } from "@/lib/api/routeUtils";

const ROLE_HIERARCHY = {
  "super_admin": 100,
  "company_admin": 80,
  "ap_manager": 60,
  "ap_clerk": 40,
  "view_only": 20
};

const UpdateTeamMemberSchema = z.object({
  role: z.enum(["company_admin", "ap_manager", "ap_clerk", "view_only"]).optional(),
  status: z.enum(["Active", "Suspended"]).optional(),
  name: z.string().optional(),
  designation: z.string().optional(),
});

export async function PATCH(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  
  const { id } = await params;
  const creator = auth.user;
  const creatorLevel = ROLE_HIERARCHY[creator.role] || 0;

  try {
    await dbConnect();
    const target = await User.findById(id);
    if (!target) return errorResponse("NOT_FOUND", "Team member not found", 404, auth.requestId);

    if (String(target.companyId) !== String(auth.companyId)) {
      return errorResponse("FORBIDDEN", "Unauthorized access to team member", 403, auth.requestId);
    }

    // RBAC Check: Manager can only edit those BELOW them.
    const targetLevel = ROLE_HIERARCHY[target.role] || 0;
    if (creator.role !== "super_admin" && targetLevel >= creatorLevel) {
       return errorResponse("FORBIDDEN", "You cannot edit a user with a role equal to or higher than yours", 403, auth.requestId);
    }

    const parsed = await parseBody(req, UpdateTeamMemberSchema, auth.requestId);
    if (!parsed.ok) return parsed.response;

    const update = parsed.data;

    // RBAC Check for role promotion: Cannot promote higher than yourself
    if (update.role && creator.role !== "super_admin" && ROLE_HIERARCHY[update.role] >= creatorLevel) {
      return errorResponse("FORBIDDEN", "You cannot promote a user to a level equal to or higher than yours", 403, auth.requestId);
    }

    Object.assign(target, update);
    await target.save();

    return successResponse({
      message: "Team member updated successfully",
      member: {
        id: target._id,
        name: target.name,
        role: target.role,
        status: target.status
      }
    }, 200, auth.requestId);

  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  
  const { id } = await params;
  const creator = auth.user;
  const creatorLevel = ROLE_HIERARCHY[creator.role] || 0;

  try {
    await dbConnect();
    const target = await User.findById(id);
    if (!target) return errorResponse("NOT_FOUND", "Team member not found", 404, auth.requestId);

    if (String(target.companyId) !== String(auth.companyId)) {
      return errorResponse("FORBIDDEN", "Unauthorized access", 403, auth.requestId);
    }

    const targetLevel = ROLE_HIERARCHY[target.role] || 0;
    if (creator.role !== "super_admin" && targetLevel >= creatorLevel) {
       return errorResponse("FORBIDDEN", "You cannot delete a user with a role equal to or higher than yours", 403, auth.requestId);
    }

    // Instead of deleting, we archive by updating status and companyId link (keeping trace)
    // Or just delete if user prefers. 
    // Here we'll do a soft-delete/deactivate for security
    target.status = "Deleted";
    target.companyId = null; // Unlink from company
    await target.save();

    return successResponse({ message: "Team member removed successfully" }, 200, auth.requestId);
  } catch (err) {
    return errorResponse("SERVER_ERROR", err.message, 500, auth.requestId);
  }
}
