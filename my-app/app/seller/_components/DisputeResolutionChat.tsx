"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "buyer" | "seller";

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
};

type Position = {
  x: number;
  y: number;
};

type DisputeResolutionChatProps = {
  isOpen: boolean;
  onClose: () => void;
};

const initialMessages: ChatMessage[] = [];

const CHAT_WIDTH = 380;
const CHAT_HEIGHT_EXPANDED = 520;
const CHAT_HEIGHT_MINIMIZED = 52;
const EDGE_GAP = 16;
const TOP_SAFE_GAP = 76;
const MOBILE_BREAKPOINT = 640;
const MOBILE_EDGE_GAP = 12;
const MOBILE_CHAT_WIDTH = 320;
const MOBILE_CHAT_HEIGHT_EXPANDED = 420;
const MOBILE_TOP_HEADER_HEIGHT = 64;
const DESKTOP_LEFT_SIDEBAR_WIDTH = 240;
const DESKTOP_TOP_HEADER_HEIGHT = 64;

function getChatMetrics() {
  if (typeof window === "undefined") {
    return {
      width: CHAT_WIDTH,
      expandedHeight: CHAT_HEIGHT_EXPANDED,
      minimizedHeight: CHAT_HEIGHT_MINIMIZED,
      edgeGap: EDGE_GAP,
      topGap: TOP_SAFE_GAP,
      isMobile: false,
    };
  }
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  if (!isMobile) {
    return {
      width: CHAT_WIDTH,
      expandedHeight: CHAT_HEIGHT_EXPANDED,
      minimizedHeight: CHAT_HEIGHT_MINIMIZED,
      edgeGap: EDGE_GAP,
      topGap: TOP_SAFE_GAP,
      isMobile: false,
    };
  }
  return {
    width: Math.min(MOBILE_CHAT_WIDTH, Math.max(260, window.innerWidth - MOBILE_EDGE_GAP * 2)),
    expandedHeight: MOBILE_CHAT_HEIGHT_EXPANDED,
    minimizedHeight: CHAT_HEIGHT_MINIMIZED,
    edgeGap: MOBILE_EDGE_GAP,
    topGap: MOBILE_EDGE_GAP,
    isMobile: true,
  };
}

function roleMeta(role: ChatRole) {
  if (role === "buyer") {
    return {
      name: "Buyer",
      bubble: "bg-slate-100 text-slate-800",
      align: "mr-10",
    };
  }

  return {
    name: "MSME",
    bubble: "bg-[#e0f2f1]/50 text-[#0f1b2d] border border-[#cfe8e6]",
    align: "ml-10",
  };
}

function clampPosition(next: Position, minimized: boolean) {
  if (typeof window === "undefined") return next;
  const metrics = getChatMetrics();
  const desktopSafeLeft = DESKTOP_LEFT_SIDEBAR_WIDTH + metrics.edgeGap;
  const minX = metrics.isMobile ? metrics.edgeGap : desktopSafeLeft;
  const minY = metrics.isMobile
    ? MOBILE_TOP_HEADER_HEIGHT + metrics.edgeGap
    : DESKTOP_TOP_HEADER_HEIGHT + metrics.edgeGap;

  const maxX = Math.max(minX, window.innerWidth - metrics.width - metrics.edgeGap);
  const maxY = Math.max(
    minY,
    window.innerHeight - (minimized ? metrics.minimizedHeight : metrics.expandedHeight) - metrics.edgeGap,
  );

  return {
    x: Math.min(Math.max(minX, next.x), maxX),
    y: Math.min(Math.max(minY, next.y), maxY),
  };
}

function getDefaultPosition(minimized: boolean) {
  if (typeof window === "undefined") return { x: EDGE_GAP, y: TOP_SAFE_GAP };
  const metrics = getChatMetrics();
  if (metrics.isMobile) {
    return clampPosition(
      {
        x: Math.round((window.innerWidth - metrics.width) / 2),
        y: Math.round((window.innerHeight - (minimized ? metrics.minimizedHeight : metrics.expandedHeight)) / 2),
      },
      minimized,
    );
  }
  return clampPosition(
    {
      x: window.innerWidth - metrics.width - metrics.edgeGap,
      y: Math.round((window.innerHeight - (minimized ? metrics.minimizedHeight : metrics.expandedHeight)) / 2),
    },
    minimized,
  );
}

export default function DisputeResolutionChat({ isOpen, onClose }: DisputeResolutionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>(() => {
    return getDefaultPosition(false);
  });
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextId = useMemo(
    () => (messages.length > 0 ? messages[messages.length - 1].id + 1 : 1),
    [messages],
  );

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { id: nextId, role: "seller", text }]);
    setDraft("");
  };

  useEffect(() => {
    if (!isOpen || !isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      setPosition(
        clampPosition(
          {
            x: e.clientX - dragOffsetRef.current.x,
            y: e.clientY - dragOffsetRef.current.y,
          },
          isMinimized,
        ),
      );
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [isDragging, isMinimized, isOpen]);

  useEffect(() => {
    if (!isOpen || !scrollerRef.current || isMinimized) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT);
      setPosition(getDefaultPosition(isMinimized));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => setIsEntering(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    },
    [],
  );

  const handleCloseWithAnimation = () => {
    setIsEntering(false);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 220);
  };

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const onResize = () => {
      setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT);
      setPosition((prev) => clampPosition(prev, isMinimized));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  return (
    <section
      className={`fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all duration-300 ease-out ${
        isEntering ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
      }`}
      style={{
        width: isMobileViewport ? "min(320px, calc(100vw - 24px))" : CHAT_WIDTH,
        left: position.x,
        top: position.y,
      }}
    >
      <header
        className="flex cursor-move items-center justify-between bg-[#0f1b2d] px-4 py-2.5 text-white"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button")) return;
          setIsDragging(true);
          dragOffsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
          };
        }}
      >
        <h3 className="text-sm font-semibold">Dispute Resolution Chat</h3>
        <div className="flex items-center gap-3 text-[#cfe8e6]">
          <button
            type="button"
            className={`${isMobileViewport ? "h-7 w-7 text-base" : "h-6 w-6 text-sm"} inline-flex items-center justify-center rounded hover:bg-[#142338]/60 leading-none`}
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            onClick={() => setIsMinimized((prev) => !prev)}
          >
            {isMinimized ? "+" : "-"}
          </button>
          <button
            type="button"
            className={`${isMobileViewport ? "h-7 w-7 text-base" : "h-6 w-6 text-sm"} inline-flex items-center justify-center rounded hover:bg-[#142338]/60 leading-none`}
            aria-label="Close chat"
            onClick={handleCloseWithAnimation}
          >
            x
          </button>
        </div>
      </header>

      {!isMinimized ? (
        <>
          <div className="border-b border-slate-200 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                BP
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">Buyer Procurement</p>
                <p className="text-xs text-slate-500">MSME Admin</p>
              </div>
            </div>
          </div>

          <div ref={scrollerRef} className={`${isMobileViewport ? "h-48" : "h-64"} space-y-2 overflow-y-auto bg-slate-50 px-3 py-3`}>
            {messages.map((msg) => {
              const meta = roleMeta(msg.role);
              return (
                <article key={msg.id} className={`rounded-lg px-3 py-2 text-sm shadow-sm ${meta.bubble} ${meta.align}`}>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide opacity-80">
                    {meta.name}
                  </p>
                  <p>{msg.text}</p>
                </article>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1b5b6a] focus:ring-1 focus:ring-[#1b5b6a]"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#0f1b2d] text-white transition hover:bg-[#142338]"
              aria-label="Send message"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 14-7-4 7 4 7-14-7Z" />
              </svg>
            </button>
          </form>
        </>
      ) : null}
    </section>
  );
}


