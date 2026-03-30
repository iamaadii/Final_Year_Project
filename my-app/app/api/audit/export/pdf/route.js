import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import AuditLog from "@/models/AuditLog";
import { requireAuth, errorResponse } from "@/lib/api/routeUtils";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

function drawLine(page, text, x, y, size = 10, font) {
  page.drawText(String(text || ""), {
    x,
    y,
    size,
    font,
    color: rgb(0.07, 0.1, 0.18),
  });
}

export async function GET(req) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const companyId = auth.companyId;
  if (!companyId) {
    return errorResponse("FORBIDDEN", "Company ID missing", 403, auth.requestId);
  }

  const logs = await AuditLog.find({ companyId })
    .sort({ timestamp: -1 })
    .limit(200)
    .lean();

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 64;

  const addHeader = () => {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 52, width: PAGE_WIDTH, height: 52, color: rgb(0.06, 0.11, 0.18) });
    page.drawText("NEXUS THREE", { x: 32, y: PAGE_HEIGHT - 30, size: 14, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText("Audit Log Export", { x: PAGE_WIDTH - 160, y: PAGE_HEIGHT - 30, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    y = PAGE_HEIGHT - 80;
    drawLine(page, `Exported: ${new Date().toLocaleString("en-IN")}`, 32, y, 10, font);
    drawLine(page, `Total events: ${logs.length}`, PAGE_WIDTH - 180, y, 10, font);
    y -= 22;
    page.drawRectangle({ x: 32, y, width: PAGE_WIDTH - 64, height: 18, color: rgb(0.93, 0.95, 0.98) });
    drawLine(page, "Timestamp", 38, y + 5, 9, fontBold);
    drawLine(page, "Action", 160, y + 5, 9, fontBold);
    drawLine(page, "User", 320, y + 5, 9, fontBold);
    drawLine(page, "Resource", 450, y + 5, 9, fontBold);
    y -= 16;
  };

  addHeader();

  for (const log of logs) {
    if (y < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      addHeader();
    }

    const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : "-";
    const action = log.action || "-";
    const userName = log.userName || "System";
    const resource = log.resource || "-";

    drawLine(page, timestamp, 38, y, 8, font);
    drawLine(page, action, 160, y, 8, font);
    drawLine(page, userName, 320, y, 8, font);
    drawLine(page, resource, 450, y, 8, font);
    y -= 14;
  }

  const pdfBytes = await pdfDoc.save();
  const fileName = `audit-log-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${fileName}\"`,
      "X-Request-ID": auth.requestId || crypto.randomUUID(),
    },
  });
}
