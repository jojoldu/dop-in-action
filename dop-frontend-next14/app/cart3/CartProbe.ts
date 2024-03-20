import { Product } from "@/app/product/Product";

interface CartProbe {
  applyingRemove: (product: Product) => void;
  remove: (product: Product) => void;
  removeFailure: (product: Product) => void;
}
