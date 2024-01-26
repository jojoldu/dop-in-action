export class InstrumentingShoppingCart implements IShoppingCart {
  private readonly IShoppingCart;
  component;
  private readonly DiscountInstrumentation;
  instrumentation;

  constructor(component, instrumentation) {
    this.component = component;
    this.instrumentation = instrumentation;
  }

  applyDiscountCode(discountCode: number): number {
    this.instrumentation.applyingDiscountCode(discountCode);
    try {
      var discountAmount = component.applyDiscountCode(discountCode);
      this.instrumentation.discountCodeLookupSucceeded(discountCode);
      this.instrumentation.discountApplied(discountAmount);
      return discountAmount;
    } catch (error) {
      this.instrumentation.discountCodeLookupFailed(discountCode, error);
      return 0;
    }
  }
}
