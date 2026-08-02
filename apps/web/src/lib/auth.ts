import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const PASSWORD_SALT_ROUNDS = 12;

function getAuthSecret() {
  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error("AUTH_SECRET environment variable is not configured.");
  }

  return new TextEncoder().encode(authSecret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return bcrypt.compare(password, passwordHash);
}

export async function createCaseAccessToken(caseId: string) {
  return new SignJWT({
    caseId,
    tokenType: "case-access",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(getAuthSecret());
}

export async function verifyCaseAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  if (
    payload.tokenType !== "case-access" ||
    typeof payload.caseId !== "string"
  ) {
    throw new Error("Invalid case access token.");
  }

  return {
    caseId: payload.caseId,
  };
}

export function getBearerToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  return token || null;
}
