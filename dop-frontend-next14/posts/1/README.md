# 프론트엔드 환경에서의 Domain Oriented Observability

프론트엔드 개발을 하다보면 각종 지표를 보내야 하는 일이 많다.  
대표적으로 GTM (Google Tag Manager), Mixpanel 등의 마케팅 도구들을 활용한 지표 전달이다.  
이들을 활용해서 사용자의 행동 흐름을 추적하고 여러 퍼널들을 분석한다.  
  
서비스의 규모가 커짐에 따라 사용자의 이벤트 하나 하나에 대한 지표를 전달하는 행위는 많아지며,  
시간이 갈수록 비즈니스 로직 보다 지표 전달 코드가 훨씬 더 많은 파일들이 하나둘씩 생성된다.  
비즈니스를 다뤄야하는 코드가 종국에는 지표 전달 코드에 잡아먹히게 되는 셈이다.  

이번 글에서는 이러한 혼란을 정리하고 깔끔하고 테스트 가능한 방식으로 비즈니스 관련된 지표를 전달하는 방법을 소개한다.

## 문제

> 모든 코드는 [Github](https://github.com/jojoldu/dop-in-action/tree/master/dop-frontend-next14)에 있다.


```tsx
export default function CartPage() {
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    mixpanel.track("product_apply_remove_cart", {
      productId: product.id,
    });

    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));

      if(product.type === ProductType.FOOD) {
        gtmAnalytics.track("click_remove_cart_food");
      }

      mixpanel.track("product_removed_cart", {
        productId: product.id,
        name: product.name,
        price: product.price,
        productType: product.type
      });
    } catch (e) {
      logger.error(`Remove Cart Exception: productId=${product.id}`);
      mixpanel.track("product_removed_cart_failure", {
        productId: product.id,
      });
    }
  };

  return (
    <div>
      <h1>Cart Page</h1>
      <Link href="/">Home</Link>
      <ul>
        {cart.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price} |
            <button onClick={() => removeFromCart(product)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 리팩토링 1

첫번째 리팩토링은 각 지표 전송 코드를 함수로 분리하는 것이다.

```tsx
function applyingRemove(product: Product) {
  mixpanel.track("product_apply_remove_cart", {
    productId: product.id
  });
}

function sendRemoveMetric(product: Product) {
  if (product.type === ProductType.FOOD) {
    gtmAnalytics.track("click_remove_cart_food");
  }

  mixpanel.track("product_removed_cart", {
    productId: product.id,
    name: product.name,
    price: product.price,
    productType: product.type
  });
}

function sendRemoveFailure(product: Product) {
  logger.error(`Remove Cart Exception: productId=${product.id}`);
  mixpanel.track("product_removed_cart_failure", {
    productId: product.id
  });
}

export default function CartPage() {
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    applyingRemove(product);
    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      sendRemoveMetric(product);
    } catch (e) {
      sendRemoveFailure(product);
    }
  };

  return (
    <div>
      <h1>Cart Page</h1>
      <Link href="/">Home</Link>
      <ul>
        {cart.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price} |
            <button onClick={() => removeFromCart(product)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

가장 중요한 것은 "**지표 전송 코드가 과연 CartPage의 책임인가**" 인 것이다.  
지표 전송 코드는 CartPage 비즈니스 로직과는 아무런 관련이 없다.  


## 리팩토링 2

```tsx
export default function CartPage3() {
  const probe = container.resolve(CartProbe);

  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    probe.applyingRemove(product);

    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      probe.remove(product);
    } catch (e) {
      probe.removeFailure(product);
    }
  };

  return (
    <div>
      <h1>Cart Page</h1>
      <Link href="/">Home</Link>
      <ul>
        {cart.map(product => (
          <li key={product.id}>
            {product.name} - ${product.price} |
            <button onClick={() => removeFromCart(product)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```




