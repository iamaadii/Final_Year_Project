"use client";

import NotificationsInbox from "@/app/_components/NotificationsInbox";

export default function SellerNotificationsPage() {
  return <NotificationsInbox dashboardHref="/seller/dashboard" storageKey="sellerNotifications" title="Notifications" />;
}
