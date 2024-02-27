# 1. 프론트엔드 환경에서의 Domain Oriented Observability - 

프론트엔드 개발을 하다보면 각종 지표를 보내야 하는 일이 많다.  
대표적으로 GTM (Google Tag Manager), Mixpanel 등의 마케팅 도구들을 활용한 지표 전달이다.  
이들을 활용해서 사용자의 행동 흐름을 추적하고 여러 퍼널들을 분석한다.  
  
서비스의 규모가 커짐에 따라 사용자의 이벤트 하나 하나에 대한 지표를 전달하는 행위는 많아지며,  
시간이 갈수록 비즈니스 로직 보다 지표 전달 코드가 훨씬 더 많은 파일들이 하나둘씩 생성된다.  
비즈니스를 다뤄야하는 코드가 종국에는 지표 전달 코드에 잡아먹히게 되는 셈이다.  

이번 글에서는 이러한 혼란을 정리하고 깔끔하고 테스트 가능한 방식으로 비즈니스 관련된 지표를 전달하는 방법을 소개한다.

> 이 글은 [Pete Hodgson](https://blog.thepete.net/about/)가 [martinfowler 블로그에 기재한 글](https://martinfowler.com/articles/domain-oriented-observability.html)을 많이 참고했다.   
> (martinfowler가 쓴 글은 아니다)

## 1. 문제

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

> Mixpannel 및 GTM과 같은 지표 전송 도구들은 실제로는 외부 서비스이다.  
> 여기서는 약식으로만 임시 구현을 한 상태이다.

이 CartPage에서 **비즈니스 로직은 과연 무엇일까**?    
살펴보면 아래 2개이다.  

- `httpClient.removeProduct(product.id);`
- `setCart(cart.filter(p => p.id !== product.id));`

50라인의 코드 중에서 비즈니스 로직은 **단 2줄이다**.
이 중 14라인은 뷰 코드이다.  
나머지 라인은 **지표 전송, 로깅 코드**이다.  
  
즉, 주요 로직인 비즈니스 로직과 렌더링 코드보다 **부가적인 코드인 지표 전송, 로깅의 코드가 훨씬 더 많다**.  
이로 인해 실제로 중요하게 다루고 분석해야할 로직에 집중하기 어려운 코드가 되었다.  
지표와 관련된 로직만 따로 분리할 수 있다면, 메인 로직 (비즈니스와 렌더링) 코드에만 집중할 수 있다.  
  
그 외 외부의 영향을 받는 코드들로 인해 테스트 코드 작성이 어렵다.  
지표 전송 코드는 외부에 의존하고 있기 때문에 테스트 코드 작성이 어렵다.  
  
단점이 대단히 많은 이 코드를 개선해보자.  

## 2. 리팩토링 - 함수 추출

첫번째 리팩토링은 각 지표 전송 코드를 **각각의 함수로 추출**하는 것이다.

```tsx
function sendApplyingRemoveMetric(product: Product) {
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

function sendRemoveFailureMetric(product: Product) {
  logger.error(`Remove Cart Exception: productId=${product.id}`);
  mixpanel.track("product_removed_cart_failure", {
    productId: product.id
  });
}

export default function CartPage() {
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    sendApplyingRemoveMetric(product);
    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      sendRemovedMetric(product);
    } catch (e) {
      sendRemoveFailureMetric(product);
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

- (1) `sendApplyingRemoveMetric`
- (2) `sendRemovedMetric`
- (3) `sendRemoveFailureMetric`

이렇게 리팩토링한 코드의 장점은 다음과 같다.

- **추상화 계층으로 인한 인지 부하 감소**
  - 지표 전송 코드를 함수로 추출함으로써 지표 전송 코드를 추상화할 수 있게 되었다.
  - Mixpanel 로 보내던 지표를 Amplitude 와 같은 다른 트래킹 도구로 전송한다고 해서 메인 비즈니스 로직을 수정할 필요가 없다.
  - 해당 함수 내부에서 처리할 일이 되었다.
- **쉬워진 코드 수정**
  - 특정 로그나 지표를 전송하는 방법을 변경해야 하는 경우 비즈니스 코드를 신경 쓰지 않고 특정 함수만 수정하면 된다.
- **명시적인 의도**
  - 모든 전송 로직에 이름이 붙은 함수가 되어 의도를 명확하게 할 수 있게 되었다.

함수를 추출만 하여도 위와 같은 장점을 얻었다.  
다만 그럼에도 몇가지 단점이 있다.

- 테스트 코드 작성이 여전히 어렵고 복잡하다.
  - 순수하지 않은 함수 (외부에 의존하는 함수)를 직접 호출하는 코드는 항상 Mocking이 필요하다. 
  - 추출된 함수들을 직접 호출하기 때문에 이들은 전부 특별한 테스트 도구를 활용하여야만 Mocking 할 수 있다.  
  - 특히 상태 검증 하기가 너무 어렵고 행위 검증으로 방법이 제한됨을 의미한다.
- CartPage는 여전히 복잡하다.
  - 지표 전송 로직은 CartPage의 책임이 아니다.
  - 그럼에도 여전히 비공개 함수들이 CartPage 전체에서 활용된다.
  - CartPage가 가져야할 비공개 함수들은 **CartPage의 비즈니스 로직들을 담고 있는 함수**들이어야 한다.

JavaScript 테스트 생태계 (Jest) 만의 특이점으로 직접 호출한 함수도 Mocking 이 가능한데, 

리팩토링 1의 장점은 가져가면서 단점은 해결한 방법을 적용해보자.

> jest를 통한 Module Mocking이 있는데 왜 테스트가 어려운지는 다음 글에서 이야기한다.

## 3. 리팩토링 - 의존성 주입

두번째 리팩토링은 의존성 주입 패턴을 사용하는 것이다.  
  
의존성 주입 패턴은 테스트 하기 편한 환경을 구성하고, 모듈 혹은 컴포넌트 간 낮은 결합도를 유지해서 확장성, 코드 재사용성, 유지보수성을 높일 수 있는 보편적인 패턴이다.

- [Dependency injection - wikipedia](https://en.wikipedia.org/wiki/Dependency_injection)
- [Dependency Injection in React: A Good Guide](https://medium.com/@matthill8286/dependency-injection-in-react-a-good-guide-with-code-examples-4afc8adc6cdb)

이는 크게 2가지로 구현 가능하다

- Props를 활용한 방법
- Context API와 Hooks를 활용한 방법
- 의존성 컨테이너를 활용한 방법


### 3-1. 의존성 주입 - Props

```ts
interface CartProbe {
  applyingRemove: (product: Product) => void;
  remove: (product: Product) => void;
  removeFailure: (product: Product) => void;
}
```

```tsx
interface CartPage4Props {
  probe: CartProbe; // 의존성 주입을 위한 Props
}

export default function CartPage4({ probe }: CartPage4Props) {
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

  // JSX는 이전 예제와 동일하므로 생략
}
```

### 3-2. 의존성 주입 - Context API & Hooks

위 코드를 의존성 컨테이너가 아닌 Context API와 Hooks로 개선해본다면 어떨까?

Context API와 Hooks를 활용해서 코드를 작성해보면 다음과 같다.

```tsx
// CartProbeContext.tsx

interface CartProbe {
  applyingRemove: (product: Product) => void;
  remove: (product: Product) => void;
  removeFailure: (product: Product) => void;
}

const defaultProbe: CartProbe = {
  applyingRemove: (product: Product) => {},
  remove: (product: Product) => {},
  removeFailure: (product: Product) => {},
};

const CartProbeContext = createContext<CartProbe>(defaultProbe);

export const CartProbeProvider: React.FC = ({ children }) => {
  const probe = {
    applyingRemove: (product: Product) => {
      ...
    },
    remove: (product: Product) => {
      ...
    },
    removeFailure: (product: Product) => {
      ...
    },
  };

  return <CartProbeContext.Provider value={probe}>{children}</CartProbeContext.Provider>;
};

export const useCartProbe = () => useContext(CartProbeContext);
```

작성된 코드를 활용해서 CartPage를 리팩토링하면 다음과 같다.

```tsx
// CartPage4.tsx
export default function CartPage4() {
  const { applyingRemove, remove, removeFailure } = useCartProbe();
  const [cart, setCart] = useState<Product[]>(httpClient.getProducts);

  const removeFromCart = async (product: Product) => {
    applyingRemove(product);

    try {
      httpClient.removeProduct(product.id);
      setCart(cart.filter(p => p.id !== product.id));
      remove(product);
    } catch (e) {
      removeFailure(product);
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

Context API와 Hooks를 통한 리팩토링은 다음과 같은 장점을 얻는다.

- React 생태계 일관성 
  - React의 기본 기능을 사용하여 구현되므로, React 생태계와의 일관성 유지 
- 간소화된 의존성 관리
  - Context API를 사용하여 애플리케이션 전반에 걸쳐 의존성을 쉽게 공유
- 낮은 러닝 커브
  - 별도의 의존성 라이브러리를 배울 필요가 없고 프로젝트 전반의 설정이 필요없다.

다만, 의존성 컨테이너와 비교하여 단점은 다음과 같다.

- 목적에 맞지 않는 Context 오용
  - Context 는 주로 상태 관리에 사용되는데 지금의 기능은 **상태가 전혀 없고 행위 (함수) 관리가 필요한 상황**이다.
  - Context를 통해 상태와 행위가 모두 관리 받는 상황이라 프로젝트가 커질수록 오용될 가능성이 높다.
- 성능 이슈
  - 이번과 같이 자주 사용되는 함수의 집합체는 많은 컴포넌트가 사용할 확률이 높으며 하나의 컨텍스트를 많은 컴포넌트가 사용한다면 성능 이슈가 발생할 수 있다.

특히 프로젝트의 규모가 점점 커질수록 (대규모 애플리케이션) 의존성 주입 컨테이너를 활용하는 것이 유리하다.  
이러한 라이브러리는 의존성을 보다 체계적이고 구조화된 방식으로 관리하기 위한 다양한 기능과 유연성을 제공하기 때문이다.  

### 3-3. 의존성 주입 - 의존성 컨테이너

의존성 주입 컨테이너와 **관측 전용 객체** (Probe) 를 활용해서 리팩토링 하면 다음과 같다.

```ts
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
    this.mixpanel.track("product_apply_remove_cart", {
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
    this.logger.error(`Remove Cart Exception: productId=${product.id}`);
    this.mixpanel.track("product_removed_cart_failure", {
      productId: product.id
    });
  }
}
```

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

- 계측 객체로 그룹


- 계측 문제를 특정 위치로 그룹화한다.
  - InventoryProbe에는 인벤토리 요구 사항에 필요한 모든 계측 관련 코드가 포함되어 있다.
  - 따라서 계측된 항목이 무엇인지 알아야 하는 경우 구체적으로 해당 지점으로 이동할 수 있다.

- 비업무용 코드 감소
  - 이 인위적인 예에서도 예상되는 관찰 가능성 목표를 달성하기 위해 Inventory 클래스에 더 적은 코드를 작성할 수 있다.

여기서 logger 까지도 과연 probe 대상으로 둬야하는 것인가에 대해서는 이견의 여지가 있다.  
이유는 애플리케이션에 **로그를 추가하는 것이 더 불편해지기 떄문**이다.  
catch 로직에서 정상적인 로깅이 되어있는지 직관적으로 알 수 없으며, 혹시나 놓치는 로깅이 발생할 수도 있다.

그래서 logger는 probe 대상에서 제외하고 지표 전송만을 포함하는 것도 좋은 방법이다.

## 결론

