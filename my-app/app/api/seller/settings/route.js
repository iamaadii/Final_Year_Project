import { z } from "zod";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";
import { encryptBankAccountNumber } from "@/lib/bankAccountCrypto";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bankLogoSlugByName = {
  "airtel payments bank": "airp",
  "au small finance bank": "aubl",
  "au small finance bank limited": "aubl",
  "axis bank": "utib",
  "axis bank limited": "utib",
  "bank of baroda": "barb",
  "bandhan bank": "bdbl",
  "bandhan bank limited": "bdbl",
  "bank of india": "bkid",
  "central bank of india": "cbin",
  "city union bank": "ciub",
  "canara bank": "cnrb",
  "csb bank": "csbk",
  "catholic syrian bank": "csbk",
  "dcb bank": "dcbl",
  "dcb bank limited": "dcbl",
  "dhanalakshmi bank": "dlxb",
  "federal bank": "fdrl",
  "the federal bank": "fdrl",
  "federal bank limited": "fdrl",
  "hdfc bank": "hdfc",
  "hdfc bank limited": "hdfc",
  "idbi bank": "ibkl",
  "idbi bank limited": "ibkl",
  "icici bank": "icic",
  "icici bank limited": "icic",
  "idfc first bank": "idfb",
  "idfc first bank limited": "idfb",
  "indian bank": "idib",
  "indusind bank": "indb",
  "indusind bank limited": "indb",
  "indian overseas bank": "ioba",
  "jio payments bank": "jiop",
  "jammu and kashmir bank": "jaka",
  "jammu and kashmir bank limited": "jaka",
  "the jammu and kashmir bank": "jaka",
  "karnataka bank": "karb",
  "karnataka bank limited": "karb",
  "kotak mahindra bank": "kkbk",
  "kotak mahindra bank limited": "kkbk",
  "karur vysya bank": "kvbl",
  "karur vysya bank limited": "kvbl",
  "bank of maharashtra": "mahb",
  "nainital bank": "ntbl",
  "nainital bank limited": "ntbl",
  "paytm payments bank": "pytm",
  "paytm payments bank limited": "pytm",
  "punjab and sind bank": "psib",
  "punjab national bank": "punb",
  "rbl bank": "ratn",
  "rbl bank limited": "ratn",
  "south indian bank": "sibl",
  "the south indian bank": "sibl",
  "south indian bank limited": "sibl",
  "standard chartered bank": "scbl",
  "state bank of india": "sbin",
  "tamilnad mercantile bank": "tmbl",
  "tamilnad mercantile bank limited": "tmbl",
  "ujjivan small finance bank": "ujvn",
  "ujjivan small finance bank limited": "ujvn",
  "union bank of india": "ubin",
  "uco bank": "ucba",
  "yes bank": "yesb",
  "yes bank limited": "yesb",
};

const ifscBankFallbacks = {
  AIRP: "Airtel Payments Bank",
  AUBL: "AU Small Finance Bank",
  BARB: "Bank of Baroda",
  BDBL: "Bandhan Bank",
  BKID: "Bank of India",
  CBIN: "Central Bank of India",
  CIUB: "City Union Bank",
  CNRB: "Canara Bank",
  CSBK: "CSB Bank",
  DCBL: "DCB Bank",
  DLXB: "Dhanalakshmi Bank",
  FDRL: "Federal Bank",
  HDFC: "HDFC Bank",
  IBKL: "IDBI Bank",
  ICIC: "ICICI Bank",
  IDFB: "IDFC First Bank",
  IDIB: "Indian Bank",
  INDB: "IndusInd Bank",
  IOBA: "Indian Overseas Bank",
  JAKA: "Jammu and Kashmir Bank",
  JIOP: "Jio Payments Bank",
  KARB: "Karnataka Bank",
  KKBK: "Kotak Mahindra Bank",
  KVBL: "Karur Vysya Bank",
  MAHB: "Bank of Maharashtra",
  NTBL: "Nainital Bank",
  PSIB: "Punjab and Sind Bank",
  PUNB: "Punjab National Bank",
  PYTM: "Paytm Payments Bank",
  RATN: "RBL Bank",
  SBIN: "State Bank of India",
  SCBL: "Standard Chartered Bank",
  SIBL: "South Indian Bank",
  TMBL: "Tamilnad Mercantile Bank",
  UBIN: "Union Bank of India",
  UCBA: "UCO Bank",
  UJVN: "Ujjivan Small Finance Bank",
  UTIB: "Axis Bank",
  YESB: "Yes Bank",
};

function normalizeBankLookupName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bthe\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bankLogoSlugFromName(name) {
  const normalized = normalizeBankLookupName(name);
  return normalized ? bankLogoSlugByName[normalized] || "" : "";
}

function logoSrcFromBankName(name) {
  const slug = bankLogoSlugFromName(name);
  return slug ? `/bank_logos/${slug}.png` : "";
}

function logoFromBankName(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "BNK";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}${words[2]?.[0] || ""}`.toUpperCase();
}

function normalizeIfscCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function maskAccountNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "A/C ****0000";
  return `A/C ****${digits.slice(-4).padStart(4, "0")}`;
}

function extractAccountLast4FromMask(masked) {
  const digits = String(masked || "").replace(/\D/g, "");
  return digits ? digits.slice(-4).padStart(4, "0") : "";
}

function existingBankKey(row) {
  return [
    normalizeIfscCode(row?.ifscCode || ""),
    String(row?.accountNumberLast4 || extractAccountLast4FromMask(row?.account || "")),
    String(row?.accountHolderName || "").trim().toLowerCase(),
  ].join("|");
}

async function resolveIfscDetails(ifscCode) {
  const ifsc = normalizeIfscCode(ifscCode);
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    throw new Error(`Invalid IFSC code: ${ifsc}`);
  }

  const fallbackBankName = ifscBankFallbacks[ifsc.slice(0, 4)] || "";

  try {
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`, {
      cache: "no-store",
    });

    if (response.ok) {
      const payload = await response.json();
      return {
        ifscCode: ifsc,
        bankName: String(payload?.BANK || fallbackBankName || "").trim(),
        branchName: String(payload?.BRANCH || "").trim(),
        verificationProvider: "razorpay",
        verificationReferenceId: ifsc,
      };
    }

    if (response.status !== 404) {
      throw new Error(`IFSC lookup failed with status ${response.status}`);
    }
  } catch {
    if (fallbackBankName) {
      return {
        ifscCode: ifsc,
        bankName: fallbackBankName,
        branchName: "",
        verificationProvider: "manual",
        verificationReferenceId: "",
      };
    }

    throw new Error(`Invalid IFSC code: ${ifsc}`);
  }

  if (fallbackBankName) {
    return {
      ifscCode: ifsc,
      bankName: fallbackBankName,
      branchName: "",
      verificationProvider: "manual",
      verificationReferenceId: "",
    };
  }

  throw new Error(`Invalid IFSC code: ${ifsc}`);
}

async function sanitizeBankAccounts(raw, existingBankAccounts, userId) {
  const list = Array.isArray(raw) ? raw : [];
  const existingByKey = new Map(
    (Array.isArray(existingBankAccounts) ? existingBankAccounts : []).map((item) => [existingBankKey(item), item]),
  );
  const out = [];

  for (const item of list) {
    const accountHolderName = String(item?.accountHolderName || "").trim();
    const rawAccountNumber = String(item?.accountNumberPlain || "").replace(/\D/g, "");
    const maskedAccount = String(item?.account || "").trim();
    const ifscCode = normalizeIfscCode(item?.ifscCode || "");

    if (!accountHolderName || !ifscCode) {
      continue;
    }

    const accountNumberLast4 = rawAccountNumber
      ? rawAccountNumber.slice(-4).padStart(4, "0")
      : extractAccountLast4FromMask(maskedAccount);

    if (!accountNumberLast4) {
      continue;
    }

    const matchKey = [ifscCode, accountNumberLast4, accountHolderName.toLowerCase()].join("|");
    const existing = existingByKey.get(matchKey);
    const resolved = await resolveIfscDetails(ifscCode);
    const bankName = resolved.bankName || String(item?.bankName || item?.bank || existing?.bankName || existing?.bank || "").trim();
    const branchName = resolved.branchName || String(item?.branchName || existing?.branchName || "").trim();
    const status = String(item?.status || existing?.status || "Pending").trim() || "Pending";
    const account =
      rawAccountNumber ? maskAccountNumber(rawAccountNumber) : maskedAccount || String(existing?.account || "").trim() || "A/C ****0000";

    out.push({
      userId,
      bank: bankName,
      account,
      accountHolderName,
      accountNumberEncrypted: rawAccountNumber
        ? encryptBankAccountNumber(rawAccountNumber)
        : String(existing?.accountNumberEncrypted || ""),
      accountNumberLast4,
      ifscCode,
      bankName,
      branchName,
      isVerified: Boolean(existing?.isVerified || resolved.verificationProvider === "razorpay"),
      nameMatchStatus: String(existing?.nameMatchStatus || "unmatched"),
      verifiedAt: existing?.verifiedAt || null,
      verificationProvider: String(existing?.verificationProvider || resolved.verificationProvider || "manual"),
      verificationReferenceId: String(existing?.verificationReferenceId || resolved.verificationReferenceId || ""),
      status,
      logoText: String(item?.logoText || existing?.logoText || logoFromBankName(bankName)).trim() || logoFromBankName(bankName),
      logoSrc: String(item?.logoSrc || existing?.logoSrc || logoSrcFromBankName(bankName)).trim(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  }

  return out;
}

function sanitizeTeamMembers(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const emailSeen = new Set();
  const out = [];

  for (const item of list) {
    const email = String(item?.email || "").trim().toLowerCase();
    if (!email || emailSeen.has(email)) continue;

    const name = String(item?.name || "").trim();
    if (!name) continue;

    out.push({
      name,
      subtitle: String(item?.subtitle || "Team Member").trim(),
      email,
      role: String(item?.role || "View Only").trim(),
      status: String(item?.status || "Pending").trim(),
    });
    emailSeen.add(email);
  }

  return out;
}

function sanitizeGeneralSettings(rawGeneral, user) {
  const general = rawGeneral && typeof rawGeneral === "object" ? rawGeneral : {};

  const companyName = String(general.companyName || user.companyName || "").trim();
  const supportEmail = String(general.supportEmail || user.supportEmail || "").trim().toLowerCase();
  const reminderLeadDays = Number(general.reminderLeadDays || user?.settings?.reminderLeadDays || 5);
  const enableAutoReminders = Boolean(
    typeof general.enableAutoReminders === "boolean"
      ? general.enableAutoReminders
      : user?.settings?.enableAutoReminders ?? true,
  );
  const webhookEnabled = Boolean(
    typeof general.webhookEnabled === "boolean"
      ? general.webhookEnabled
      : user?.settings?.webhookEnabled ?? false,
  );
  const webhookUrl = String(general.webhookUrl || user?.settings?.webhookUrl || "").trim();

  return {
    companyName,
    supportEmail,
    settings: {
      reminderLeadDays: Number.isFinite(reminderLeadDays)
        ? Math.min(30, Math.max(1, Math.round(reminderLeadDays)))
        : 5,
      enableAutoReminders,
      webhookEnabled,
      webhookUrl,
      erpSyncInterval: String(user?.settings?.erpSyncInterval || "15m"),
    },
  };
}

const SettingsSchema = z.object({
  general: z.any().optional(),
  bankAccounts: z.any().optional(),
  teamMembers: z.any().optional(),
});

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can access settings data", 403, auth.requestId);
  }

  const bankAccounts = Array.isArray(user.bankAccounts) ? user.bankAccounts : [];
  const teamMembers = Array.isArray(user.teamMembers) ? user.teamMembers : [];
  const decrypted = typeof user.getDecryptedData === "function" ? user.getDecryptedData() : {};

  return successResponse({
    general: {
      companyName: String(user.companyName || ""),
      supportEmail: String(user.supportEmail || ""),
      reminderLeadDays: Number(user?.settings?.reminderLeadDays || 5),
      enableAutoReminders: Boolean(user?.settings?.enableAutoReminders ?? true),
      webhookEnabled: Boolean(user?.settings?.webhookEnabled ?? false),
      webhookUrl: String(user?.settings?.webhookUrl || ""),
      gstNumber: String(decrypted?.gstNumber || ""),
      panNumber: String(decrypted?.panNumber || ""),
      udhyamNumber: String(user.udhyamNumber || ""),
    },
    bankAccounts,
    teamMembers,
  }, 200, auth.requestId);
}

export async function PUT(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Seller") {
    return errorResponse("FORBIDDEN", "Only sellers can update settings data", 403, auth.requestId);
  }

  const parsed = await parseBody(req, SettingsSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const body = parsed.data;
    const general = sanitizeGeneralSettings(body?.general, user);
    const bankAccounts = await sanitizeBankAccounts(body?.bankAccounts, user.bankAccounts, user._id);
    const teamMembers = sanitizeTeamMembers(body?.teamMembers);

    user.companyName = general.companyName;
    user.supportEmail = general.supportEmail;
    user.settings = {
      ...(user.settings || {}),
      ...general.settings,
    };
    user.bankAccounts = bankAccounts;
    user.teamMembers = teamMembers;
    await user.save();

    const decrypted = typeof user.getDecryptedData === "function" ? user.getDecryptedData() : {};

    await writeAudit({
      user,
      companyId: auth.companyId,
      action: "seller_settings_updated",
      resource: "User",
      resourceId: user._id,
      details: { sections: Object.keys(body || {}) },
      req,
    });

    return successResponse({
      general: {
        companyName: String(user.companyName || ""),
        supportEmail: String(user.supportEmail || ""),
        reminderLeadDays: Number(user?.settings?.reminderLeadDays || 5),
        enableAutoReminders: Boolean(user?.settings?.enableAutoReminders ?? true),
        webhookEnabled: Boolean(user?.settings?.webhookEnabled ?? false),
        webhookUrl: String(user?.settings?.webhookUrl || ""),
        gstNumber: String(decrypted?.gstNumber || ""),
        panNumber: String(decrypted?.panNumber || ""),
        udhyamNumber: String(user.udhyamNumber || ""),
      },
      bankAccounts: user.bankAccounts || [],
      teamMembers: user.teamMembers || [],
    }, 200, auth.requestId);
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}
