import jwt from "jsonwebtoken";
import { setToken } from "./redis";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || (ACCESS_TOKEN_SECRET + "_refresh");
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days

// Dynamic require to bypass Turbopack build-time resolution issues
const getAuthenticator = () => {
  try {
    return require("otplib").authenticator;
  } catch {
    return null;
  }
};

const getQRCode = () => {
  try {
    return require("qrcode");
  } catch {
    return null;
  }
};

export function generateTokens(user) {
  const payload = { 
    id: user._id, 
    role: user.role, 
    companyId: user.companyId,
    userType: user.userType 
  };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY + "s" });
  return { accessToken, refreshToken };
}

export async function storeRefreshToken(user, token) {
  user.refreshToken = token;
  await user.save();
  const tokenKey = `rt:${token.slice(-10)}`;
  await setToken(tokenKey, String(user._id), REFRESH_TOKEN_EXPIRY);
}

export async function setupMFA(userEmail) {
  const authenticator = getAuthenticator();
  const QRCode = getQRCode();
  
  if (!authenticator || !QRCode) {
    throw new Error("MFA dependencies (otplib/qrcode) not found on host");
  }

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(userEmail, "FlowBridge", secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  return { secret, qrCodeUrl };
}

export function verifyMFA(token, secret) {
  const authenticator = getAuthenticator();
  if (!authenticator) throw new Error("otplib not found");
  return authenticator.check(token, secret);
}
