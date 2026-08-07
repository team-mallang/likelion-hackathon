import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@project/db";

const PASSWORD_SALT_ROUNDS = 12;
const PRE_CONFIRMATION_STATUSES = new Set(["DRAFT", "USER_REVIEW"]);

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

export async function createDraftCaseToken(caseId: string) {
  return new SignJWT({
    caseId,
    tokenType: "draft",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("1h")
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

export async function verifyDraftCaseToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  if (
    payload.tokenType !== "draft" ||
    typeof payload.caseId !== "string"
  ) {
    throw new Error("Invalid draft case token.");
  }

  return {
    caseId: payload.caseId,
  };
}

async function verifyCaseRequestToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  if (
    typeof payload.caseId !== "string" ||
    (payload.tokenType !== "draft" &&
      payload.tokenType !== "case-access")
  ) {
    throw new Error("Invalid case token.");
  }

  const tokenType: "draft" | "case-access" = payload.tokenType;

  return {
    caseId: payload.caseId,
    tokenType,
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

type CaseAccessResult =
  | {
      ok: true;
      caseId: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      error:
        | "AUTHENTICATION_REQUIRED"
        | "INVALID_ACCESS_TOKEN"
        | "FORBIDDEN";
    };

type DraftCaseAccessResult =
  | {
      ok: true;
      caseId: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      error:
        | "AUTHENTICATION_REQUIRED"
        | "INVALID_DRAFT_TOKEN"
        | "FORBIDDEN"
        | "CASE_NOT_FOUND";
    };

type CaseMutationAccessResult =
  | {
      ok: true;
      caseId: string;
      tokenType: "draft" | "case-access";
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      error:
        | "AUTHENTICATION_REQUIRED"
        | "INVALID_ACCESS_TOKEN"
        | "FORBIDDEN"
        | "CASE_NOT_FOUND";
    };

export async function authorizeCaseRequest(
  request: Request,
  requestedCaseId: string,
): Promise<CaseAccessResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "AUTHENTICATION_REQUIRED",
    };
  }

  try {
    const tokenPayload = await verifyCaseAccessToken(token);

    if (tokenPayload.caseId !== requestedCaseId) {
      return {
        ok: false,
        status: 403,
        error: "FORBIDDEN",
      };
    }

    return {
      ok: true,
      caseId: tokenPayload.caseId,
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error: "INVALID_ACCESS_TOKEN",
    };
  }
}

export async function authorizeDraftCaseRequest(
  request: Request,
  requestedCaseId: string,
): Promise<DraftCaseAccessResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "AUTHENTICATION_REQUIRED",
    };
  }

  let tokenPayload: { caseId: string };

  try {
    tokenPayload = await verifyDraftCaseToken(token);
  } catch {
    return {
      ok: false,
      status: 401,
      error: "INVALID_DRAFT_TOKEN",
    };
  }

  if (tokenPayload.caseId !== requestedCaseId) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  const foundCase = await prisma.case.findUnique({
    where: { id: requestedCaseId },
    select: {
      status: true,
      caseNumber: true,
      passwordHash: true,
    },
  });

  if (!foundCase) {
    return { ok: false, status: 404, error: "CASE_NOT_FOUND" };
  }

  if (
    !PRE_CONFIRMATION_STATUSES.has(foundCase.status) ||
    foundCase.caseNumber !== null ||
    foundCase.passwordHash !== null
  ) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  return { ok: true, caseId: tokenPayload.caseId };
}

export async function authorizeCaseMutationRequest(
  request: Request,
  requestedCaseId: string,
): Promise<CaseMutationAccessResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "AUTHENTICATION_REQUIRED",
    };
  }

  let tokenPayload: {
    caseId: string;
    tokenType: "draft" | "case-access";
  };

  try {
    tokenPayload = await verifyCaseRequestToken(token);
  } catch {
    return {
      ok: false,
      status: 401,
      error: "INVALID_ACCESS_TOKEN",
    };
  }

  if (tokenPayload.caseId !== requestedCaseId) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  const foundCase = await prisma.case.findUnique({
    where: { id: requestedCaseId },
    select: {
      status: true,
      caseNumber: true,
      passwordHash: true,
    },
  });

  if (!foundCase) {
    return { ok: false, status: 404, error: "CASE_NOT_FOUND" };
  }

  const isPreConfirmation =
    PRE_CONFIRMATION_STATUSES.has(foundCase.status) &&
    foundCase.caseNumber === null &&
    foundCase.passwordHash === null;
  const expectedTokenType = isPreConfirmation
    ? "draft"
    : "case-access";

  if (tokenPayload.tokenType !== expectedTokenType) {
    return { ok: false, status: 403, error: "FORBIDDEN" };
  }

  return {
    ok: true,
    caseId: tokenPayload.caseId,
    tokenType: tokenPayload.tokenType,
  };
}
