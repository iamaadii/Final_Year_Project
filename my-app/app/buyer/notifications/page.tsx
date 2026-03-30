"use client";

import NotificationsInbox from "@/app/_components/NotificationsInbox";

export default function BuyerNotificationsPage() {
  return <NotificationsInbox dashboardHref="/buyer/dashboard" storageKey="buyerNotifications" title="Notifications" />;
}
