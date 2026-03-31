import Notification from "@/models/Notification";
import redis from "@/lib/redis";

/**
 * Sends an in-app notification by saving to DB and publishing to Redis for real-time SSE.
 * 
 * @param {Object} params
 * @param {string} params.userId - The target user ID
 * @param {string} params.companyId - The target company ID
 * @param {string} params.type - Enum type of the notification
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification message body
 * @param {string} [params.priority] - low, medium, high, critical
 * @param {string} [params.actionUrl] - Optional link for the frontend
 */
export async function sendNotification({ userId, companyId, type, title, body, priority = "medium", actionUrl = null }) {
  try {
    const notif = await Notification.create({
      userId,
      companyId,
      type,
      title,
      body,
      priority,
      actionUrl,
    });

    // Publish to Redis channel for real-time delivery
    if (redis) {
      const channel = `notifications:${userId}`;
      await redis.publish(channel, JSON.stringify(notif));
    }

    return notif;
  } catch (error) {
    console.error("[NotificationService] Failed to send notification:", error);
    return null;
  }
}
