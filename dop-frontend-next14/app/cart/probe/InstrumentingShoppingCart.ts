interface IShoppingCart {
  applyDiscountCode(discountCode: number): number;
}

class DiscountInstrumentation {
  applyingDiscountCode(discountCode: number) {

  }

  discountCodeLookupSucceeded(discountCode: number) {

  }

  discountApplied(discountAmount: number) {

  }

  discountCodeLookupFailed(discountCode: number, error: unknown) {

  }
}

export class InstrumentingShoppingCart implements IShoppingCart {
  private readonly component: IShoppingCart;
  private readonly instrumentation: DiscountInstrumentation;

  constructor(component: IShoppingCart, instrumentation: DiscountInstrumentation) {
    this.component = component;
    this.instrumentation = instrumentation;
  }

  applyDiscountCode(discountCode: number): number {
    this.instrumentation.applyingDiscountCode(discountCode);
    try {
      const discountAmount = this.component.applyDiscountCode(discountCode);
      this.instrumentation.discountCodeLookupSucceeded(discountCode);
      this.instrumentation.discountApplied(discountAmount);
      return discountAmount;
    } catch (error) {
      this.instrumentation.discountCodeLookupFailed(discountCode, error);
      return 0;
    }
  }
}
