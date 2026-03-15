"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const statutoryDocMeta = [
  {
    key: "udhyamNumber",
    title: "Udyam Certificate",
    badge: "Government Verified",
    tone: "purple",
    iconSrc: "/satymev_jyate.svg",
    iconAlt: "Udyam Certificate",
  },
  {
    key: "panNumber",
    title: "PAN",
    badge: "Government Verified",
    tone: "blue",
    iconSrc: "/pan.svg",
    iconAlt: "PAN",
  },
  {
    key: "gstNumber",
    title: "GSTIN",
    badge: "Government Verified",
    tone: "green",
    iconSrc: "/gst.svg",
    iconAlt: "GSTIN",
  },
] as const;
type StatutoryDocKey = (typeof statutoryDocMeta)[number]["key"];

type BankAccountRow = {
  id: string;
  bank: string;
  account: string;
  accountHolderName: string;
  ifscCode: string;
  branchName?: string;
  status: string;
  logoText: string;
  logoSrc?: string;
};

type TeamMemberRow = {
  name: string;
  subtitle: string;
  email: string;
  role: string;
  status: string;
};

type SettingsDraft = {
  dirty: boolean;
  bankRows: BankAccountRow[];
  teamRows: TeamMemberRow[];
};

type RawBank = {
  bank?: string;
  account?: string;
  accountHolderName?: string;
  ifscCode?: string;
  branchName?: string;
  status?: string;
  logoText?: string;
  logoSrc?: string;
};

type RawTeamMember = {
  name?: string;
  subtitle?: string;
  email?: string;
  role?: string;
  status?: string;
};

type SellerSettingsClientProps = {
  initialBankRows?: RawBank[];
  initialTeamRows?: RawTeamMember[];
  initialVerificationData?: {
    gstNumber?: string;
    panNumber?: string;
    udhyamNumber?: string;
  };
};

function docIconTone(tone: "purple" | "blue" | "green") {
  if (tone === "purple") return "bg-violet-100 text-violet-700";
  if (tone === "green") return "bg-emerald-100 text-emerald-700";
  return "bg-[#e0f2f1]/60 text-[#1b5b6a]";
}

function statusBadge(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("verified") || lower.includes("active")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (lower.includes("pending") || lower.includes("invited")) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-slate-100 text-slate-700";
}

function logoFromBankName(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "BNK";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return `${words[0][0] || ""}${words[1][0] || ""}${words[2]?.[0] || ""}`.toUpperCase();
}

const bankLogoSlugByName: Record<string, string> = {
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

function normalizeBankLookupName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\bthe\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bankLogoSlugFromName(name: string) {
  const normalized = normalizeBankLookupName(name);
  if (!normalized) return "";
  return bankLogoSlugByName[normalized] || "";
}

function normalizeIfscCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function logoSrcFromBankName(name: string) {
  const slug = bankLogoSlugFromName(name);
  if (!slug) return "";
  return `/bank_logos/${slug}.png`;
}

function normalizeBanks(rows: RawBank[], source: "db" | "draft") {
  return rows.map((row, index) => ({
    id: `${source}-bank-${index}`,
    bank: row?.bank || "",
    account: row?.account || "",
    accountHolderName: row?.accountHolderName || "",
    ifscCode: normalizeIfscCode(row?.ifscCode || ""),
    branchName: row?.branchName || "",
    status: row?.status || "Pending",
    logoText: row?.logoText || logoFromBankName(row?.bank || ""),
    logoSrc: row?.logoSrc || logoSrcFromBankName(row?.bank || ""),
  }));
}

function normalizeTeams(rows: RawTeamMember[]) {
  return rows.map((member) => ({
    name: member?.name || "",
    subtitle: member?.subtitle || "Team Member",
    email: member?.email || "",
    role: member?.role || "View Only",
    status: member?.status || "Pending",
  }));
}

function buildMemberRoleMap(rows: TeamMemberRow[]) {
  return rows.reduce<Record<string, string>>((acc, member) => {
    acc[member.email] = member.role;
    return acc;
  }, {});
}

function bankDeleteToken(account: string) {
  return String(account || "").replace(/^A\/C\s*/i, "").replace(/,\s*Added$/i, "").trim() || "****0000";
}

function maskStatutoryValue(key: StatutoryDocKey, value: string) {
  const clean = String(value || "");
  if (!clean) return "Not Provided";

  if (key === "panNumber") {
    if (clean.length <= 4) return "****";
    return `${clean.slice(0, 3)}****${clean.slice(-1)}`;
  }

  if (key === "gstNumber") {
    if (clean.length <= 7) return `${clean.slice(0, 2)}****`;
    return `${clean.slice(0, 2)}********${clean.slice(-3)}`;
  }

  if (key === "udhyamNumber") {
    if (!clean.startsWith("UDYAM-")) return `${clean.slice(0, 4)}****`;
    const tail = clean.slice(-4);
    return `UDYAM-XX-XX-***${tail}`;
  }

  return "****";
}

export default function SettingsClient({
  initialBankRows = [],
  initialTeamRows = [],
  initialVerificationData = {},
}: SellerSettingsClientProps) {
  const settingsDraftKey = "sellerSettingsDraft";
  const initialDirtyDraft = (() => {
    if (typeof window === "undefined") return null;
    try {
      const rawDraft = localStorage.getItem(settingsDraftKey);
      if (!rawDraft) return null;
      const draft = JSON.parse(rawDraft) as Partial<SettingsDraft>;
      if (!draft?.dirty) return null;
      return draft;
    } catch {
      return null;
    }
  })();
  const [bankRows, setBankRows] = useState<BankAccountRow[]>(() =>
    initialDirtyDraft?.bankRows
      ? normalizeBanks(initialDirtyDraft.bankRows as RawBank[], "draft")
      : normalizeBanks(initialBankRows, "db"),
  );
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankFormError, setBankFormError] = useState("");
  const [bankDeletePromptIndex, setBankDeletePromptIndex] = useState<number | null>(null);
  const [bankDeleteBusy, setBankDeleteBusy] = useState(false);
  const [bankDeleteAccount, setBankDeleteAccount] = useState("");
  const [bankDeleteError, setBankDeleteError] = useState("");
  const [bankDeletingId, setBankDeletingId] = useState<string | null>(null);
  const [bankDeleteModalOpen, setBankDeleteModalOpen] = useState(false);
  const bankDeleteCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [teamRows, setTeamRows] = useState<TeamMemberRow[]>(() =>
    initialDirtyDraft?.teamRows
      ? normalizeTeams(initialDirtyDraft.teamRows as RawTeamMember[])
      : normalizeTeams(initialTeamRows),
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("View Only");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [teamEditIndex, setTeamEditIndex] = useState<number | null>(null);
  const [teamDeletePromptIndex, setTeamDeletePromptIndex] = useState<number | null>(null);
  const [teamDeleteBusy, setTeamDeleteBusy] = useState(false);
  const [teamDeleteEmail, setTeamDeleteEmail] = useState("");
  const [teamDeleteError, setTeamDeleteError] = useState("");
  const [teamDeletingEmail, setTeamDeletingEmail] = useState<string | null>(null);
  const [teamDeleteModalOpen, setTeamDeleteModalOpen] = useState(false);
  const teamDeleteCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [teamEditForm, setTeamEditForm] = useState<TeamMemberRow>({
    name: "",
    subtitle: "",
    email: "",
    role: "View Only",
    status: "Pending",
  });
  const [teamEditError, setTeamEditError] = useState("");
  const settingsLoadError = "";
  const [revealedDocs, setRevealedDocs] = useState<Record<StatutoryDocKey, boolean>>({
    udhyamNumber: false,
    panNumber: false,
    gstNumber: false,
  });
  const verificationData = {
    gstNumber: String(initialVerificationData?.gstNumber || ""),
    panNumber: String(initialVerificationData?.panNumber || ""),
    udhyamNumber: String(initialVerificationData?.udhyamNumber || ""),
  };
  const profileLoaded = true;
  const settingsLoaded = true;

  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(
    () =>
      initialDirtyDraft?.teamRows
        ? buildMemberRoleMap(normalizeTeams(initialDirtyDraft.teamRows as RawTeamMember[]))
        : buildMemberRoleMap(normalizeTeams(initialTeamRows)),
  );

  const roleOptions = ["Admin", "Full Access", "View Only", "Invoice Creator"];

  function saveDraft(nextBanks: BankAccountRow[], nextTeamRows: TeamMemberRow[], dirty: boolean) {
    if (typeof window === "undefined") return;
    const payload: SettingsDraft = {
      dirty,
      bankRows: nextBanks,
      teamRows: nextTeamRows,
    };
    localStorage.setItem(
      settingsDraftKey,
      JSON.stringify(payload),
    );
  }

  async function persistSettings(
    nextBanks: BankAccountRow[],
    nextTeamRows: TeamMemberRow[],
    rawAccountNumbersById: Record<string, string> = {},
  ) {
    const response = await fetch("/api/seller/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankAccounts: nextBanks.map((row) => ({
          clientId: row.id,
          bank: row.bank,
          account: row.account,
          accountHolderName: row.accountHolderName || "",
          ifscCode: row.ifscCode || "",
          branchName: row.branchName || "",
          accountNumberPlain: rawAccountNumbersById[row.id] || "",
          status: row.status,
          logoText: row.logoText,
          logoSrc: row.logoSrc || "",
        })),
        teamMembers: nextTeamRows.map((row) => ({
          name: row.name,
          subtitle: row.subtitle,
          email: row.email,
          role: row.role,
          status: row.status,
        })),
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(payload?.message || "Failed to save settings."));
    }

    return payload as {
      bankAccounts?: RawBank[];
      teamMembers?: RawTeamMember[];
    };
  }

  function maskAccount(input: string) {
    const digits = input.replace(/\D/g, "");
    if (!digits) return "A/C ****0000";
    const tail = digits.slice(-4).padStart(4, "0");
    return `A/C ****${tail}`;
  }

  function handleToggleAddBankForm() {
    if (showAddBankForm) {
      setAccountHolderName("");
      setAccountNumber("");
      setIfscCode("");
      setBankFormError("");
      setShowAddBankForm(false);
      return;
    }

    setShowAddBankForm(true);
  }

  function handleAddBankAccount() {
    const submittedAccountHolderName = accountHolderName.trim();
    const normalizedIfscCode = normalizeIfscCode(ifscCode);
    const accountDigits = accountNumber.replace(/\D/g, "");
    if (!submittedAccountHolderName) {
      setBankFormError("Account holder name is required.");
      return;
    }
    if (accountDigits.length < 9 || accountDigits.length > 18) {
      setBankFormError("Bank account number must be 9 to 18 digits.");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfscCode)) {
      setBankFormError("Enter a valid 11-character IFSC code.");
      return;
    }

    const next: BankAccountRow = {
      id: `bank-${Date.now()}`,
      bank: "Verifying bank",
      account: maskAccount(accountNumber),
      accountHolderName: submittedAccountHolderName,
      ifscCode: normalizedIfscCode,
      branchName: "",
      status: "Pending (Penny Drop: Rs 1 Deposited)",
      logoText: logoFromBankName("Bank"),
      logoSrc: "",
    };

    const nextBankRows = [next, ...bankRows];
    setBankRows(nextBankRows);
    setAccountHolderName("");
    setAccountNumber("");
    setIfscCode("");
    setBankFormError("");
    setShowAddBankForm(false);
    saveDraft(nextBankRows, teamRows, true);
    persistSettings(nextBankRows, teamRows, { [next.id]: accountDigits })
      .then((payload) => {
        const savedBanks = Array.isArray(payload.bankAccounts) ? normalizeBanks(payload.bankAccounts, "db") : nextBankRows;
        setBankRows(savedBanks);
        saveDraft(savedBanks, teamRows, false);
      })
      .catch((error) => {
        setBankRows((prev) => prev.filter((row) => row.id !== next.id));
        setAccountHolderName(submittedAccountHolderName);
        setAccountNumber(accountDigits);
        setIfscCode(normalizedIfscCode);
        setShowAddBankForm(true);
        setBankFormError(error instanceof Error ? error.message : "Failed to save account. Try again.");
      });
  }

  function openDeleteBankConfirmation(index: number) {
    const account = bankRows[index];
    if (!account) return;
    setBankDeletePromptIndex(index);
    setBankDeleteAccount("");
    setBankDeleteError("");
  }

  function closeDeleteBankConfirmation() {
    if (bankDeleteBusy) return;
    setBankDeleteModalOpen(false);
    if (bankDeleteCloseTimerRef.current) {
      clearTimeout(bankDeleteCloseTimerRef.current);
    }
    bankDeleteCloseTimerRef.current = setTimeout(() => {
      setBankDeletePromptIndex(null);
      setBankDeleteAccount("");
      setBankDeleteError("");
      bankDeleteCloseTimerRef.current = null;
    }, 180);
  }

  async function handleDeleteBankAccount() {
    if (bankDeletePromptIndex === null) return;
    const account = bankRows[bankDeletePromptIndex];
    if (!account) return;
    const expectedToken = bankDeleteToken(account.account);
    if (bankDeleteAccount.trim() !== expectedToken) {
      setBankDeleteError("Confirmation text does not match. Bank account not removed.");
      return;
    }

    const updatedBankRows = bankRows.filter((_, idx) => idx !== bankDeletePromptIndex);
    setBankDeleteBusy(true);
    setBankDeletingId(account.id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 220));
      await persistSettings(updatedBankRows, teamRows);
      setBankRows(updatedBankRows);
      saveDraft(updatedBankRows, teamRows, false);
      setBankDeletingId(null);
      setBankDeleteModalOpen(false);
      if (bankDeleteCloseTimerRef.current) {
        clearTimeout(bankDeleteCloseTimerRef.current);
      }
      bankDeleteCloseTimerRef.current = setTimeout(() => {
        setBankDeletePromptIndex(null);
        setBankDeleteAccount("");
        setBankDeleteError("");
        bankDeleteCloseTimerRef.current = null;
      }, 180);
    } catch {
      setBankDeleteError("Could not remove bank account from database.");
      setBankDeletingId(null);
    } finally {
      setBankDeleteBusy(false);
    }
  }

  function handleCancelInvite() {
    setInviteName("");
    setInviteEmail("");
    setInviteRole("View Only");
    setInviteTitle("");
    setInviteError("");
    setShowInviteForm(false);
  }

  function handleInviteTeamMember() {
    const name = inviteName.trim();
    const email = inviteEmail.trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name) {
      setInviteError("Member name is required.");
      return;
    }
    if (!emailOk) {
      setInviteError("Please enter a valid email address.");
      return;
    }
    if (teamRows.some((member) => member.email.toLowerCase() === email)) {
      setInviteError("This email is already added.");
      return;
    }

    const nextMember: TeamMemberRow = {
      name,
      subtitle: inviteTitle.trim() || "Team Member",
      email,
      role: inviteRole,
      status: "Pending",
    };

    const nextTeamRows = [nextMember, ...teamRows];
    setTeamRows(nextTeamRows);
    setMemberRoles((prev) => ({ ...prev, [email]: inviteRole }));
    handleCancelInvite();
    saveDraft(bankRows, nextTeamRows, true);
    persistSettings(bankRows, nextTeamRows)
      .then(() => saveDraft(bankRows, nextTeamRows, false))
      .catch(() => setInviteError("Invite saved locally, database update failed."));
  }

  function handleStartTeamEdit(index: number) {
    const member = teamRows[index];
    if (!member) return;
    setTeamEditError("");
    setTeamEditIndex(index);
    setTeamEditForm({
      name: member.name,
      subtitle: member.subtitle,
      email: member.email,
      role: member.role,
      status: member.status,
    });
  }

  function handleCancelTeamEdit() {
    setTeamEditIndex(null);
    setTeamEditError("");
  }

  function handleSaveTeamEdit() {
    if (teamEditIndex === null) return;
    const nextName = teamEditForm.name.trim();
    const nextSubtitle = teamEditForm.subtitle.trim() || "Team Member";
    const nextEmail = teamEditForm.email.trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail);

    if (!nextName) {
      setTeamEditError("Member name is required.");
      return;
    }
    if (!emailOk) {
      setTeamEditError("Please enter a valid email address.");
      return;
    }
    const duplicate = teamRows.some((member, idx) => idx !== teamEditIndex && member.email.toLowerCase() === nextEmail);
    if (duplicate) {
      setTeamEditError("This email is already added.");
      return;
    }

    const updatedTeamRows = teamRows.map((member, idx) =>
      idx === teamEditIndex
        ? {
            ...member,
            name: nextName,
            subtitle: nextSubtitle,
            email: nextEmail,
            role: teamEditForm.role,
          }
        : member,
    );
    setTeamRows(updatedTeamRows);
    setMemberRoles(buildMemberRoleMap(updatedTeamRows));
    setTeamEditIndex(null);
    setTeamEditError("");
    saveDraft(bankRows, updatedTeamRows, true);
    persistSettings(bankRows, updatedTeamRows)
      .then(() => saveDraft(bankRows, updatedTeamRows, false))
      .catch(() => setTeamEditError("Could not save team member changes."));
  }

  function openDeleteMemberConfirmation(index: number) {
    const member = teamRows[index];
    if (!member) return;
    setTeamDeletePromptIndex(index);
    setTeamDeleteEmail("");
    setTeamDeleteError("");
  }

  function closeDeleteMemberConfirmation() {
    if (teamDeleteBusy) return;
    setTeamDeleteModalOpen(false);
    if (teamDeleteCloseTimerRef.current) {
      clearTimeout(teamDeleteCloseTimerRef.current);
    }
    teamDeleteCloseTimerRef.current = setTimeout(() => {
      setTeamDeletePromptIndex(null);
      setTeamDeleteEmail("");
      setTeamDeleteError("");
      teamDeleteCloseTimerRef.current = null;
    }, 180);
  }

  async function handleDeleteTeamMember() {
    if (teamDeletePromptIndex === null) return;
    const member = teamRows[teamDeletePromptIndex];
    if (!member) return;
    if (teamDeleteEmail.trim().toLowerCase() !== member.email.trim().toLowerCase()) {
      setTeamDeleteError("Email does not match. Team member not deleted.");
      return;
    }

    const updatedTeamRows = teamRows.filter((_, idx) => idx !== teamDeletePromptIndex);
    setTeamDeleteBusy(true);
    setTeamDeletingEmail(member.email);
    try {
      await new Promise((resolve) => setTimeout(resolve, 220));
      await persistSettings(bankRows, updatedTeamRows);
      setTeamRows(updatedTeamRows);
      setMemberRoles(buildMemberRoleMap(updatedTeamRows));
      if (teamEditIndex === teamDeletePromptIndex) {
        setTeamEditIndex(null);
      } else if (teamEditIndex !== null && teamEditIndex > teamDeletePromptIndex) {
        setTeamEditIndex(teamEditIndex - 1);
      }
      setTeamEditError("");
      saveDraft(bankRows, updatedTeamRows, false);
      setTeamDeletingEmail(null);
      setTeamDeleteModalOpen(false);
      if (teamDeleteCloseTimerRef.current) {
        clearTimeout(teamDeleteCloseTimerRef.current);
      }
      teamDeleteCloseTimerRef.current = setTimeout(() => {
        setTeamDeletePromptIndex(null);
        setTeamDeleteEmail("");
        setTeamDeleteError("");
        teamDeleteCloseTimerRef.current = null;
      }, 180);
    } catch {
      setTeamDeleteError("Could not delete team member from database.");
      setTeamDeletingEmail(null);
    } finally {
      setTeamDeleteBusy(false);
    }
  }

  useEffect(() => {
    if (bankDeleteCloseTimerRef.current) {
      clearTimeout(bankDeleteCloseTimerRef.current);
      bankDeleteCloseTimerRef.current = null;
    }
    if (bankDeletePromptIndex === null) {
      setBankDeleteModalOpen(false);
      return;
    }
    setBankDeleteModalOpen(false);
    const frameId = requestAnimationFrame(() => setBankDeleteModalOpen(true));
    return () => cancelAnimationFrame(frameId);
  }, [bankDeletePromptIndex]);

  useEffect(() => {
    if (teamDeleteCloseTimerRef.current) {
      clearTimeout(teamDeleteCloseTimerRef.current);
      teamDeleteCloseTimerRef.current = null;
    }
    if (teamDeletePromptIndex === null) {
      setTeamDeleteModalOpen(false);
      return;
    }
    setTeamDeleteModalOpen(false);
    const frameId = requestAnimationFrame(() => setTeamDeleteModalOpen(true));
    return () => cancelAnimationFrame(frameId);
  }, [teamDeletePromptIndex]);

  useEffect(() => () => {
    if (bankDeleteCloseTimerRef.current) {
      clearTimeout(bankDeleteCloseTimerRef.current);
      bankDeleteCloseTimerRef.current = null;
    }
    if (teamDeleteCloseTimerRef.current) {
      clearTimeout(teamDeleteCloseTimerRef.current);
      teamDeleteCloseTimerRef.current = null;
    }
  }, []);

  const statutoryDocs = statutoryDocMeta.map((doc) => ({
    ...doc,
    rawValue: verificationData[doc.key] || "",
    value: revealedDocs[doc.key]
      ? verificationData[doc.key] || "Not Provided"
      : maskStatutoryValue(doc.key, verificationData[doc.key] || ""),
  }));

  return (
    <div className="space-y-4">
      {settingsLoadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{settingsLoadError}</p>
      ) : null}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Profile &amp; Settings (The Trust Anchor)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Keep your business identification updated and verified.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Statutory Identity Wallet</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {statutoryDocs.map((doc) => (
            <article key={doc.title} className="rounded-xl border border-slate-200">
              <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${docIconTone(doc.tone)}`}>
                    <Image
                      src={doc.iconSrc}
                      alt={doc.iconAlt}
                      width={30}
                      height={30}
                      className="h-11 w-11 object-contain"
                    />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{doc.title}</p>
                    {!profileLoaded ? (
                      <span className="mt-1 block h-4 w-36 animate-pulse rounded bg-slate-200" />
                    ) : (
                      <p className="text-sm text-slate-600">{doc.value}</p>
                    )}
                  </div>
                </div>
                <span className="w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {doc.badge}
                </span>
              </div>
              <div className="grid grid-cols-2 border-t border-slate-200 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setRevealedDocs((prev) => ({
                      ...prev,
                      [doc.key]: !prev[doc.key],
                    }))
                  }
                  className="flex items-center justify-center gap-2 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Image
                    src={revealedDocs[doc.key] ? "/hide.svg" : "/view.svg"}
                    alt={revealedDocs[doc.key] ? "Hide" : "View"}
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  <span>{revealedDocs[doc.key] ? "Hide" : "View"}</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 border-l border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Image src="/download.svg" alt="Download" width={16} height={16} className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[1fr_1.15fr]">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Bank Account Management</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1.8fr_1fr_auto] gap-4 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-black">
              <span>Bank Account</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {bankRows.map((row, index) => (
              <div
                key={row.id}
                className={`grid grid-cols-[1.8fr_1fr_auto] items-start gap-4 border-t border-slate-200 px-3 py-3 transition-all duration-200 ${
                  bankDeletingId === row.id ? "translate-x-2 scale-[0.98] opacity-0" : "opacity-100"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e0f2f1]/60 text-[10px] font-bold text-[#1b5b6a]">
                    {row.logoSrc ? (
                      <Image
                        src={row.logoSrc}
                        alt={`${row.bank} logo`}
                        className="h-7 w-7 rounded object-contain"
                        width={28}
                        height={28}
                      />
                    ) : (
                      row.logoText
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{row.bank}</p>
                    {row.accountHolderName ? <p className="text-xs text-slate-500">{row.accountHolderName}</p> : null}
                    <p className="break-words text-sm text-slate-600">{row.account}</p>
                  </div>
                </div>
                <div className="sm:text-left">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>
                    {row.status}
                  </span>
                </div>
                <div className="sm:text-left">
                  <button
                    type="button"
                    onClick={() => openDeleteBankConfirmation(index)}
                    disabled={bankDeleteBusy}
                    className="rounded border border-red-700 bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!settingsLoaded ? (
                <div className="space-y-3 border-t border-slate-200 px-3 py-4">
                <div className="grid grid-cols-[1.8fr_1fr_auto] items-start gap-4">
                  <div className="flex items-start gap-2">
                    <span className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                    <div className="space-y-2">
                      <span className="block h-4 w-40 animate-pulse rounded bg-slate-200" />
                      <span className="block h-3 w-28 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                  <span className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-6 w-16 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="grid grid-cols-[1.8fr_1fr_auto] items-start gap-4">
                  <div className="flex items-start gap-2">
                    <span className="h-9 w-9 animate-pulse rounded-lg bg-slate-200" />
                    <div className="space-y-2">
                      <span className="block h-4 w-36 animate-pulse rounded bg-slate-200" />
                      <span className="block h-3 w-24 animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                  <span className="h-6 w-24 animate-pulse rounded-full bg-slate-200" />
                  <span className="h-6 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ) : bankRows.length === 0 ? (
              <div className="border-t border-slate-200 px-3 py-4 text-sm text-slate-500">
                No bank accounts have been added yet. Add a bank account to receive payouts and keep your settlements ready.
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleToggleAddBankForm}
            className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${
              showAddBankForm ? "bg-rose-600 hover:bg-rose-700" : "bg-[#0f1b2d] hover:bg-[#142338]"
            }`}
          >
            {showAddBankForm ? "Close" : "+ Add New Bank Account"}
          </button>
          {showAddBankForm ? (
            <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid gap-2 lg:grid-cols-2">
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => {
                    setAccountHolderName(e.target.value);
                    if (bankFormError) setBankFormError("");
                  }}
                  placeholder="Account Holder Name"
                  className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                />
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    if (bankFormError) setBankFormError("");
                  }}
                  placeholder="Bank Account Number"
                  className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                />
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => {
                    setIfscCode(normalizeIfscCode(e.target.value));
                    if (bankFormError) setBankFormError("");
                  }}
                  placeholder="IFSC Code"
                  className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                />
                <button
                  type="button"
                  onClick={handleAddBankAccount}
                  className="w-full whitespace-nowrap rounded-lg border border-[#cfe8e6] bg-[#e0f2f1]/50 px-3 py-2 text-sm font-semibold text-[#1b5b6a] hover:bg-[#e0f2f1]"
                >
                  Add
                </button>
              </div>
              {bankFormError ? <p className="text-xs font-medium text-rose-600">{bankFormError}</p> : null}
            </div>
          ) : null}
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[#cfe8e6] bg-[#e0f2f1]/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f1b2d] text-[11px] font-bold text-white">
                i
              </span>
              <p className="text-sm font-medium leading-snug text-slate-700">
                &quot;Penny Drop&quot; Verification: We deposit Rs 1 to verify your account holder name matches
                the business name.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-end text-[#1b5b6a] sm:self-auto">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                <Image
                  src="/bank.svg"
                  alt="Bank"
                  className="h-4 w-4"
                  width={16}
                  height={16}
                  style={{ filter: "invert(31%) sepia(89%) saturate(1717%) hue-rotate(209deg) brightness(94%) contrast(93%)" }}
                />
              </span>
              <span className="text-base font-extrabold leading-none text-slate-900">-&gt;</span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                <Image
                  src="/lock.svg"
                  alt="Lock"
                  className="h-5 w-5"
                  width={16}
                  height={16}
                  style={{ filter: "invert(31%) sepia(89%) saturate(1717%) hue-rotate(209deg) brightness(94%) contrast(93%)" }}
                />
              </span>
            </div>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Team Access Control</h2>
            <button
              type="button"
              onClick={() => {
                setShowInviteForm(true);
                if (inviteError) setInviteError("");
              }}
              className="w-full rounded-lg bg-[#0f1b2d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#142338] sm:w-auto"
            >
              + Invite Team Member
            </button>
          </div>
          {showInviteForm ? (
            <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => {
                  setInviteName(e.target.value);
                  if (inviteError) setInviteError("");
                }}
                placeholder="Member name"
                className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  if (inviteError) setInviteError("");
                }}
                placeholder="Work email"
                className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
              />
              <input
                type="text"
                value={inviteTitle}
                onChange={(e) => {
                  setInviteTitle(e.target.value);
                  if (inviteError) setInviteError("");
                }}
                placeholder="Designation"
                className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleInviteTeamMember}
                  className="rounded-lg border border-[#cfe8e6] bg-[#e0f2f1]/50 px-3 py-2 text-sm font-semibold text-[#1b5b6a] hover:bg-[#e0f2f1]"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={handleCancelInvite}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Cancel Invite
                </button>
              </div>
              {inviteError ? <p className="text-xs font-medium text-rose-600 sm:col-span-2">{inviteError}</p> : null}
            </div>
          ) : null}

          <div className="mt-3 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-black">
                <tr>
                  <th className="px-3 py-2">Name &amp; Avatar</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {teamRows.map((member, index) => (
                  <tr
                    key={`${member.email}-${index}`}
                    className={`border-t border-slate-200 transition-all duration-200 ${
                      teamDeletingEmail === member.email ? "translate-x-2 scale-[0.98] opacity-0" : "opacity-100"
                    }`}
                  >
                    <td className="px-3 py-2">
                      {teamEditIndex === index ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={teamEditForm.name}
                            onChange={(e) => setTeamEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                          />
                          <input
                            type="text"
                            value={teamEditForm.subtitle}
                            onChange={(e) => setTeamEditForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                          />
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartTeamEdit(index)}
                            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#cfe8e6] bg-[#e0f2f1]/50 hover:bg-[#e0f2f1]"
                            title="Edit team member"
                          >
                            <Image src="/edit.svg" alt="Edit" width={14} height={14} className="h-3.5 w-3.5" />
                          </button>
                          <div>
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.subtitle}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {teamEditIndex === index ? (
                        <input
                          type="email"
                          value={teamEditForm.email}
                          onChange={(e) => setTeamEditForm((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                        />
                      ) : (
                        member.email
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {teamEditIndex === index ? (
                        <select
                          value={teamEditForm.role}
                          onChange={(e) => setTeamEditForm((prev) => ({ ...prev, role: e.target.value }))}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {memberRoles[member.email] || member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {teamEditIndex === index ? (
                        <div className="space-y-1.5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(member.status)}`}>
                            {member.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveTeamEdit}
                              className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelTeamEdit}
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(member.status)}`}>
                          {member.status}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => openDeleteMemberConfirmation(index)}
                        disabled={teamDeleteBusy}
                        className="rounded border border-red-700 bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {teamEditError ? (
                  <tr className="border-t border-slate-200">
                    <td colSpan={5} className="px-3 py-2 text-xs font-medium text-rose-600">
                      {teamEditError}
                    </td>
                  </tr>
                ) : null}
                {!settingsLoaded ? (
                  <tr className="border-t border-slate-200">
                    <td colSpan={5} className="px-3 py-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-5 gap-3">
                          <span className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                          <span className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                          <span className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : teamRows.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td colSpan={5} className="px-3 py-4 text-sm text-slate-500">
                      No team members have been added yet. Invite teammates here to share access and manage permissions securely.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {bankDeletePromptIndex !== null ? (
        <div
          className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 transition-opacity duration-200 ${
            bankDeleteModalOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${
              bankDeleteModalOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
            }`}
          >
            <p className="text-sm text-slate-600">
              Type &quot;{bankDeleteToken(bankRows[bankDeletePromptIndex]?.account || "")}&quot; to confirm deletion.
            </p>
            <input
              type="text"
              value={bankDeleteAccount}
              onChange={(e) => {
                setBankDeleteAccount(e.target.value);
                if (bankDeleteError) setBankDeleteError("");
              }}
              placeholder="Enter account entry to confirm"
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
            />
            {bankDeleteError ? (
              <p className="mt-2 text-xs font-medium text-rose-600">{bankDeleteError}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteBankConfirmation}
                disabled={bankDeleteBusy}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteBankAccount()}
                disabled={bankDeleteBusy}
                className="rounded border border-red-700 bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {bankDeleteBusy ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {teamDeletePromptIndex !== null ? (
        <div
          className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 transition-opacity duration-200 ${
            teamDeleteModalOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl transition-all duration-200 ${
              teamDeleteModalOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
            }`}
          >
            <h3 className="text-lg font-semibold text-slate-900">Confirmation</h3>
            <p className="mt-2 text-sm text-slate-600">
              Type the &quot;{teamRows[teamDeletePromptIndex]?.email || "email"}&quot; to confirm deletion
            </p>
            <input
              type="email"
              value={teamDeleteEmail}
              onChange={(e) => {
                setTeamDeleteEmail(e.target.value);
                if (teamDeleteError) setTeamDeleteError("");
              }}
              placeholder="Enter email to confirm"
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
            />
            {teamDeleteError ? (
              <p className="mt-2 text-xs font-medium text-rose-600">{teamDeleteError}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteMemberConfirmation}
                disabled={teamDeleteBusy}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteTeamMember()}
                disabled={teamDeleteBusy}
                className="rounded border border-red-700 bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {teamDeleteBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}









