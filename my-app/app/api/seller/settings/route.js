import { NextResponse } from "next/server";
import { getAuthUserFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function sanitizeBankAccounts(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((item) => ({
      bank: String(item?.bank || "").trim(),
      account: String(item?.account || "").trim(),
      accountHolderName: String(item?.accountHolderName || "").trim(),
      status: String(item?.status || "Pending").trim(),
      logoText: String(item?.logoText || "BNK").trim(),
      logoSrc: String(item?.logoSrc || "").trim(),
    }))
    .filter((item) => item.bank && item.account);
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

export async function GET() {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can access settings data" }, { status: 403 });
  }

  const bankAccounts = Array.isArray(user.bankAccounts) ? user.bankAccounts : [];
  const teamMembers = Array.isArray(user.teamMembers) ? user.teamMembers : [];

  return NextResponse.json({ bankAccounts, teamMembers });
}

export async function PUT(req) {
  const user = await getAuthUserFromCookies();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.userType !== "Seller") {
    return NextResponse.json({ message: "Only sellers can update settings data" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const bankAccounts = sanitizeBankAccounts(body?.bankAccounts);
    const teamMembers = sanitizeTeamMembers(body?.teamMembers);

    user.bankAccounts = bankAccounts;
    user.teamMembers = teamMembers;
    await user.save();

    return NextResponse.json({
      message: "Settings saved",
      bankAccounts: user.bankAccounts || [],
      teamMembers: user.teamMembers || [],
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
