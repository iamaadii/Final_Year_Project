import type { Model, UpdateQuery, Types } from "mongoose";

export type TenantScopedDocument = {
  _id?: Types.ObjectId | string;
  [key: string]: unknown;
};

type QueryFilter<T> = Partial<T> & Record<string, unknown>;

type FindManyOptions<T> = {
  projection?: Partial<Record<keyof T, 0 | 1>>;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
};

export class BaseRepository<T extends TenantScopedDocument> {
  protected readonly model: Model<T>;
  protected readonly tenantKey: string;

  constructor(model: Model<T>, tenantKey = "tenantId") {
    this.model = model;
    this.tenantKey = tenantKey;
  }

  protected tenantFilter(tenantId: string, filter: QueryFilter<T> = {}) {
    return {
      ...filter,
      [this.tenantKey]: tenantId,
    } as QueryFilter<T>;
  }

  async findById(tenantId: string, id: string) {
    return this.model.findOne(this.tenantFilter(tenantId, { _id: id } as QueryFilter<T>)).lean<T>().exec();
  }

  async findOne(tenantId: string, filter: QueryFilter<T>) {
    return this.model.findOne(this.tenantFilter(tenantId, filter)).lean<T>().exec();
  }

  async findMany(tenantId: string, filter: QueryFilter<T> = {}, options: FindManyOptions<T> = {}) {
    const query = this.model.find(this.tenantFilter(tenantId, filter), options.projection || null);

    if (options.sort) query.sort(options.sort);
    if (typeof options.skip === "number") query.skip(options.skip);
    if (typeof options.limit === "number") query.limit(options.limit);

    return query.lean<T[]>().exec();
  }

  async count(tenantId: string, filter: QueryFilter<T> = {}) {
    return this.model.countDocuments(this.tenantFilter(tenantId, filter)).exec();
  }

  async create(tenantId: string, data: Partial<T>) {
    const payload = {
      ...data,
      [this.tenantKey]: tenantId,
    } as Partial<T>;

    const doc = await this.model.create(payload);
    return doc.toObject() as T;
  }

  async updateById(tenantId: string, id: string, update: UpdateQuery<T>) {
    return this.model
      .findOneAndUpdate(this.tenantFilter(tenantId, { _id: id } as QueryFilter<T>), update, {
        new: true,
      })
      .lean<T>()
      .exec();
  }

  async deleteById(tenantId: string, id: string) {
    const doc = await this.model
      .findOneAndDelete(this.tenantFilter(tenantId, { _id: id } as QueryFilter<T>))
      .lean<T>()
      .exec();

    return Boolean(doc);
  }
}
