import { render, fireEvent, waitFor } from '@testing-library/react';
import CartPage from '../app/cart/page';
import { GtmAnalytics } from "@/app/utils/GtmAnalytics";

jest.mock('./GtmAnalytics', () => ({
  GtmAnalytics: jest.fn().mockImplementation(() => ({
    track: jest.fn()
  })),
  gtmAnalytics: new GtmAnalytics()
}));

jest.mock('./HttpClient', () => {
  return {
    HttpClient: jest.fn().mockImplementation(() => ({
      myCart: new Map(),
      getProducts: jest.fn().mockImplementation(() => Array.from(this.myCart.values())),
      removeProduct: jest.fn().mockImplementation((productId) => this.myCart.delete(productId)),
      addProduct: jest.fn().mockImplementation((product) => this.myCart.set(product.id, product))
    })),
    httpClient: new this.HttpClient()
  };
});

describe('CartPage 컴포넌트', () => {
  it('상품 목록을 불러와 렌더링한다', async () => {
    const mockProducts = [
      { id: 1, name: '제품 A', price: 1000 },
      { id: 2, name: '제품 B', price: 2000 }
    ];
    services.httpClient.getProducts.mockResolvedValue(mockProducts);

    const { findByText } = render(<CartPage />);
    const itemA = await findByText('제품 A - $1000');
    const itemB = await findByText('제품 B - $2000');

    expect(itemA).toBeInTheDocument();
    expect(itemB).toBeInTheDocument();
  });

  it('제품 제거 버튼을 클릭하면 제품이 목록에서 사라진다', async () => {
    const mockProducts = [
      { id: 1, name: '제품 A', price: 1000, type: 'FOOD' }
    ];
    services.httpClient.getProducts.mockResolvedValue(mockProducts);
    services.httpClient.removeProduct.mockResolvedValue();

    const { getByText, queryByText } = render(<CartPage />);
    const removeButton = getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(queryByText('제품 A - $1000')).not.toBeInTheDocument();
    });
    expect(services.httpClient.removeProduct).toHaveBeenCalledWith(1);
    expect(services.mixpanel.track).toHaveBeenCalledWith('product_removed_cart', expect.any(Object));
    expect(services.gtmAnalytics.track).toHaveBeenCalledWith('click_remove_cart_food');
  });
});
