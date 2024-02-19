# 프론트엔드 환경에서의 Domain Oriented Observability

프론트엔드 개발을 하다보면 각종 지표를 보내야 하는 일이 많다.  
대표적으로 GTM (Google Tag Manager), Mixpanel 등의 마케팅 도구들을 활용한 지표 전달이다.  
이들을 활용해서 사용자의 행동 흐름을 추적하고 여러 퍼널들을 분석한다.  
  
서비스의 규모가 커짐에 따라 사용자의 이벤트 하나 하나에 대한 지표를 전달하는 행위는 많아지며,  
시간이 갈수록 비즈니스 로직 보다 지표 전달 코드가 훨씬 더 많은 파일들이 하나둘씩 생성된다.  
비즈니스를 다뤄야하는 코드가 종국에는 지표 전달 코드에 잡아먹히게 되는 셈이다.  

이번 글에서는 이러한 혼란을 정리하고 깔끔하고 테스트 가능한 방식으로 비즈니스 관련된 지표를 전달하는 방법을 소개한다.

> 이 글은 [Pete Hodgson](https://blog.thepete.net/about/)가 [martinfowler 블로그에 기재한 글](https://martinfowler.com/articles/domain-oriented-observability.html)을 많이 참고했다.   

## 문제

> 모든 코드는 [Github](https://github.com/jojoldu/dop-in-action/tree/master/dop-frontend-next14)에 있다.

예를 들어 다음과 같이 My 장바구니 페이지가 있다고 가정해보자.

- (메인 비즈니스) My 장바구니에 담긴 상품을 제거할 수 있다.
- My 장바구니에 담긴 상품을 **삭제를 시도하면 Mixpanel에 지표를 전송**해야 한다.
- My 장바구니에서 **삭제한 상품이 음식일 경우에는 GTM에 지표를 전송**해야 한다.
- My 장바구니에서 **삭제가 성공하면 Mixpanel에 지표를 전송**해야 한다.
- My 장바구니에 담긴 상품을 삭제하는 도중에 오류가 발생하면 로그를 남겨야 한다.
- My 장바구니에 담긴 상품을 삭제하는 도중에 오류가 발생하면 Mixpanel에 별도의 지표를 전송해야 한다.


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

이 CartPage에서 **비즈니스 로직은 과연 무엇일까**에 대해 생각해보자.  
50라인의 코드 중에서 비즈니스 로직은 **단 2줄이다**.

- `httpClient.removeProduct(product.id);`
- `setCart(cart.filter(p => p.id !== product.id));`

이 중 14라인은 뷰 코드이다.  
나머지 라인은 **지표 전송, 로깅 코드**이다.  
  
즉, 주요 로직인 비즈니스 로직과 렌더링 코드보다 부가적인 코드인 지표 전송, 로깅의 코드가 훨씬 더 많다.  
지표와 관련된 로직만 따로 분리할 수 있다면, 비즈니스 로직과 렌더링 코드에만 집중할 수 있다.  
  
이들을 분리해보자.  

## 리팩토링 1

첫번째 리팩토링은 각 지표 전송 코드를 **각각의 함수로 추출**하는 것이다.

```tsx
function applyingRemove(product: Product) {
  mixpanel.track("product_apply_remove_cart", {
    productId: product.id
  });
}

function sendRemovedMetric(product: Product) {
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
    applyingRemove(product); // (1)
    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      sendRemovedMetric(product); // (2)
    } catch (e) {
      sendRemoveFailure(product); // (3)
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

총 3개의 함수로 분리했다.

- (1) `applyingRemove(product);`
- (2) `sendRemovedMetric(product);`
- (3) `sendRemoveFailure(product);`

이렇게 리팩토링한 코드의 장점은 다음과 같다.

- 인지 부하 감소
  - 비즈니스 로직이 아닌 지표 전송 코드의 세부 구현을 굳이 신경쓰지 않아도 된다.
  - 그건 해당 함수 내부에서 처리해야할 일이 되었다.
- 코드 수정이 쉬워졌다.
  - 특정 로그나 지표를 전송하는 방법을 변경해야 하는 경우 비즈니스 코드를 신경 쓰지 않고 특정 함수만 수정하면 된다.
- 명시적인 의도
  - 모든 전송 로직에 이름이 붙은 함수가 되어 의도를 명확하게 할 수 있게 되었다.

함수를 추출만 하여도 위와 같은 장점을 얻었다.  
다만 그럼에도 몇가지 단점이 있다.

- 테스트 코드 작성이 어렵고 복잡하다.
  - 내부에서 직접 호출하는 함수는 항상 Mocking이 필요하다. 
  - 이는 상태 검증을 하기가 어렵다는 것이며 행위 검증으로 검증 방법이 제한됨을 의미하기도 한다.
- CartPage는 여전히 복잡하다.
  - 지표 전송 로직은 CartPage의 책임이 아니다.
  - 그럼에도 여전히 비공개 함수들이 CartPage 전체에서 활용된다.
  - CartPage가 가져야할 비공개 함수들은 **CartPage의 비즈니스 로직들을 담고 있는 함수**들이어야 한다.

리팩토링 1의 장점은 가져가면서 단점은 해결한 방법을 적용해보자.

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

새로운 구현은 원래 구현과 비교할 때 몇 가지 이점이 있습니다.

계측 문제를 특정 위치로 그룹화합니다.
InventoryProbe에는 인벤토리 요구 사항에 필요한 모든 계측 관련 코드가 포함되어 있습니다. 따라서 계측된 항목이 무엇인지 알아야 하는 경우 구체적으로 해당 지점으로 이동할 수 있습니다.





비업무용 코드 감소
이 인위적인 예에서도 예상되는 관찰 가능성 목표를 달성하기 위해 Inventory 클래스에 더 적은 코드를 작성할 수 있었습니다.

여기서 logger 까지도 과연 probe 대상으로 둬야하는 것인가에 대해서는 이견의 여지가 있다.  
이유는 애플리케이션에 **로그를 추가하는 것이 더 불편해지기 떄문**이다.  
catch 로직에서 정상적인 로깅이 되어있는지 직관적으로 알 수 없으며, 혹시나 놓치는 로깅이 발생할 수도 있다.  

그래서 logger는 probe 대상에서 제외하고 지표 전송만을 포함하는 것도 좋은 방법이다.  




