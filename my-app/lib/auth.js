import { cookies } from "next/headers";
import { verifyAccessToken } from "./auth/jwt";

export function resolveRedirectPath(userType) {
  if (userType === "Seller") return "/seller/dashboard";
  if (userType === "Financier") return "/financier/dashboard";
  return "/buyer/dashboard";
}

export async function getAuthUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value || cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const session = await verifyAccessToken(token);
    const userId = session?.userId;
    if (!userId) return null;

    const dbConnect = (await import("./db")).default;
    const User = (await import("@/models/User")).default;
    await dbConnect();
    const user = await User.findById(userId);
    if (user) {
      user.effectiveCompanyId = session.tenantId || user.companyId || user._id;
    }
    return user;
  } catch (err) {
    console.error("Auth Cookie Verify Error:", err);
    return null;
  }
}

/**
 * Shared clearance logic.
 */
export async function logoutUser(user) {
  const cookieStore = await cookies();
  if (user && user.refreshToken) {
    try {
      const { delToken } = await import("./redis");
      await delToken(`rt:${user.refreshToken.slice(-10)}`);
    } catch (e) {
      console.warn("Failed to delete RT from redis", e);
    }
    user.refreshToken = null;
    await user.save();
  }
  cookieStore.delete("token");
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}