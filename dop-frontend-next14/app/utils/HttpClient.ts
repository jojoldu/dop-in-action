export async function hasProduct(productId: string){
  return Promise.resolve(() => {
    return productId === '1';
  });
}
