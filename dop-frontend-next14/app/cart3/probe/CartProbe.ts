import { singleton } from "tsyringe";
import { logger, Logger } from "@/app/utils/Logger";
import { Product, ProductType } from "@/app/product/Product";
import { Mixpanel } from "@/app/utils/Mixpanel";
import { GtmAnalytics } from "@/app/utils/GtmAnalytics";
import mixpanel from "mixpanel-browser";

@singleton()
export class CartProbe {
  private readonly logger: Logger;
  private readonly gtmAnalytics: GtmAnalytics;
  private readonly mixpanel: Mixpanel;

  constructor(logger: Logger, gtmAnalytics: GtmAnalytics, mixpanel: Mixpanel) {
    this.logger = logger;
    this.gtmAnalytics = gtmAnalytics;
    this.mixpanel = mixpanel;
  }

  public applyingRemove(product: Product) {
    mixpanel.track("product_apply_remove_cart", {
      productId: product.id
    });
  }

  public remove(product: Product): void {
    if(product.type === ProductType.FOOD) {
      this.gtmAnalytics.track("click_remove_cart_food");
    }

    this.mixpanel.track("product_removed_cart", {
      productId: product.id,
      name: product.name,
      price: product.price,
      productType: product.type
    });
  }

  public removeFailure(product: Product) {
    logger.error(`Remove Cart Exception: productId=${product.id}`);
    mixpanel.track("product_removed_cart_failure", {
      productId: product.id
    });
  }
}
