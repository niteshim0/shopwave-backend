import { Product } from "../models/product.model.js";

const getInventories  = async ({ categories, productsCount }) => {
  const categoriesCount = await Promise.all(
    categories.map((category) => Product.countDocuments({ category }))
  );

  const categoryCount = categories.map((category, i) => ({
    [category]: Math.round((categoriesCount[i] / productsCount) * 100),
  }));

  return categoryCount;
}


export {getInventories}