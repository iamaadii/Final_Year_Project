import { EventEmitter } from "events";
import { Types, type Model, type UpdateQuery } from "mongoose";
import Invoice from "@/models/Invoice";
import { connectDB } from "@/lib/db/client";
import { BaseRepository } from "@/lib/db/repository";
import { AppError, NotFoundError } from "@/lib/api/errors";
import type { TenantScopedDocument } from "@/lib/db/repository";

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type InvoiceRecord = {
  _id: string;
  companyId: string;
  invoiceNumber: string;
  sellerId: string;
  buyerId: string;
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  issueDate: Date;
  deliveryDate: Date;
  dueDate: Date;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  lineItems: LineItem[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type InvoiceEntity = TenantScopedDocument & {
  _id?: string;
  companyId: string | Types.ObjectId;
  invoiceNumber: string;
  sellerId: string | Types.ObjectId;
  buyerId: string | Types.ObjectId;
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  issueDate: Date;
  deliveryDate: Date;
  dueDate: Date;
  currency: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  lineItems: LineItem[];
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateInvoiceInput = {
  invoiceNumber: string;
  sellerId: string;
  buyerId: string;
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  issueDate: string;
  deliveryDate: string;
  dueDate: string;
  currency?: string;
  status?: string;
  lineItems: LineItem[];
  notes?: string;
};

export type UpdateInvoiceInput = Partial<
  Pick<CreateInvoiceInput, "deliveryDate" | "dueDate" | "lineItems" | "notes" | "buyerName" | "buyerEmail" | "status">
>;

export class InvoiceService extends EventEmitter {
  private repository: BaseRepository<InvoiceEntity>;

  constructor() {
    super();
    this.repository = new BaseRepository(Invoice as unknown as Model<InvoiceEntity>, "companyId");
  }

  private ensureObjectId(value: string, fieldName: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new AppError(`${fieldName} is invalid`, 400, "INVALID_OBJECT_ID");
    }

    return new Types.ObjectId(value);
  }

  private sanitizeLineItems(items: LineItem[]) {
    if (!items || items.length === 0) {
      throw new AppError("lineItems are required", 400, "VALIDATION_ERROR");
    }

    return items.map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);
      const total = Number(item.total || quantity * unitPrice);

      return {
        description: String(item.description || "").trim(),
        quantity,
        unitPrice,
        total,
      };
    });
  }

  private computeTotals(items: LineItem[]) {
    const subtotalAmount = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const taxAmount = 0;
    const totalAmount = subtotalAmount + taxAmount;

    return { subtotalAmount, taxAmount, totalAmount };
  }

  async createInvoice(tenantId: string, input: CreateInvoiceInput, actorId: string) {
    await connectDB();

    const tenantObjectId = this.ensureObjectId(tenantId, "tenantId");
    const sellerObjectId = this.ensureObjectId(input.sellerId, "sellerId");
    const buyerObjectId = this.ensureObjectId(input.buyerId, "buyerId");
    const lineItems = this.sanitizeLineItems(input.lineItems);
    const totals = this.computeTotals(lineItems);

    const invoice = await this.repository.create(String(tenantObjectId), {
      companyId: tenantObjectId,
      invoiceNumber: input.invoiceNumber,
      sellerId: sellerObjectId,
      buyerId: buyerObjectId,
      sellerName: input.sellerName,
      sellerEmail: input.sellerEmail,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      issueDate: new Date(input.issueDate),
      deliveryDate: new Date(input.deliveryDate),
      dueDate: new Date(input.dueDate),
      currency: (input.currency || "INR").toUpperCase(),
      subtotalAmount: totals.subtotalAmount,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      lineItems,
      notes: input.notes || "",
      status: "Pending Approval",
      auditTrail: [
        {
          action: "invoice_created",
          userId: sellerObjectId,
          userName: input.sellerName,
          details: `Created by ${actorId}`,
          timestamp: new Date(),
        },
      ],
      isDeleted: false,
    });

    this.emit("invoice.created", {
      tenantId,
      actorId,
      invoiceId: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
    });

    return invoice as InvoiceRecord;
  }

  async getInvoice(tenantId: string, invoiceId: string) {
    await connectDB();

    const tenantObjectId = this.ensureObjectId(tenantId, "tenantId");
    const invoice = await this.repository.findById(String(tenantObjectId), invoiceId);

    if (!invoice || invoice.isDeleted) {
      throw new NotFoundError("Invoice not found");
    }

    return invoice as InvoiceRecord;
  }

  async listInvoices(tenantId: string, page = 1, pageSize = 20) {
    await connectDB();

    const tenantObjectId = this.ensureObjectId(tenantId, "tenantId");
    const safePage = Math.max(page, 1);
    const safePageSize = Math.min(Math.max(pageSize, 1), 100);
    const skip = (safePage - 1) * safePageSize;

    const [items, total] = await Promise.all([
      this.repository.findMany(String(tenantObjectId), { isDeleted: false }, {
        sort: { createdAt: -1 },
        skip,
        limit: safePageSize,
      }),
      this.repository.count(String(tenantObjectId), { isDeleted: false }),
    ]);

    return {
      items: items as InvoiceRecord[],
      page: safePage,
      pageSize: safePageSize,
      total,
    };
  }

  async updateInvoice(tenantId: string, invoiceId: string, updates: UpdateInvoiceInput, actorId: string) {
    await connectDB();

    const tenantObjectId = this.ensureObjectId(tenantId, "tenantId");
    const updatePayload: Record<string, unknown> = {};

    if (updates.deliveryDate) updatePayload.deliveryDate = new Date(updates.deliveryDate);
    if (updates.dueDate) updatePayload.dueDate = new Date(updates.dueDate);
    if (updates.notes !== undefined) updatePayload.notes = updates.notes;
    if (updates.buyerName) updatePayload.buyerName = updates.buyerName;
    if (updates.buyerEmail) updatePayload.buyerEmail = updates.buyerEmail;
    if (updates.status) updatePayload.status = updates.status;

    if (updates.lineItems) {
      const lineItems = this.sanitizeLineItems(updates.lineItems);
      const totals = this.computeTotals(lineItems);
      updatePayload.lineItems = lineItems;
      updatePayload.subtotalAmount = totals.subtotalAmount;
      updatePayload.taxAmount = totals.taxAmount;
      updatePayload.totalAmount = totals.totalAmount;
    }

    updatePayload.$push = {
      auditTrail: {
        action: "invoice_updated",
        userId: actorId,
        userName: actorId,
        details: "Invoice updated via API",
        timestamp: new Date(),
      },
    };

    const updated = await this.repository.updateById(
      String(tenantObjectId),
      invoiceId,
      updatePayload as UpdateQuery<InvoiceEntity>,
    );

    if (!updated) {
      throw new NotFoundError("Invoice not found");
    }

    this.emit("invoice.updated", {
      tenantId,
      actorId,
      invoiceId,
    });

    return updated as InvoiceRecord;
  }

  async deleteInvoice(tenantId: string, invoiceId: string, actorId: string) {
    await connectDB();

    const tenantObjectId = this.ensureObjectId(tenantId, "tenantId");
    const deleted = await this.repository.updateById(String(tenantObjectId), invoiceId, {
      $set: { isDeleted: true },
      $push: {
        auditTrail: {
          action: "invoice_deleted",
          userId: actorId,
          userName: actorId,
          details: "Soft deleted",
          timestamp: new Date(),
        },
      },
    });

    if (!deleted) {
      throw new NotFoundError("Invoice not found");
    }

    this.emit("invoice.deleted", {
      tenantId,
      actorId,
      invoiceId,
    });

    return { deleted: true };
  }
}
