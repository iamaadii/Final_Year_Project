import Notification from "@/models/Notification";
import redis from "@/lib/redis";
import { requireAuth } from "@/lib/api/routeUtils";

function sse(data, event = "message") {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const channel = `notifications:${String(auth.user._id)}`;
  const encoder = new TextEncoder();
  let subscriber = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const push = (payload, event) => {
        if (closed) return;
        controller.enqueue(encoder.encode(sse(payload, event)));
      };

      push({ connected: true, channel, ts: Date.now() }, "connected");

      try {
        const latest = await Notification.find({ userId: String(auth.user._id), companyId: auth.companyId })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
        push({ items: latest }, "snapshot");
      } catch {
        push({ items: [] }, "snapshot");
      }

      const heartbeat = setInterval(() => {
        push({ ts: Date.now() }, "heartbeat");
      }, 15000);

      req.signal.addEventListener("abort", async () => {
        closed = true;
        clearInterval(heartbeat);
        try {
          if (subscriber) {
            await subscriber.unsubscribe(channel);
            await subscriber.quit();
          }
        } catch {
          // no-op on shutdown
        }
        controller.close();
      });

      if (redis?.duplicate) {
        subscriber = redis.duplicate();
        subscriber.on("message", (_ch, message) => {
          try {
            push(JSON.parse(message), "notification");
          } catch {
            push({ raw: message }, "notification");
          }
        });
        await subscriber.subscribe(channel);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
