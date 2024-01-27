export enum ProductType {
  BOOK = "BOOK",
  FOOD = "FOOD",
  CLOTHING = "CLOTHING"
}
export class Product {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _price: number;
  private readonly _type: ProductType;

  constructor(id: string, name: string, price: number, type: ProductType) {
    this._id = id;
    this._name = name;
    this._price = price;
    this._type = type;
  }

  static of (id: string, name: string, price: number, type: ProductType) {
    return new Product(id, name, price, type);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  get type(): ProductType {
    return this._type;
  }
}
