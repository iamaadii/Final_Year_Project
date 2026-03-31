"use client";

import { useEffect, useMemo, useState } from "react";

type GeneralInfo = {
  companyName: string;
  contactEmail: string;
  billingAddress: string;
  gstNumber: string;
  panNumber: string;
  udhyamNumber: string;
};

type BankDetail = {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  status: string;
  logoText?: string;
  logoSrc?: string;
  accountNumberPlain?: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type ApprovalRule = {
  id: string;
  level: string;
  threshold: string;
  approver: string;
};

type IntegrationsConfig = {
  accounting: boolean;
  treasury: boolean;
  webhookUrl: string;
};

type TallyConfig = {
  host: string;
  port: string;
  companyName: string;
};

type IntegrationStatus = {
  syncEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
};

type TallyStatus = IntegrationStatus & {
  host: string;
  companyName: string;
  port: number;
};

type ZohoStatus = IntegrationStatus & {
  orgId?: string;
  connected?: boolean;
};

type IntegrationStatusResponse = {
  tally: TallyStatus;
  zohoBooks: ZohoStatus;
};

type PrivacyConfig = {
  whatsappOptIn: boolean;
  whatsappNumber: string;
  dpdpConsentVersion: string;
  dpdpConsentTimestamp: string | null;
  dpdpConsentPurposes: { purpose: string; granted: boolean; timestamp?: string }[];
  dataRetentionExpiresAt: string | null;
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string; details?: unknown } | null;
};

type BuyerBankItem = {
  _id?: string;
  bankName?: string;
  bank?: string;
  account?: string;
  ifscCode?: string;
  accountHolderName?: string;
  status?: string;
  logoText?: string;
  logoSrc?: string;
};

type BuyerTeamItem = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
};

type BuyerApprovalItem = {
  id?: string;
  level?: string;
  threshold?: string;
  approver?: string;
};

type BuyerSettingsResponse = {
  general?: Partial<GeneralInfo>;
  bankAccounts?: BuyerBankItem[];
  teamMembers?: BuyerTeamItem[];
  approvalRules?: BuyerApprovalItem[];
  integrations?: Partial<IntegrationsConfig>;
  tallyConfig?: Partial<TallyConfig>;
  privacy?: Partial<PrivacyConfig>;
};

type ConsentResponse = {
  consentVersion: string | null;
  consentTimestamp: string | null;
  purposes: { purpose: string; granted: boolean; timestamp?: string }[];
  dataRetentionExpiresAt: string | null;
  deletionRequestedAt: string | null;
  deletionScheduledAt: string | null;
};

const DPDP_CONSENT_VERSION = "v1.0";
const DPDP_PURPOSES = [
  { purpose: "account_operations", label: "Account operations" },
  { purpose: "compliance_notifications", label: "Compliance notifications" },
  { purpose: "product_analytics", label: "Product analytics" },
];

type BankOption = {
  code: string;
  name: string;
  logo: string;
};

const BANK_OPTIONS: BankOption[] = [
  { code: "AIRP", name: "Airtel Payments Bank", logo: "/bank_logos/airp.png" },
  { code: "AUBL", name: "AU Small Finance Bank", logo: "/bank_logos/aubl.png" },
  { code: "BARB", name: "Bank of Baroda", logo: "/bank_logos/barb.png" },
  { code: "BDBL", name: "Bandhan Bank", logo: "/bank_logos/bdbl.png" },
  { code: "BKID", name: "Bank of India", logo: "/bank_logos/bkid.png" },
  { code: "CBIN", name: "Central Bank of India", logo: "/bank_logos/cbin.png" },
  { code: "CIUB", name: "City Union Bank", logo: "/bank_logos/ciub.png" },
  { code: "CNRB", name: "Canara Bank", logo: "/bank_logos/cnrb.png" },
  { code: "CSBK", name: "CSB Bank", logo: "/bank_logos/csbk.png" },
  { code: "DCBL", name: "DCB Bank", logo: "/bank_logos/dcbl.png" },
  { code: "DLXB", name: "Dhanlaxmi Bank", logo: "/bank_logos/dlxb.png" },
  { code: "FDRL", name: "Federal Bank", logo: "/bank_logos/fdrl.png" },
  { code: "HDFC", name: "HDFC Bank", logo: "/bank_logos/hdfc.png" },
  { code: "IBKL", name: "IDBI Bank", logo: "/bank_logos/ibkl.png" },
  { code: "ICIC", name: "ICICI Bank", logo: "/bank_logos/icic.png" },
  { code: "IDFB", name: "IDFC First Bank", logo: "/bank_logos/idfb.png" },
  { code: "IDIB", name: "Indian Bank", logo: "/bank_logos/idib.png" },
  { code: "INDB", name: "IndusInd Bank", logo: "/bank_logos/indb.png" },
  { code: "IOBA", name: "Indian Overseas Bank", logo: "/bank_logos/ioba.png" },
  { code: "JAKA", name: "Jammu and Kashmir Bank", logo: "/bank_logos/jaka.png" },
  { code: "JIOP", name: "Jio Payments Bank", logo: "/bank_logos/jiop.png" },
  { code: "KARB", name: "Karnataka Bank", logo: "/bank_logos/karb.png" },
  { code: "KKBK", name: "Kotak Mahindra Bank", logo: "/bank_logos/kkbk.png" },
  { code: "KVBL", name: "Karur Vysya Bank", logo: "/bank_logos/kvbl.png" },
  { code: "MAHB", name: "Bank of Maharashtra", logo: "/bank_logos/mahb.png" },
  { code: "NTBL", name: "Nainital Bank", logo: "/bank_logos/ntbl.png" },
  { code: "PSIB", name: "Punjab and Sind Bank", logo: "/bank_logos/psib.png" },
  { code: "PUNB", name: "Punjab National Bank", logo: "/bank_logos/punb.png" },
  { code: "PYTM", name: "Paytm Payments Bank", logo: "/bank_logos/pytm.png" },
  { code: "RATN", name: "RBL Bank", logo: "/bank_logos/ratn.png" },
  { code: "SBIN", name: "State Bank of India", logo: "/bank_logos/sbin.png" },
  { code: "SCBL", name: "Standard Chartered Bank", logo: "/bank_logos/scbl.png" },
  { code: "SIBL", name: "South Indian Bank", logo: "/bank_logos/sibl.png" },
  { code: "TMBL", name: "Tamilnad Mercantile Bank", logo: "/bank_logos/tmbl.png" },
  { code: "UBIN", name: "Union Bank of India", logo: "/bank_logos/ubin.png" },
  { code: "UCBA", name: "UCO Bank", logo: "/bank_logos/ucba.png" },
  { code: "UJVN", name: "Ujjivan Small Finance Bank", logo: "/bank_logos/ujvn.png" },
  { code: "UTIB", name: "Axis Bank", logo: "/bank_logos/utib.png" },
  { code: "YESB", name: "YES Bank", logo: "/bank_logos/yesb.png" },
];

const bankOptionByCode = new Map(BANK_OPTIONS.map((option) => [option.code, option]));
const bankOptionByName = new Map(
  BANK_OPTIONS.map((option) => [option.name.toLowerCase().replace(/[^a-z0-9]/g, ""), option]),
);

function resolveBankOption(bankName: string, ifscCode: string) {
  const trimmedIfsc = ifscCode.trim().toUpperCase();
  if (trimmedIfsc.length >= 4) {
    const byCode = bankOptionByCode.get(trimmedIfsc.slice(0, 4));
    if (byCode) return byCode;
  }
  const normalizedName = bankName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return bankOptionByName.get(normalizedName) || null;
}

export default function BuyerSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "bank" | "team" | "approvals" | "integrations" | "privacy">("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showApprovalRule, setShowApprovalRule] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    companyName: "",
    contactEmail: "",
    billingAddress: "",
    gstNumber: "",
    panNumber: "",
    udhyamNumber: "",
  });

  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationsConfig>({
    accounting: false,
    treasury: false,
    webhookUrl: "",
  });
  const [tallyConfig, setTallyConfig] = useState<TallyConfig>({
    host: "",
    port: "9000",
    companyName: "",
  });
  const [privacy, setPrivacy] = useState<PrivacyConfig>({
    whatsappOptIn: false,
    whatsappNumber: "",
    dpdpConsentVersion: DPDP_CONSENT_VERSION,
    dpdpConsentTimestamp: null,
    dpdpConsentPurposes: DPDP_PURPOSES.map((item) => ({ purpose: item.purpose, granted: true })),
    dataRetentionExpiresAt: null,
    deletionRequestedAt: null,
    deletionScheduledAt: null,
  });
  const [consentSaving, setConsentSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatusResponse | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<"tally" | "zoho-books" | null>(null);
  const [lastSyncJobId, setLastSyncJobId] = useState<string>("");
  const [lastSyncJobState, setLastSyncJobState] = useState<string>("");
  const [tallyTestLoading, setTallyTestLoading] = useState(false);
  const [tallyTestMessage, setTallyTestMessage] = useState<string | null>(null);
  const [tallyTestError, setTallyTestError] = useState<string | null>(null);

  const [bankForm, setBankForm] = useState({ bankName: "", accountNumberPlain: "", ifscCode: "", accountHolderName: "" });
  const [bankSearch, setBankSearch] = useState("");
  const [showBankOptions, setShowBankOptions] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "AP_USER" });
  const [approvalForm, setApprovalForm] = useState({ level: "L1", threshold: "", approver: "" });

  const filteredBankOptions = useMemo(() => {
    const term = bankSearch.trim().toLowerCase();
    if (!term) return BANK_OPTIONS;
    return BANK_OPTIONS.filter((option) => option.name.toLowerCase().includes(term) || option.code.toLowerCase().includes(term));
  }, [bankSearch]);

  const selectedBankOption = useMemo(
    () => resolveBankOption(bankForm.bankName, bankForm.ifscCode),
    [bankForm.bankName, bankForm.ifscCode],
  );

  async function loadSettings() {
    setLoading(true);
    try {
      let integrationRuntime: IntegrationStatusResponse | null = null;
      const [response, integrationsRes, consentRes] = await Promise.all([
        fetch("/api/buyer/settings", { cache: "no-store" }),
        fetch("/api/integrations/status", { cache: "no-store" }),
        fetch("/api/users/me/consent", { cache: "no-store" }),
      ]);

      if (!response.ok) throw new Error("Failed to load buyer settings");
      const data = (await response.json()) as BuyerSettingsResponse;
      if (integrationsRes.ok) {
        const runtime = (await integrationsRes.json()) as ApiEnvelope<IntegrationStatusResponse>;
        if (runtime.success) {
          integrationRuntime = runtime.data;
          setIntegrationStatus(runtime.data);
        }
      }

      const general = data?.general || {};
      setGeneralInfo({
        companyName: String(general.companyName || ""),
        contactEmail: String(general.contactEmail || ""),
        billingAddress: String(general.billingAddress || ""),
        gstNumber: String(general.gstNumber || ""),
        panNumber: String(general.panNumber || ""),
        udhyamNumber: String(general.udhyamNumber || ""),
      });

      setBankDetails(
        (Array.isArray(data?.bankAccounts) ? data.bankAccounts : []).map((item: BuyerBankItem, idx: number) => {
          const bankName = String(item?.bankName || item?.bank || "");
          const ifscCode = String(item?.ifscCode || "");
          const resolved = resolveBankOption(bankName, ifscCode);
          return {
            id: String(item?._id || `${idx}`),
            bankName,
            accountNumber: String(item?.account || ""),
            ifscCode,
            accountHolderName: String(item?.accountHolderName || ""),
            status: String(item?.status || "Pending"),
            logoText: String(item?.logoText || resolved?.code?.slice(0, 3) || bankName.slice(0, 3) || "BNK").toUpperCase(),
            logoSrc: String(item?.logoSrc || resolved?.logo || ""),
          };
        }),
      );

      setTeamMembers(
        (Array.isArray(data?.teamMembers) ? data.teamMembers : []).map((item: BuyerTeamItem, idx: number) => ({
          id: String(item?._id || `${idx}`),
          name: String(item?.name || ""),
          email: String(item?.email || ""),
          role: String(item?.role || "AP_USER"),
          status: String(item?.status || "Pending"),
        })),
      );

      const rules: BuyerApprovalItem[] = Array.isArray(data?.approvalRules) ? data.approvalRules : [];
      setApprovalRules(
        rules.map((rule: BuyerApprovalItem, idx: number) => ({
          id: String(rule?.id || idx),
          level: String(rule?.level || "L1"),
          threshold: String(rule?.threshold || ""),
          approver: String(rule?.approver || ""),
        })),
      );

      setIntegrations({
        accounting: Boolean(data?.integrations?.accounting),
        treasury: Boolean(data?.integrations?.treasury),
        webhookUrl: String(data?.integrations?.webhookUrl || ""),
      });
      setTallyConfig({
        host: String(data?.tallyConfig?.host || integrationRuntime?.tally?.host || ""),
        port: String(data?.tallyConfig?.port || integrationRuntime?.tally?.port || 9000),
        companyName: String(data?.tallyConfig?.companyName || integrationRuntime?.tally?.companyName || ""),
      });
      let consentPayload: ConsentResponse | null = null;
      if (consentRes.ok) {
        const consentEnvelope = (await consentRes.json()) as ApiEnvelope<ConsentResponse>;
        if (consentEnvelope.success) consentPayload = consentEnvelope.data;
      }

      const consentVersion = String(consentPayload?.consentVersion || data?.privacy?.dpdpConsentVersion || DPDP_CONSENT_VERSION);
      const consentTimestamp = consentPayload?.consentTimestamp || data?.privacy?.dpdpConsentTimestamp || null;
      const consentPurposes = Array.isArray(consentPayload?.purposes) && consentPayload?.purposes.length > 0
        ? consentPayload.purposes
        : DPDP_PURPOSES.map((item) => ({ purpose: item.purpose, granted: true }));

      setPrivacy({
        whatsappOptIn: Boolean(data?.privacy?.whatsappOptIn),
        whatsappNumber: String(data?.privacy?.whatsappNumber || ""),
        dpdpConsentVersion: consentVersion,
        dpdpConsentTimestamp: consentTimestamp,
        dpdpConsentPurposes: consentPurposes,
        dataRetentionExpiresAt: consentPayload?.dataRetentionExpiresAt || data?.privacy?.dataRetentionExpiresAt || null,
        deletionRequestedAt: consentPayload?.deletionRequestedAt || data?.privacy?.deletionRequestedAt || null,
        deletionScheduledAt: consentPayload?.deletionScheduledAt || data?.privacy?.deletionScheduledAt || null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync(provider: "tally" | "zoho-books") {
    setSyncingProvider(provider);
    try {
      const endpoint = provider === "tally" ? "/api/integrations/tally/sync" : "/api/integrations/zoho/sync";
      const res = await fetch(endpoint, { method: "POST" });
      const payload = (await res.json()) as ApiEnvelope<{ jobId?: string }>;
      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || "Failed to trigger sync");
      }

      setLastSyncJobId(String(payload.data?.jobId || ""));
      setLastSyncJobState("queued");

      const statusRes = await fetch("/api/integrations/status", { cache: "no-store" });
      if (statusRes.ok) {
        const runtime = (await statusRes.json()) as ApiEnvelope<IntegrationStatusResponse>;
        if (runtime.success) {
          setIntegrationStatus(runtime.data);
        }
      }
    } catch {
      // no-op: UI remains usable even if sync trigger fails
    } finally {
      setSyncingProvider(null);
    }
  }

  async function testTallyConnection() {
    setTallyTestLoading(true);
    setTallyTestMessage(null);
    setTallyTestError(null);
    try {
      const res = await fetch("/api/integrations/tally/test", { method: "POST" });
      const payload = (await res.json()) as ApiEnvelope<{ message?: string }>;
      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || "Failed to test Tally connection");
      }
      setTallyTestMessage(payload.data?.message || "Tally connection successful.");
    } catch (error) {
      setTallyTestError(error instanceof Error ? error.message : "Failed to test Tally connection");
    } finally {
      setTallyTestLoading(false);
    }
  }

  useEffect(() => {
    if (!lastSyncJobId) return;

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(`/api/workers/jobs/${lastSyncJobId}?queue=erp-sync`, { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as ApiEnvelope<{ state?: string }>;
        const state = String(payload?.data?.state || "");
        if (!cancelled && state) {
          setLastSyncJobState(state);
        }
        if (["completed", "failed"].includes(state)) {
          return;
        }
      } catch {
        // no-op during polling
      }

      attempts += 1;
      if (!cancelled && attempts < 20) {
        setTimeout(poll, 1500);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [lastSyncJobId]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    setTallyTestMessage(null);
    setTallyTestError(null);
  }, [tallyConfig.host, tallyConfig.port, tallyConfig.companyName]);

  useEffect(() => {
    const trimmedIfsc = bankForm.ifscCode.trim().toUpperCase();
    if (trimmedIfsc.length < 4) return;
    const match = bankOptionByCode.get(trimmedIfsc.slice(0, 4));
    if (!match) return;
    if (bankForm.bankName.trim() !== match.name) {
      setBankForm((prev) => ({ ...prev, bankName: match.name }));
    }
    if (bankSearch !== match.name) {
      setBankSearch(match.name);
    }
  }, [bankForm.bankName, bankForm.ifscCode, bankSearch]);

  async function saveSettings() {
    setSaving(true);
    try {
      const parsedPort = Number(tallyConfig.port);
      const payload = {
        general: generalInfo,
        bankAccounts: bankDetails.map((item) => ({
          bankName: item.bankName,
          bank: item.bankName,
          account: item.accountNumber,
          accountNumberPlain: item.accountNumberPlain || "",
          ifscCode: item.ifscCode,
          accountHolderName: item.accountHolderName,
          status: item.status,
        })),
        teamMembers,
        approvalRules,
        integrations,
        tallyConfig: {
          host: tallyConfig.host,
          port: Number.isFinite(parsedPort) ? parsedPort : 9000,
          companyName: tallyConfig.companyName,
        },
        privacy,
      };

      const response = await fetch("/api/buyer/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save buyer settings");
      await loadSettings();
    } finally {
      setSaving(false);
    }
  }

  async function updateConsent() {
    setConsentSaving(true);
    try {
      const response = await fetch("/api/users/me/consent", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentVersion: privacy.dpdpConsentVersion || DPDP_CONSENT_VERSION,
          purposes: privacy.dpdpConsentPurposes,
        }),
      });
      if (!response.ok) throw new Error("Failed to update consent");
      const payload = (await response.json()) as ApiEnvelope<ConsentResponse>;
      if (payload.success) {
        setPrivacy((prev) => ({
          ...prev,
          dpdpConsentVersion: payload.data.consentVersion || prev.dpdpConsentVersion,
          dpdpConsentTimestamp: payload.data.consentTimestamp || prev.dpdpConsentTimestamp,
          dpdpConsentPurposes: payload.data.purposes || prev.dpdpConsentPurposes,
        }));
      }
    } finally {
      setConsentSaving(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const response = await fetch("/api/users/me/data-export", { method: "POST" });
      if (!response.ok) throw new Error("Failed to export data");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const match = contentDisposition.match(/filename=([^;]+)/i);
      const fileName = match ? match[1].replace(/"/g, "") : "dpdp-export.json";
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function requestDeletion() {
    if (!confirm("Are you sure you want to request data deletion? This action may take up to 30 days and will permanently close your account.")) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch("/api/users/me/data", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to request deletion");
      const payload = (await response.json()) as ApiEnvelope<{
        deletionRequestedAt: string;
        deletionScheduledAt: string;
      }>;
      if (payload.success) {
        setPrivacy((prev) => ({
          ...prev,
          deletionRequestedAt: payload.data.deletionRequestedAt,
          deletionScheduledAt: payload.data.deletionScheduledAt,
        }));
      }
    } finally {
      setDeleting(false);
    }
  }

  function addBankDetail() {
    const digits = bankForm.accountNumberPlain.replace(/\D/g, "");
    const masked = digits ? `A/C ****${digits.slice(-4).padStart(4, "0")}` : "A/C ****0000";
    const resolved = resolveBankOption(bankForm.bankName, bankForm.ifscCode);
    const logoText = (resolved?.code?.slice(0, 3) || bankForm.bankName.trim().slice(0, 3) || "BNK").toUpperCase();

    const nextItem = {
      id: editingBankId || crypto.randomUUID(),
      bankName: bankForm.bankName.trim(),
      accountNumber: masked,
      ifscCode: bankForm.ifscCode.trim().toUpperCase(),
      accountHolderName: bankForm.accountHolderName.trim(),
      status: "Pending",
      accountNumberPlain: digits,
      logoText,
      logoSrc: resolved?.logo || "",
    };

    setBankDetails((current) =>
      editingBankId ? current.map((item) => (item.id === editingBankId ? { ...item, ...nextItem } : item)) : [nextItem, ...current],
    );

    setBankForm({ bankName: "", accountNumberPlain: "", ifscCode: "", accountHolderName: "" });
    setBankSearch("");
    setShowBankOptions(false);
    setEditingBankId(null);
    setShowAddAccount(false);
  }

  function addTeamMember() {
    const nextItem = {
      id: editingTeamId || crypto.randomUUID(),
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim().toLowerCase(),
      role: inviteForm.role,
      status: "Pending",
    };

    setTeamMembers((current) =>
      editingTeamId ? current.map((item) => (item.id === editingTeamId ? { ...item, ...nextItem } : item)) : [nextItem, ...current],
    );

    setInviteForm({ name: "", email: "", role: "AP_USER" });
    setEditingTeamId(null);
    setShowInviteUser(false);
  }

  function handleEditBank(item: BankDetail) {
    setEditingBankId(item.id);
    setBankForm({
      bankName: item.bankName,
      accountNumberPlain: item.accountNumberPlain || "",
      ifscCode: item.ifscCode,
      accountHolderName: item.accountHolderName,
    });
    setBankSearch(item.bankName);
    setShowBankOptions(false);
    setShowAddAccount(true);
  }

  function handleDeleteBank(id: string) {
    setBankDetails((current) => current.filter((item) => item.id !== id));
  }

  function handleEditTeam(item: TeamMember) {
    setEditingTeamId(item.id);
    setInviteForm({ name: item.name, email: item.email, role: item.role });
    setShowInviteUser(true);
  }

  function handleDeleteTeam(id: string) {
    setTeamMembers((current) => current.filter((item) => item.id !== id));
  }

  function addApprovalRule() {
    setApprovalRules((current) => [
      {
        id: crypto.randomUUID(),
        level: approvalForm.level,
        threshold: approvalForm.threshold,
        approver: approvalForm.approver,
      },
      ...current,
    ]);
    setApprovalForm({ level: "L1", threshold: "", approver: "" });
    setShowApprovalRule(false);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto lg:mx-0 pb-12">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Buyer Settings</h1>
        <p className="mt-2 text-sm text-slate-500">Configure buyer account, payouts, workflow approvals and integrations.</p>
      </header>

      <div className="flex bg-slate-200/50 p-1 rounded-xl w-max overflow-x-auto max-w-full">
        <button onClick={() => setActiveTab("general")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === "general" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>General</button>
        <button onClick={() => setActiveTab("bank")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Bank</button>
        <button onClick={() => setActiveTab("team")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === "team" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Team</button>
        <button onClick={() => setActiveTab("approvals")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === "approvals" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Approvals</button>
        <button onClick={() => setActiveTab("integrations")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === "integrations" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Integrations</button>
        <button onClick={() => setActiveTab("privacy")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${activeTab === "privacy" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>Privacy</button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading settings...</div>
      ) : (
        <>
          {activeTab === "general" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
                <input value={generalInfo.companyName} onChange={(e) => setGeneralInfo((g) => ({ ...g, companyName: e.target.value }))} type="text" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Email</label>
                <input value={generalInfo.contactEmail} onChange={(e) => setGeneralInfo((g) => ({ ...g, contactEmail: e.target.value }))} type="email" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Billing Address</label>
                <textarea value={generalInfo.billingAddress} onChange={(e) => setGeneralInfo((g) => ({ ...g, billingAddress: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]" />
              </div>

              <div className="md:col-span-2 rounded-2xl border border-[#cfe8e6] bg-gradient-to-br from-[#eef9f8] via-white to-[#f8f3e9] p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#1b5b6a]">Verified Business Identity</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#d9ecea] bg-white/90 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">GSTIN</p>
                    <p className="mt-1 font-mono text-sm text-slate-800">{generalInfo.gstNumber || "Not available"}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9ecea] bg-white/90 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">PAN</p>
                    <p className="mt-1 font-mono text-sm text-slate-800">{generalInfo.panNumber || "Not available"}</p>
                  </div>
                  <div className="rounded-xl border border-[#d9ecea] bg-white/90 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Udyam</p>
                    <p className="mt-1 font-mono text-sm text-slate-800">{generalInfo.udhyamNumber || "Not available"}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <button onClick={saveSettings} disabled={saving} className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60">{saving ? "Saving..." : "Save General Settings"}</button>
              </div>
            </section>
          )}

          {activeTab === "bank" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Disbursement Accounts</h2>
                <button onClick={() => setShowAddAccount(true)} className="text-sm font-semibold text-[#1b5b6a] bg-[#e0f2f1]/60 px-3 py-1.5 rounded-lg">+ Add Account</button>
              </div>
              <div className="sm:hidden p-4 space-y-3">
                {bankDetails.length === 0 ? (
                  <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-sm text-slate-500 text-center">
                    No bank details added yet.
                  </div>
                ) : (
                  bankDetails.map((account) => (
                    <div key={`${account.id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                            {account.logoSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={account.logoSrc} alt="Bank logo" className="h-full w-full object-cover" />
                            ) : (
                              <span>{account.logoText || "BNK"}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{account.bankName}</p>
                            <p className="text-xs text-slate-500">IFSC: {account.ifscCode}</p>
                          </div>
                        </div>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{account.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <span className="text-slate-500">Account</span>
                        <span className="text-right font-mono text-slate-800">{account.accountNumber}</span>
                        <span className="text-slate-500">Holder</span>
                        <span className="text-right text-slate-700">{account.accountHolderName}</span>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => handleEditBank(account)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                        <button onClick={() => handleDeleteBank(account.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto p-4 -mx-4 px-4 sm:mx-0 sm:px-4">
                <table className="min-w-[760px] w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="sticky left-0 z-10 bg-white py-2">Bank</th>
                      <th className="py-2">Account</th>
                      <th className="py-2">Holder</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Edit</th>
                      <th className="py-2">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bankDetails.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No bank details added yet.</td></tr> : bankDetails.map((account) => (
                      <tr key={account.id}>
                        <td className="sticky left-0 z-10 bg-white py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                              {account.logoSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={account.logoSrc} alt="Bank logo" className="h-full w-full object-cover" />
                              ) : (
                                <span>{account.logoText || "BNK"}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{account.bankName}</p>
                              <p className="text-xs text-slate-500">IFSC: {account.ifscCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono">{account.accountNumber}</td>
                        <td className="py-3">{account.accountHolderName}</td>
                        <td className="py-3">{account.status}</td>
                        <td className="py-3"><button onClick={() => handleEditBank(account)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button></td>
                        <td className="py-3"><button onClick={() => handleDeleteBank(account.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-200">
                <button onClick={saveSettings} disabled={saving} className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60">{saving ? "Saving..." : "Save Bank Details"}</button>
              </div>
            </section>
          )}

          {activeTab === "team" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Team Members</h2>
                <button onClick={() => setShowInviteUser(true)} className="text-sm font-semibold text-[#1b5b6a] bg-[#e0f2f1]/60 px-3 py-1.5 rounded-lg">+ Invite User</button>
              </div>
              <div className="sm:hidden p-4 space-y-3">
                {teamMembers.length === 0 ? (
                  <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-sm text-slate-500 text-center">
                    No team members yet.
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div key={`${member.id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{member.name}</p>
                          <p className="text-sm text-slate-600">{member.email}</p>
                        </div>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{member.status}</span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">{member.role}</p>
                      <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => handleEditTeam(member)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                        <button onClick={() => handleDeleteTeam(member.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto p-4 -mx-4 px-4 sm:mx-0 sm:px-4">
                <table className="min-w-[760px] w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="sticky left-0 z-10 bg-white py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Role</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Edit</th>
                      <th className="py-2">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-slate-500">No team members yet.</td></tr> : teamMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="sticky left-0 z-10 bg-white py-3"><p className="font-semibold text-slate-800">{member.name}</p></td>
                        <td className="py-3">{member.email}</td>
                        <td className="py-3">{member.role}</td>
                        <td className="py-3">{member.status}</td>
                        <td className="py-3"><button onClick={() => handleEditTeam(member)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button></td>
                        <td className="py-3"><button onClick={() => handleDeleteTeam(member.id)} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-200">
                <button onClick={saveSettings} disabled={saving} className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60">{saving ? "Saving..." : "Save Team Members"}</button>
              </div>
            </section>
          )}

          {activeTab === "approvals" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 p-4 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Approval Rules</h2>
                <button onClick={() => setShowApprovalRule(true)} className="text-sm font-semibold text-[#1b5b6a] bg-[#e0f2f1]/60 px-3 py-1.5 rounded-lg">+ Add Rule</button>
              </div>
              <div className="sm:hidden p-4 space-y-3">
                {approvalRules.length === 0 ? (
                  <div className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4 text-sm text-slate-500 text-center">
                    No approval rules yet.
                  </div>
                ) : (
                  approvalRules.map((rule) => (
                    <div key={`${rule.id}-mobile`} className="rounded-xl border border-[var(--mint-border)] bg-[var(--brand-sand)] p-4">
                      <div className="flex justify-between items-center gap-3">
                        <p className="font-semibold text-slate-800">{rule.level}</p>
                        <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{rule.threshold}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Approver: {rule.approver}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden sm:block overflow-x-auto p-4 -mx-4 px-4 sm:mx-0 sm:px-4">
                <table className="min-w-[560px] w-full text-left text-sm text-slate-600">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-700">
                    <tr>
                      <th className="sticky left-0 z-10 bg-white py-2">Level</th>
                      <th className="py-2">Threshold</th>
                      <th className="py-2">Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvalRules.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-slate-500">No approval rules yet.</td></tr> : approvalRules.map((rule) => (
                      <tr key={rule.id}>
                        <td className="sticky left-0 z-10 bg-white py-3">{rule.level}</td>
                        <td className="py-3">{rule.threshold}</td>
                        <td className="py-3">{rule.approver}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-slate-200">
                <button onClick={saveSettings} disabled={saving} className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60">{saving ? "Saving..." : "Save Approval Rules"}</button>
              </div>
            </section>
          )}

          {activeTab === "integrations" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
              <h2 className="font-bold text-slate-800">Integrations</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={integrations.accounting} onChange={(e) => setIntegrations((c) => ({ ...c, accounting: e.target.checked }))} className="h-4 w-4 accent-[#1b5b6a]" />
                  Accounting Sync
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={integrations.treasury} onChange={(e) => setIntegrations((c) => ({ ...c, treasury: e.target.checked }))} className="h-4 w-4 accent-[#1b5b6a]" />
                  Treasury Sync
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Webhook URL</label>
                <input value={integrations.webhookUrl} onChange={(e) => setIntegrations((c) => ({ ...c, webhookUrl: e.target.value }))} type="url" placeholder="https://api.company.com/webhooks/buyer" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]" />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tally Connection</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Host</label>
                    <input
                      value={tallyConfig.host}
                      onChange={(e) => setTallyConfig((c) => ({ ...c, host: e.target.value }))}
                      placeholder="127.0.0.1"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b5b6a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Port</label>
                    <input
                      value={tallyConfig.port}
                      onChange={(e) => setTallyConfig((c) => ({ ...c, port: e.target.value }))}
                      placeholder="9000"
                      type="number"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b5b6a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Name</label>
                    <input
                      value={tallyConfig.companyName}
                      onChange={(e) => setTallyConfig((c) => ({ ...c, companyName: e.target.value }))}
                      placeholder="Tally Company"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1b5b6a]"
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Enter the host and port where the Tally connector is exposed. We will validate connectivity when you sync.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={testTallyConnection}
                    disabled={tallyTestLoading}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {tallyTestLoading ? "Testing..." : "Test Connection"}
                  </button>
                  {tallyTestMessage ? (
                    <span className="text-xs font-semibold text-emerald-700">{tallyTestMessage}</span>
                  ) : null}
                  {tallyTestError ? (
                    <span className="text-xs font-semibold text-rose-600">{tallyTestError}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tally</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {integrationStatus?.tally?.lastSyncStatus ? `Last status: ${integrationStatus.tally.lastSyncStatus}` : "Not synced yet"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {integrationStatus?.tally?.lastSyncAt ? `Last sync at ${new Date(integrationStatus.tally.lastSyncAt).toLocaleString("en-IN")}` : "No recent sync"}
                  </p>
                  <button
                    onClick={() => triggerSync("tally")}
                    disabled={syncingProvider !== null}
                    className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {syncingProvider === "tally" ? "Syncing..." : "Sync Tally"}
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Zoho Books</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {integrationStatus?.zohoBooks?.lastSyncStatus ? `Last status: ${integrationStatus.zohoBooks.lastSyncStatus}` : "Not synced yet"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {integrationStatus?.zohoBooks?.lastSyncAt ? `Last sync at ${new Date(integrationStatus.zohoBooks.lastSyncAt).toLocaleString("en-IN")}` : "No recent sync"}
                  </p>
                  <button
                    onClick={() => triggerSync("zoho-books")}
                    disabled={syncingProvider !== null}
                    className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {syncingProvider === "zoho-books" ? "Syncing..." : "Sync Zoho Books"}
                  </button>
                </div>
              </div>

              {lastSyncJobId && (
                <p className="text-xs text-slate-500">Latest sync job id: {lastSyncJobId}{lastSyncJobState ? ` | state: ${lastSyncJobState}` : ""}</p>
              )}

              <button onClick={saveSettings} disabled={saving} className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60">{saving ? "Saving..." : "Save Integrations"}</button>
            </section>
          )}

          {activeTab === "privacy" && (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-800">WhatsApp Notifications</h2>
                <p className="mt-1 text-sm text-slate-500">Receive payment reminders and approval requests directly on WhatsApp.</p>
                
                <div className="mt-5 grid gap-4 max-w-md">
                  <label className="flex items-center gap-3 text-sm text-slate-800 font-semibold cursor-pointer">
                    <input type="checkbox" checked={privacy.whatsappOptIn} onChange={(e) => setPrivacy((p) => ({ ...p, whatsappOptIn: e.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-[#1b5b6a] focus:ring-[#1b5b6a]" />
                    Enable WhatsApp notifications
                  </label>
                  
                  {privacy.whatsappOptIn && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp Number</label>
                      <input value={privacy.whatsappNumber} onChange={(e) => setPrivacy((p) => ({ ...p, whatsappNumber: e.target.value }))} type="tel" placeholder="+91 9876543210" className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-[#1b5b6a]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-800">DPDP Act 2023 Compliance</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your data privacy and retention settings under the Digital Personal Data Protection Act.</p>
                
                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consent Version</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{privacy.dpdpConsentVersion}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {privacy.dpdpConsentTimestamp
                        ? `Last updated ${new Date(privacy.dpdpConsentTimestamp).toLocaleString("en-IN")}`
                        : "You consented to our privacy policy upon registration."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data Retention Policy</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {privacy.dataRetentionExpiresAt ? new Date(privacy.dataRetentionExpiresAt).toLocaleDateString() : "Indefinite (Active Account)"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Inactive accounts are retained for maximum 7 years for tax compliance.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consent Purposes</p>
                  <div className="mt-3 grid gap-3">
                    {DPDP_PURPOSES.map((item) => {
                      const granted = privacy.dpdpConsentPurposes.some((p) => p.purpose === item.purpose && p.granted);
                      return (
                        <label key={item.purpose} className="flex items-center gap-3 text-sm text-slate-700 font-semibold">
                          <input
                            type="checkbox"
                            checked={granted}
                            onChange={(e) => {
                              setPrivacy((prev) => ({
                                ...prev,
                                dpdpConsentPurposes: prev.dpdpConsentPurposes.map((p) =>
                                  p.purpose === item.purpose ? { ...p, granted: e.target.checked } : p,
                                ),
                              }));
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#0f1b2d] focus:ring-[#0f1b2d]"
                          />
                          {item.label}
                        </label>
                      );
                    })}
                  </div>
                  <button
                    onClick={updateConsent}
                    disabled={consentSaving}
                    className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    {consentSaving ? "Updating..." : "Update Consent"}
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={exportData}
                    disabled={exporting}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                  >
                    {exporting ? "Exporting..." : "Export My Data (JSON)"}
                  </button>
                  <button
                    onClick={requestDeletion}
                    disabled={deleting}
                    className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-rose-100 disabled:opacity-60"
                  >
                    {deleting ? "Submitting..." : "Request Data Deletion"}
                  </button>
                </div>

                {privacy.deletionRequestedAt && (
                  <p className="mt-3 text-xs text-rose-600">
                    Deletion requested on {new Date(privacy.deletionRequestedAt).toLocaleDateString("en-IN")}. Scheduled for {privacy.deletionScheduledAt ? new Date(privacy.deletionScheduledAt).toLocaleDateString("en-IN") : "processing"}.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <button onClick={saveSettings} disabled={saving} className="rounded-xl bg-[#0f1b2d] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#142338] disabled:opacity-60">{saving ? "Saving..." : "Save Privacy Settings"}</button>
              </div>
            </section>
          )}
        </>
      )}

      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:items-center">
          <form onSubmit={(e) => { e.preventDefault(); addBankDetail(); }} className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{editingBankId ? "Edit Bank Detail" : "Add Bank Detail"}</h3>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Bank</label>
              <div className="relative">
                <input
                  value={bankSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBankSearch(value);
                    setBankForm((f) => ({ ...f, bankName: value }));
                  }}
                  onFocus={() => setShowBankOptions(true)}
                  onBlur={() => setTimeout(() => setShowBankOptions(false), 120)}
                  required
                  placeholder="Search bank name or IFSC prefix"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                  autoComplete="off"
                />
                {showBankOptions && (
                  <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {filteredBankOptions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">No matching banks found.</div>
                    ) : (
                      filteredBankOptions.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setBankForm((f) => {
                              const currentIfsc = f.ifscCode.trim().toUpperCase();
                              const nextIfsc = currentIfsc.startsWith(option.code) ? currentIfsc : option.code;
                              return { ...f, bankName: option.name, ifscCode: nextIfsc };
                            });
                            setBankSearch(option.name);
                            setShowBankOptions(false);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={option.logo} alt={option.name} className="h-full w-full object-cover" />
                          </span>
                          <span className="font-semibold text-slate-700">{option.name}</span>
                          <span className="ml-auto text-xs font-semibold text-slate-400">{option.code}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedBankOption ? (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedBankOption.logo} alt={selectedBankOption.name} className="h-full w-full object-cover" />
                  </span>
                  <span className="font-semibold text-slate-700">{selectedBankOption.name}</span>
                  <span className="text-slate-400">IFSC prefix {selectedBankOption.code}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Tip: entering an IFSC code will auto-detect the bank.</p>
              )}
            </div>
            <input
              value={bankForm.accountNumberPlain}
              onChange={(e) => setBankForm((f) => ({ ...f, accountNumberPlain: e.target.value.replace(/\D/g, "") }))}
              required
              placeholder="Account Number"
              inputMode="numeric"
              pattern="\d{9,18}"
              minLength={9}
              maxLength={18}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              value={bankForm.ifscCode}
              onChange={(e) => setBankForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
              required
              placeholder="IFSC"
              inputMode="text"
              pattern="[A-Z]{4}0[A-Z0-9]{6}"
              minLength={11}
              maxLength={11}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 uppercase"
            />
            <input value={bankForm.accountHolderName} onChange={(e) => setBankForm((f) => ({ ...f, accountHolderName: e.target.value }))} required placeholder="Account Holder Name" className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddAccount(false)} className="rounded-xl border border-slate-300 px-4 py-2">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-white">{editingBankId ? "Update" : "Add"}</button>
            </div>
          </form>
        </div>
      )}

      {showInviteUser && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:items-center">
          <form onSubmit={(e) => { e.preventDefault(); addTeamMember(); }} className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">{editingTeamId ? "Edit Team Member" : "Invite Team Member"}</h3>
            <input value={inviteForm.name} onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Full Name" className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
            <input value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))} required type="email" placeholder="Email" className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
            <select value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-white">
              <option value="AP_USER">AP User</option>
              <option value="AP_MANAGER">AP Manager</option>
              <option value="TREASURY_MANAGER">Treasury Manager</option>
              <option value="VIEW_ONLY">View Only</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowInviteUser(false)} className="rounded-xl border border-slate-300 px-4 py-2">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-white">{editingTeamId ? "Update" : "Invite"}</button>
            </div>
          </form>
        </div>
      )}

      {showApprovalRule && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:items-center">
          <form onSubmit={(e) => { e.preventDefault(); addApprovalRule(); }} className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Add Approval Rule</h3>
            <select value={approvalForm.level} onChange={(e) => setApprovalForm((f) => ({ ...f, level: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-white">
              <option value="L1">Level 1</option>
              <option value="L2">Level 2</option>
              <option value="L3">Level 3</option>
            </select>
            <input value={approvalForm.threshold} onChange={(e) => setApprovalForm((f) => ({ ...f, threshold: e.target.value }))} required placeholder="Threshold (e.g. INR 5,00,000)" className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
            <input value={approvalForm.approver} onChange={(e) => setApprovalForm((f) => ({ ...f, approver: e.target.value }))} required placeholder="Approver Name" className="w-full rounded-xl border border-slate-300 px-4 py-2.5" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowApprovalRule(false)} className="rounded-xl border border-slate-300 px-4 py-2">Cancel</button>
              <button type="submit" className="rounded-xl bg-[#0f1b2d] px-4 py-2 text-white">Add Rule</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
