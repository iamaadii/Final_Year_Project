import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Notification from "@/models/Notification";
import { getRedisClient } from "@/lib/cache/redis";

export async function runComplianceAgent() {
  await dbConnect();
  const redis = getRedisClient();

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find all unpaid invoices with MSMED deadlines in next 30 days
  const atRiskInvoices = await Invoice.find({
    status: { $nin: ['paid', 'Paid', 'cancelled', 'Cancelled', 'settled', 'Settled'] },
    msmedDeadline: { $gte: today, $lte: thirtyDaysFromNow },
    isDeleted: false,
  }).populate('buyerId sellerId');

  let notified = 0;
  let skipped = 0;
  let draftsQueued = 0;

  for (const invoice of atRiskInvoices) {
    if (!invoice.msmedDeadline) continue;

    const daysUntilBreach = Math.ceil((invoice.msmedDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let priority: 'high' | 'critical' = 'high';
    let type = '';
    let title = '';
    let body = '';

    if (daysUntilBreach <= 7) {
      priority = 'critical';
      type = 'compliance_critical';
      title = `⚠️ MSMED breach in ${daysUntilBreach} day${daysUntilBreach === 1 ? '' : 's'}`;
      body = `Invoice ${invoice.invoiceNumber} (₹${(invoice.totalAmount || 0).toLocaleString('en-IN')}) from ${invoice.sellerName} breaches 43B(h) on ${invoice.msmedDeadline.toLocaleDateString('en-IN')}. Penalty accrual begins immediately.`;
    } else if (daysUntilBreach <= 15) {
      priority = 'high';
      type = 'compliance_warning';
      title = `MSMED deadline in ${daysUntilBreach} days`;
      body = `Invoice ${invoice.invoiceNumber} from ${invoice.sellerName} is due for MSMED compliance by ${invoice.msmedDeadline.toLocaleDateString('en-IN')}.`;
    } else {
      skipped += 1;
      continue; // No notification needed for >15 days
    }

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const existingToday = await Notification.findOne({
      entityId: invoice._id.toString(),
      type,
      createdAt: { $gte: todayStart }
    });
    
    if (existingToday) {
      skipped += 1;
      continue;
    }

    const buyerIdStr = invoice.buyerId && typeof invoice.buyerId === 'object' && '_id' in invoice.buyerId 
      ? invoice.buyerId._id.toString() 
      : String(invoice.buyerId);

    const notification = await Notification.create({
      userId: buyerIdStr,
      companyId: invoice.companyId,
      type, 
      priority, 
      title, 
      body,
      entityType: 'invoice',
      entityId: invoice._id.toString(),
      actionUrl: `/buyer/compliance?invoice=${invoice._id}`,
    });

    if (redis) {
      const channel = `notifications:${notification.userId}`;
      await redis.publish(channel, JSON.stringify(notification));
    }

    notified += 1;
    
    // Auto-generate Samadhaan draft for critical invoices
    if (daysUntilBreach <= 7) {
      invoice.samadhaanDraftId = "PENDING_DRAFT_GEN";
      await invoice.save();
      draftsQueued += 1;
      // Typically we would enqueue a job to generate the draft here
    }
  }

  return {
    scanned: atRiskInvoices.length,
    notified,
    skipped,
    draftsQueued,
  };
}
