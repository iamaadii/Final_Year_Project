import { jwtVerify, SignJWT } from "jose";

export type SessionClaims = {
  userId: string;
  tenantId: string;
  role: string;
  userType: string;
  tokenType: "access" | "refresh";
};

function requireSecret(secret: string, name: string) {
  if (!secret) {
    throw new Error(`${name} is required`);
  }
  return new TextEncoder().encode(secret);
}

async function signToken(payload: Omit<SessionClaims, "tokenType">, tokenType: "access" | "refresh") {
  const secretKey = tokenType === "access" 
    ? (process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "")
    : (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || "");
    
  const secret = requireSecret(secretKey, tokenType === "access" ? "ACCESS_TOKEN_SECRET" : "REFRESH_TOKEN_SECRET");

  const expiresIn = tokenType === "access" 
    ? (process.env.ACCESS_TOKEN_EXPIRES_IN || "15m") 
    : (process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");

  return new SignJWT({ ...payload, tokenType })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function signAccessToken(payload: Omit<SessionClaims, "tokenType">) {
  return signToken(payload, "access");
}

export async function signRefreshToken(payload: Omit<SessionClaims, "tokenType">) {
  return signToken(payload, "refresh");
}

async function verifyToken(token: string, tokenType: "access" | "refresh"): Promise<SessionClaims> {
  const secretKey = tokenType === "access" 
    ? (process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "")
    : (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || "");

  const secret = requireSecret(secretKey, tokenType === "access" ? "ACCESS_TOKEN_SECRET" : "REFRESH_TOKEN_SECRET");

  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  if (payload.tokenType !== tokenType) {
    throw new Error("Invalid token type");
  }

  return {
    userId: String(payload.userId || ""),
    tenantId: String(payload.tenantId || ""),
    role: String(payload.role || ""),
    userType: String(payload.userType || ""),
    tokenType,
  };
}

export async function verifyAccessToken(token: string) {
  return verifyToken(token, "access");
}

export async function verifyRefreshToken(token: string) {
  return verifyToken(token, "refresh");
}
