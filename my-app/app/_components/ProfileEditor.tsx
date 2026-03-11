"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileEditorProps = {
  dashboardPath: string;
  heading: string;
  showLogout?: boolean;
  initialProfileData?: Partial<ProfileData>;
};

type ProfileData = {
  name: string;
  email: string;
  userType: string;
  gstNumber: string;
  panNumber: string;
  udhyamNumber: string;
  contactNumber: string;
  profileImage: string;
};

const initialData: ProfileData = {
  name: "",
  email: "",
  userType: "",
  gstNumber: "",
  panNumber: "",
  udhyamNumber: "",
  contactNumber: "",
  profileImage: "",
};

export default function ProfileEditor({
  dashboardPath,
  heading,
  showLogout = false,
  initialProfileData,
}: ProfileEditorProps) {
  const router = useRouter();
  const hydratedInitialData = {
    ...initialData,
    ...(initialProfileData || {}),
  };
  const hasInitialProfileData = Boolean(
    hydratedInitialData.name ||
      hydratedInitialData.email ||
      hydratedInitialData.gstNumber ||
      hydratedInitialData.panNumber ||
      hydratedInitialData.udhyamNumber ||
      hydratedInitialData.contactNumber ||
      hydratedInitialData.profileImage,
  );
  const [data, setData] = useState<ProfileData>(hydratedInitialData);
  const [originalData, setOriginalData] = useState<ProfileData>(hydratedInitialData);
  const [loading, setLoading] = useState(!hasInitialProfileData);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [failedAvatarSrc, setFailedAvatarSrc] = useState("");
  const [animateIn, setAnimateIn] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    router.prefetch(`${dashboardPath}?refresh=0`);
  }, [dashboardPath, router]);

  useEffect(() => {
    if (hasInitialProfileData) return;

    async function loadProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile", { method: "GET" });
        const profile = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(profile.message || "Could not load profile");
          return;
        }

        const nextData = {
          ...initialData,
          ...profile,
        };
        setData(nextData);
        setOriginalData(nextData);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "profileAvatar",
            JSON.stringify({
              name: nextData.name || "User",
              profileImage: nextData.profileImage || "",
            }),
          );
        }
      } catch {
        setError("Could not load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [hasInitialProfileData]);

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = objectUrl;
      });

      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        setError("Unable to process selected image");
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), "image/jpeg", 0.75),
      );
      if (!blob) {
        setError("Unable to process selected image");
        return;
      }

      const upload = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", upload);
      formData.append("previousImage", data.profileImage || "");

      const res = await fetch("/api/upload/profile-image", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.imageUrl) {
        setError(result?.message || "Could not upload selected image");
        return;
      }

      setFailedAvatarSrc("");
      setData((prev) => ({ ...prev, profileImage: result.imageUrl }));
    } catch {
      setError("Could not process selected image");
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isEditing) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          gstNumber: data.gstNumber,
          panNumber: data.panNumber,
          udhyamNumber: data.udhyamNumber,
          contactNumber: data.contactNumber,
          profileImage: data.profileImage,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.message || "Could not update profile");
        return;
      }

      const savedProfile = result?.profile || data;
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "profileAvatar",
          JSON.stringify({
            name: savedProfile.name || data.name || "User",
            profileImage: savedProfile.profileImage || data.profileImage || "",
          }),
        );
      }

      setOriginalData(data);
      setIsEditing(false);
      setMessage("Profile updated successfully");
      router.refresh();
    } catch {
      setError("Could not update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProfilePicture() {
    if (!data.profileImage) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          gstNumber: data.gstNumber,
          panNumber: data.panNumber,
          udhyamNumber: data.udhyamNumber,
          contactNumber: data.contactNumber,
          profileImage: "",
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.message || "Could not delete profile picture");
        return;
      }

      const next = { ...(result?.profile || data), profileImage: "" };
      setData((prev) => ({ ...prev, profileImage: "" }));
      setOriginalData((prev) => ({ ...prev, profileImage: "" }));
      setFailedAvatarSrc("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "profileAvatar",
          JSON.stringify({
            name: next.name || data.name || "User",
            profileImage: "",
          }),
        );
      }

      setMessage("Profile picture deleted");
      router.refresh();
    } catch {
      setError("Could not delete profile picture");
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit() {
    setMessage("");
    setError("");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setData(originalData);
    setMessage("");
    setError("");
    setIsEditing(false);
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // Continue logout redirect even if API call fails.
    } finally {
      localStorage.removeItem("profileAvatar");
      localStorage.removeItem("sellerNotifications");
      window.location.assign("/login");
    }
  }

  function handleBackToDashboard() {
    if (isLeaving) return;
    setIsLeaving(true);
    window.setTimeout(() => {
      router.push(`${dashboardPath}?refresh=${Date.now()}`);
    }, 180);
  }

  const titleText = data.name?.trim() ? data.name : heading;
  const trimmedName = (data.name || "").trim();
  const firstAlpha = trimmedName.match(/[A-Za-z]/)?.[0] || "";
  const avatarLetter = (firstAlpha || "U").toUpperCase();
  const avatarSrc = (data.profileImage || "").trim();
  const canShowAvatar = Boolean(avatarSrc) && failedAvatarSrc !== avatarSrc;

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-8 sm:px-6">
      <div
        className={`mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow transition-all duration-700 sm:p-8 ${
          isLeaving
            ? "-translate-y-2 scale-95 opacity-0"
            : animateIn
              ? "translate-y-0 opacity-100"
              : "translate-y-5 opacity-0"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1
            className={`text-3xl font-bold text-slate-900 transition-all delay-100 duration-700 ${
              animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            {titleText}
          </h1>
          <div className="flex items-center gap-2">
            {showLogout ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                Logout
              </button>
            ) : null}
            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleBackToDashboard}
              disabled={isLeaving}
              className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {isLeaving ? "Opening..." : "Back to Dashboard"}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-slate-500">Loading profile...</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-emerald-600">{message}</p>}

            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-200">
                  <div className="flex h-20 w-20 items-center justify-center text-2xl font-semibold text-slate-700">
                    {avatarLetter}
                  </div>
                  {canShowAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt=""
                      className="absolute inset-0 h-20 w-20 object-cover"
                      onLoad={() => {
                        if (failedAvatarSrc === avatarSrc) setFailedAvatarSrc("");
                      }}
                      onError={() => {
                        setFailedAvatarSrc(avatarSrc);
                      }}
                    />
                  ) : null}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={!isEditing}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) return;
                    fileInputRef.current?.click();
                  }}
                  className={`absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white/95 text-slate-700 ${isEditing ? "cursor-pointer hover:bg-white" : "cursor-not-allowed opacity-70"}`}
                  title={isEditing ? "Upload profile photo" : "Click Edit Profile first"}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 8.5C4 7.12 5.12 6 6.5 6H8.1C8.44 6 8.76 5.83 8.95 5.55L9.54 4.65C9.91 4.1 10.53 3.77 11.2 3.77H12.8C13.47 3.77 14.09 4.1 14.46 4.65L15.05 5.55C15.24 5.83 15.56 6 15.9 6H17.5C18.88 6 20 7.12 20 8.5V16.5C20 17.88 18.88 19 17.5 19H6.5C5.12 19 4 17.88 4 16.5V8.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>

              <div>
                <p className="text-sm text-slate-500">{data.email}</p>
                {showLogout ? (
                  <button
                    type="button"
                    onClick={handleDeleteProfilePicture}
                    disabled={!data.profileImage || saving}
                    className="mt-1 text-xs font-semibold text-rose-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                  >
                    Delete Profile Picture
                  </button>
                ) : null}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 ${isEditing ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100"}`}
                required
                disabled={!isEditing}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Contact Number</span>
              <input
                type="tel"
                value={data.contactNumber}
                onChange={(e) => setData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 ${isEditing ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100"}`}
                disabled={!isEditing}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">GST Number</span>
              <input
                type="text"
                value={data.gstNumber}
                onChange={(e) => setData((prev) => ({ ...prev, gstNumber: e.target.value }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 ${isEditing ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100"}`}
                disabled={!isEditing}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">PAN Number</span>
              <input
                type="text"
                value={data.panNumber}
                onChange={(e) => setData((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 ${isEditing ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100"}`}
                disabled={!isEditing}
                pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
                title="PAN format: ABCDE1234F"
              />
            </label>

            {data.userType === "Seller" && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Udyam Number</span>
                <input
                  type="text"
                  value={data.udhyamNumber}
                  onChange={(e) => setData((prev) => ({ ...prev, udhyamNumber: e.target.value.toUpperCase() }))}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-slate-700 ${isEditing ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-100"}`}
                  disabled={!isEditing}
                  pattern="^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$"
                  title="Udyam format: UDYAM-MH-12-1234567"
                />
              </label>
            )}

            {isEditing && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
