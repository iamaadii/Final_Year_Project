import AuditLog from "@/models/AuditLog";

/**
 * Logs a system or user action for auditing.
 * @param {object} params
 * @param {string} params.userId - User performing the action
 * @param {string} params.userName - Name of the user
 * @param {string} params.companyId - Company ID for isolation
 * @param {string} params.action - Action name (e.g. "invoice_approval")
 * @param {string} params.resource - Resource type ("Invoice", "Auth", etc)
 * @param {string} [params.resourceId] - ID of the resource
 * @param {object} [params.details] - Metadata/diff
 * @param {string} [params.status="success"] - "success" or "failure"
 * @param {object} [params.req] - NextRequest object to extract IP/UA
 */
export async function logAudit({ userId, userName, companyId, action, resource, resourceId, details, status = "success", req }) {
  try {
    let ip = "unknown";
    let userAgent = "unknown";

    if (req) {
      ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
      userAgent = req.headers.get("user-agent") || "unknown";
    }

    await AuditLog.create({
      userId,
      userName,
      companyId,
      action,
      resource,
      resourceId,
      details,
      status,
      ip,
      userAgent,
      timestamp: new Date()
    });
  } catch (err) {
    console.error("Critical Failure: Audit logging failed:", err.message);
    // In a production environment, you might want to send this to an external logger like CloudWatch/Sentry
  }
}
