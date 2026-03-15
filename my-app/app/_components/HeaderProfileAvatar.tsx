"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState } from "react";

type HeaderProfileAvatarProps = {
  href: string;
  initialProfile?: {
    name?: string;
    profileImage?: string;
  };
};

type ProfileState = {
  name: string;
  profileImage: string;
};

const initialState: ProfileState = {
  name: "User",
  profileImage: "",
};
let profileCache: ProfileState | null = null;

export default function HeaderProfileAvatar({ href, initialProfile }: HeaderProfileAvatarProps) {
  const hasInitialData = Boolean(
    profileCache?.name ||
      profileCache?.profileImage ||
      initialProfile?.name ||
      initialProfile?.profileImage,
  );
  const [profile, setProfile] = useState<ProfileState>(() => {
    if (profileCache) return profileCache;
    if (initialProfile?.name || initialProfile?.profileImage) {
      return {
        name: initialProfile.name || "User",
        profileImage: initialProfile.profileImage || "",
      };
    }
    return initialState;
  });
  const [ready, setReady] = useState(hasInitialData);
  const [failedImageSrc, setFailedImageSrc] = useState("");

  useLayoutEffect(() => {
    try {
      if (!profileCache && (initialProfile?.name || initialProfile?.profileImage)) {
        profileCache = {
          name: initialProfile.name || "User",
          profileImage: initialProfile.profileImage || "",
        };
      }
      const raw = localStorage.getItem("profileAvatar");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileState>;
        const next = {
          name: parsed?.name || "User",
          profileImage: parsed?.profileImage || "",
        };
        profileCache = next;
        setProfile(next);
      } else if (profileCache) {
        setProfile(profileCache);
      }
    } catch {
      // Keep fallback avatar.
    } finally {
      setReady(true);
    }
  }, [initialProfile?.name, initialProfile?.profileImage]);

  useEffect(() => {
    function loadFromLocalStorage() {
      try {
        const raw = localStorage.getItem("profileAvatar");
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<ProfileState>;
        const next = {
          name: parsed?.name || "User",
          profileImage: parsed?.profileImage || "",
        };
        setProfile((prev) => {
          if (prev.name === next.name && prev.profileImage === next.profileImage) return prev;
          return next;
        });
        profileCache = next;
      } catch {
        // Ignore invalid local data.
      }
    }

    if (profileCache) setProfile(profileCache);
    loadFromLocalStorage();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "profileAvatar") loadFromLocalStorage();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const normalizedName = (profile.name || "User").trim();
  const nameParts = normalizedName.split(/\s+/).filter(Boolean);
  let displayInitials = "";
  if (nameParts.length > 0) {
     const first = nameParts[0][0];
     const last = nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "";
     const middle = nameParts.length > 2 ? nameParts[1][0] : "";
     if (nameParts.length === 1) displayInitials = first;
     else if (nameParts.length === 2) displayInitials = first + last;
     else displayInitials = first + middle + last;
     displayInitials = displayInitials.toUpperCase();
  } else {
     displayInitials = "U";
  }
  const avatarFallback = displayInitials[0];
  const imageSrc = (profile.profileImage || "").trim();
  const showImage = Boolean(imageSrc) && failedImageSrc !== imageSrc;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-full border border-transparent p-1 pr-3 pl-4 transition-colors hover:bg-slate-100"
      title="Profile Settings"
    >
      <div className="hidden sm:flex flex-col items-end justify-center">
         <span className="text-sm font-bold text-slate-800 leading-tight">{normalizedName}</span>
         <span className="text-[10px] font-bold text-slate-500 tracking-widest">{displayInitials}</span>
      </div>
      {!ready ? (
        <span className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
      ) : (
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e0f2f1]/60 shadow-sm border border-[#cfe8e6]">
          <span className="text-sm font-bold text-[#1b5b6a]">{avatarFallback}</span>
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="absolute inset-0 h-10 w-10 rounded-full object-cover"
              onLoad={() => {
                if (failedImageSrc === imageSrc) setFailedImageSrc("");
              }}
              onError={() => {
                setFailedImageSrc(imageSrc);
              }}
            />
          ) : null}
        </span>
      )}
    </Link>
  );
}

