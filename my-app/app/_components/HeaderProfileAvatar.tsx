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

  const normalizedName = (profile.name || "").trim();
  const firstAlpha = normalizedName.match(/[A-Za-z]/)?.[0] || "";
  const initial = (firstAlpha || "U").toUpperCase();
  const imageSrc = (profile.profileImage || "").trim();
  const showImage = Boolean(imageSrc) && failedImageSrc !== imageSrc;

  return (
    <Link
      href={href}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-base font-semibold text-slate-700 hover:bg-slate-300"
      title="Profile Settings"
    >
      {!ready ? (
        <span className="h-12 w-12 rounded-full bg-slate-200" />
      ) : (
        <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-200">
          <span className="text-base font-semibold uppercase text-slate-700">{initial}</span>
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="absolute inset-0 h-12 w-12 rounded-full object-cover"
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
