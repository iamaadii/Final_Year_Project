import { z } from "zod";
import { requireAuth, parseBody, successResponse, errorResponse, writeAudit } from "@/lib/api/routeUtils";
import { encryptBankAccountNumber } from "@/lib/bankAccountCrypto";

const SettingsSchema = z.object({
  general: z.any().optional(),
  bankAccounts: z.any().optional(),
  teamMembers: z.any().optional(),
  approvalRules: z.any().optional(),
  integrations: z.any().optional(),
  tallyConfig: z.any().optional(),
  privacy: z.any().optional(),
});

function normalizeIfscCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

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

function maskAccountNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "A/C ****0000";
  return `A/C ****${digits.slice(-4).padStart(4, "0")}`;
}

function extractAccountLast4FromMask(masked) {
  const digits = String(masked || "").replace(/\D/g, "");
  return digits ? digits.slice(-4).padStart(4, "0") : "";
}

function sanitizeGeneralSettings(rawGeneral, user) {
  const general = rawGeneral && typeof rawGeneral === "object" ? rawGeneral : {};

  const companyName = String(general.companyName || user.companyName || "").trim();
  const contactEmail = String(general.contactEmail || user.supportEmail || "").trim().toLowerCase();
  const billingAddress = String(general.billingAddress || user?.settings?.billingAddress || "").trim();
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
  const erpSyncInterval = ["5m", "15m", "1h"].includes(String(general.erpSyncInterval || ""))
    ? String(general.erpSyncInterval)
    : String(user?.settings?.erpSyncInterval || "15m");

  return {
    companyName,
    contactEmail,
    settings: {
      reminderLeadDays: Number.isFinite(reminderLeadDays)
        ? Math.min(30, Math.max(1, Math.round(reminderLeadDays)))
        : 5,
      enableAutoReminders,
      webhookEnabled,
      webhookUrl,
      erpSyncInterval,
      billingAddress,
    },
  };
}

function sanitizeBankAccounts(raw, existingBankAccounts, userId) {
  const list = Array.isArray(raw) ? raw : [];
  const existingList = Array.isArray(existingBankAccounts) ? existingBankAccounts : [];
  
  const existingByKey = new Map(
    existingList.map((item) => [
      [normalizeIfscCode(item?.ifscCode || ""), String(item?.accountNumberLast4 || extractAccountLast4FromMask(item?.account || ""))].join("|"),
      item,
    ]),
  );
  
  const out = [];

  for (const item of list) {
    const ifscCode = normalizeIfscCode(item?.ifscCode || "");
    if (!ifscCode) continue;

    const accountHolderName = String(item?.accountHolderName || "").trim();
    let rawAccountNumber = String(item?.accountNumberPlain || "").replace(/\D/g, "");
    let maskedAccount = String(item?.account || "").trim();
    
    if (!rawAccountNumber && maskedAccount && !maskedAccount.includes("*")) {
      rawAccountNumber = maskedAccount.replace(/\D/g, "");
      maskedAccount = "";
    }

    const accountNumberLast4 = rawAccountNumber
      ? rawAccountNumber.slice(-4).padStart(4, "0")
      : extractAccountLast4FromMask(maskedAccount);

    if (!accountNumberLast4) continue;

    const key = [ifscCode, accountNumberLast4].join("|");
    const existing = existingByKey.get(key);
    
    const resolvedBankName = String(item?.bankName || item?.bank || ifscBankFallbacks[ifscCode.slice(0, 4)] || existing?.bankName || existing?.bank || "Unknown Bank").trim();
    const resolvedAccountHolderName = accountHolderName || String(existing?.accountHolderName || "").trim();

    if (!resolvedBankName || !resolvedAccountHolderName) continue;

    out.push({
      userId,
      bank: resolvedBankName,
      bankName: resolvedBankName,
      account: rawAccountNumber ? maskAccountNumber(rawAccountNumber) : maskedAccount || String(existing?.account || ""),
      accountHolderName: resolvedAccountHolderName,
      accountNumberEncrypted: rawAccountNumber
        ? encryptBankAccountNumber(rawAccountNumber)
        : String(existing?.accountNumberEncrypted || ""),
      accountNumberLast4,
      ifscCode,
      branchName: String(item?.branchName || existing?.branchName || ""),
      isVerified: Boolean(existing?.isVerified || false),
      nameMatchStatus: String(existing?.nameMatchStatus || "unmatched"),
      verifiedAt: existing?.verifiedAt || null,
      verificationProvider: String(existing?.verificationProvider || "manual"),
      verificationReferenceId: String(existing?.verificationReferenceId || ""),
      status: String(item?.status || existing?.status || "Pending"),
      logoText: String(item?.logoText || existing?.logoText || "BNK"),
      logoSrc: String(item?.logoSrc || existing?.logoSrc || ""),
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
    const name = String(item?.name || "").trim();
    if (!email || !name || emailSeen.has(email)) continue;

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

function mapApprovalRules(rawRules) {
  const list = Array.isArray(rawRules) ? rawRules : [];
  return list
    .map((item) => ({
      id: String(item?.id || item?._id || ""),
      actionType: String(item?.actionType || "").trim(),
      threshold: Number(item?.threshold || 0),
      makerRole: String(item?.makerRole || "").trim(),
      checkerRole: String(item?.checkerRole || "").trim(),
    }))
    .filter((rule) => rule.id && rule.actionType);
}

function sanitizeTallyConfig(raw, user) {
  const input = raw && typeof raw === "object" ? raw : {};
  const host = String(input.host || user?.tallyConfig?.host || "").trim();
  const companyName = String(input.companyName || user?.tallyConfig?.companyName || "").trim();
  const portValue = Number(input.port ?? user?.tallyConfig?.port ?? 9000);
  const port = Number.isFinite(portValue)
    ? Math.min(65535, Math.max(1, Math.round(portValue)))
    : 9000;

  return { host, companyName, port };
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can access settings data", 403, auth.requestId);
  }

  const decrypted = typeof user.getDecryptedData === "function" ? user.getDecryptedData() : {};

  return successResponse({
    general: {
      companyName: String(user.companyName || ""),
      contactEmail: String(user.supportEmail || ""),
      billingAddress: String(user?.settings?.billingAddress || ""),
      reminderLeadDays: Number(user?.settings?.reminderLeadDays || 5),
      enableAutoReminders: Boolean(user?.settings?.enableAutoReminders ?? true),
      gstNumber: String(decrypted?.gstNumber || ""),
      panNumber: String(decrypted?.panNumber || ""),
      udhyamNumber: String(user.udhyamNumber || ""),
    },
    bankAccounts: Array.isArray(user.bankAccounts) ? user.bankAccounts : [],
    teamMembers: Array.isArray(user.teamMembers) ? user.teamMembers : [],
    approvalRules: mapApprovalRules(user?.settings?.approvalRules || []),
    integrations: {
      accounting: Boolean(user?.settings?.accounting ?? false),
      treasury: Boolean(user?.settings?.treasury ?? false),
      webhookEnabled: Boolean(user?.settings?.webhookEnabled ?? false),
      webhookUrl: String(user?.settings?.webhookUrl || ""),
      erpSyncInterval: String(user?.settings?.erpSyncInterval || "15m"),
    },
    tallyConfig: {
      host: String(user?.tallyConfig?.host || ""),
      companyName: String(user?.tallyConfig?.companyName || ""),
      port: Number(user?.tallyConfig?.port || 9000),
    },
    privacy: {
      whatsappOptIn: Boolean(user.whatsappOptIn),
      whatsappNumber: String(user.whatsappNumber || ""),
      dpdpConsentVersion: String(user.dpdpConsentVersion || "v1.0"),
      dpdpConsentTimestamp: user.dpdpConsentTimestamp ? new Date(user.dpdpConsentTimestamp).toISOString() : null,
      dataRetentionExpiresAt: user.dataRetentionExpiresAt ? new Date(user.dataRetentionExpiresAt).toISOString() : null,
      deletionRequestedAt: user.deletionRequestedAt ? new Date(user.deletionRequestedAt).toISOString() : null,
      deletionScheduledAt: user.deletionScheduledAt ? new Date(user.deletionScheduledAt).toISOString() : null,
    }
  }, 200, auth.requestId);
}

export async function PUT(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;
  if (user.userType !== "Buyer") {
    return errorResponse("FORBIDDEN", "Only buyers can update settings data", 403, auth.requestId);
  }

  const parsed = await parseBody(req, SettingsSchema, auth.requestId);
  if (!parsed.ok) return parsed.response;

  try {
    const body = parsed.data;

    const general = sanitizeGeneralSettings(body?.general, user);
    
    // Only update bankAccounts if provided and NOT empty (or if it's a specific bank update)
    let bankAccounts = user.bankAccounts;
    if (body?.bankAccounts !== undefined) {
      if (Array.isArray(body.bankAccounts) && (body.bankAccounts.length > 0 || body.general === undefined)) {
        bankAccounts = sanitizeBankAccounts(body.bankAccounts, user.bankAccounts, user._id);
      }
    }

    const teamMembers = body?.teamMembers !== undefined ? sanitizeTeamMembers(body?.teamMembers) : user.teamMembers;
    const approvalRules = body?.approvalRules !== undefined ? mapApprovalRules(body?.approvalRules) : (user?.settings?.approvalRules || []);
    const tallyConfig = body?.tallyConfig !== undefined ? sanitizeTallyConfig(body?.tallyConfig, user) : user.tallyConfig;

    user.companyName = general.companyName;
    user.supportEmail = general.contactEmail;
    user.bankAccounts = bankAccounts;
    user.teamMembers = teamMembers;
    user.whatsappOptIn = Boolean(body?.privacy?.whatsappOptIn ?? user.whatsappOptIn);
    user.whatsappNumber = String(body?.privacy?.whatsappNumber || user.whatsappNumber || "");
    user.settings = {
      ...(user.settings || {}),
      ...general.settings,
      approvalRules,
      accounting: Boolean(body?.integrations?.accounting ?? user?.settings?.accounting ?? false),
      treasury: Boolean(body?.integrations?.treasury ?? user?.settings?.treasury ?? false),
      webhookEnabled: Boolean(body?.integrations?.webhookEnabled ?? general.settings.webhookEnabled),
      webhookUrl: String(body?.integrations?.webhookUrl || general.settings.webhookUrl || "").trim(),
      lastSyncAt: user?.settings?.lastSyncAt || null,
    };
    user.tallyConfig = {
      ...(user.tallyConfig || {}),
      ...tallyConfig,
    };

    await user.save();

    const decrypted = typeof user.getDecryptedData === "function" ? user.getDecryptedData() : {};

    await writeAudit({
      user,
      companyId: auth.companyId,
      action: "buyer_settings_updated",
      resource: "User",
      resourceId: user._id,
      details: { sections: Object.keys(body || {}) },
      req,
    });

    return successResponse({
      general: {
        companyName: String(user.companyName || ""),
        contactEmail: String(user.supportEmail || ""),
        billingAddress: String(user?.settings?.billingAddress || ""),
        reminderLeadDays: Number(user?.settings?.reminderLeadDays || 5),
        enableAutoReminders: Boolean(user?.settings?.enableAutoReminders ?? true),
        gstNumber: String(decrypted?.gstNumber || ""),
        panNumber: String(decrypted?.panNumber || ""),
        udhyamNumber: String(user.udhyamNumber || ""),
      },
      bankAccounts: user.bankAccounts || [],
      teamMembers: user.teamMembers || [],
      approvalRules: mapApprovalRules(user?.settings?.approvalRules || []),
      integrations: {
        accounting: Boolean(user?.settings?.accounting ?? false),
        treasury: Boolean(user?.settings?.treasury ?? false),
        webhookEnabled: Boolean(user?.settings?.webhookEnabled ?? false),
        webhookUrl: String(user?.settings?.webhookUrl || ""),
        erpSyncInterval: String(user?.settings?.erpSyncInterval || "15m"),
      },
      tallyConfig: {
        host: String(user?.tallyConfig?.host || ""),
        companyName: String(user?.tallyConfig?.companyName || ""),
        port: Number(user?.tallyConfig?.port || 9000),
      },
    }, 200, auth.requestId);
  } catch (err) {
    console.error("Buyer Settings PUT Error:", err);
    return errorResponse("SERVER_ERROR", err.message || "Server error", 500, auth.requestId);
  }
}
