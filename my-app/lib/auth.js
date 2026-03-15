import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;

export function resolveRedirectPath(userType) {
  if (userType === "Seller") return "/seller/dashboard";
  if (userType === "Financier") return "/financier/dashboard";
  return "/buyer/dashboard";
}

export async function getAuthUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !ACCESS_TOKEN_SECRET) return null;

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    const userId = typeof payload === "object" && payload?.id ? String(payload.id) : "";
    if (!userId) return null;

    const dbConnect = (await import("./db")).default;
    const User = (await import("@/models/User")).default;
    await dbConnect();
    return await User.findById(userId);
  } catch {
    return null;
  }
}

/**
 * Shared clearance logic.
 */
export async function logoutUser(user) {
  const cookieStore = await cookies();
  if (user && user.refreshToken) {
    const { delToken } = await import("./redis");
    await delToken(`rt:${user.refreshToken.slice(-10)}`);
    user.refreshToken = null;
    await user.save();
  }
  cookieStore.delete("token");
  cookieStore.delete("refreshToken");
}