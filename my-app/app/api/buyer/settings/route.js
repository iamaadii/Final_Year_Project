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
  const existingByKey = new Map(
    (Array.isArray(existingBankAccounts) ? existingBankAccounts : []).map((item) => [
      [normalizeIfscCode(item?.ifscCode || ""), String(item?.accountNumberLast4 || extractAccountLast4FromMask(item?.account || ""))].join("|"),
      item,
    ]),
  );
  const out = [];

  for (const item of list) {
    const rawAccountNumber = String(item?.accountNumberPlain || "").replace(/\D/g, "");
    const accountMasked = String(item?.account || "").trim();
    const ifscCode = normalizeIfscCode(item?.ifscCode || "");
    const accountHolderName = String(item?.accountHolderName || "").trim();
    const bankName = String(item?.bankName || item?.bank || "").trim();

    if (!ifscCode || !accountHolderName || !bankName) continue;

    const accountNumberLast4 = rawAccountNumber
      ? rawAccountNumber.slice(-4).padStart(4, "0")
      : extractAccountLast4FromMask(accountMasked);
    if (!accountNumberLast4) continue;

    const key = [ifscCode, accountNumberLast4].join("|");
    const existing = existingByKey.get(key);

    out.push({
      userId,
      bank: bankName,
      bankName,
      account: rawAccountNumber ? maskAccountNumber(rawAccountNumber) : accountMasked || String(existing?.account || ""),
      accountHolderName,
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
    const bankAccounts = sanitizeBankAccounts(body?.bankAccounts, user.bankAccounts, user._id);
    const teamMembers = sanitizeTeamMembers(body?.teamMembers);
    const approvalRules = mapApprovalRules(body?.approvalRules || user?.settings?.approvalRules || []);
    const tallyConfig = sanitizeTallyConfig(body?.tallyConfig, user);

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
  } catch {
    return errorResponse("SERVER_ERROR", "Server error", 500, auth.requestId);
  }
}
