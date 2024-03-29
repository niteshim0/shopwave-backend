import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { nodeCache } from "../app.js";
import { invalidateCache } from "../utils/cacheInvalidator.js";


const newProduct = asyncHandler( async (req,res,next)=> {

  const {name,category,price,stock} = req.body

  if(
    [name,category,price,stock].some((field)=> field?.trim() === "")
  ){
    throw new ApiError(400,"All fields are required")
  }
 
  const photoLocalPath = req.file?.path
  
  if(!photoLocalPath){
    throw new ApiError(404,"Photo  local copy is missing")
  }

  const photo = await uploadOnCloudinary(photoLocalPath)

  console.log(photo);
  
  if(!photo){
    throw new ApiError(400,"Error while uploading the product photo on cloudinary")
  }
  
  const product = await Product.create({
    name,
    price,
    stock,
    category : category.toLowerCase(),
    photo : photo?.url
  })

  await invalidateCache({product:true})

  return res.status(201).json(
    new ApiResponse(
      200,
      product,
      "New Product is created successfully")
  )
  next()
})

const getLatestProducts = asyncHandler (async(req,res) =>{
  let latestProducts
  
  if(nodeCache.has("latest-products")){
    latestProducts = JSON.parse(nodeCache.get("latest-products"))
  }else{
    latestProducts = await Product.find().sort({ createdAt: -1 }).limit(5);

    if(!latestProducts){
      throw new ApiError(404,"we can't find the latestProducts")
    }

    nodeCache.set("latest-products",JSON.stringify(latestProducts))
  }
  

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    latestProducts,
    "latestProducts has been fetched successfully"
  ))
})

const getAllCategories = asyncHandler( async(req,res) => {
  let categories;

  if (nodeCache.has("categories")) {
    categories = JSON.parse(nodeCache.get("categories"))
  } else {
    categories = await Product.distinct("category")

    if(!categories){
      throw new ApiError(400,"Error while fetching the category")
    }

    nodeCache.set("categories",JSON.stringify(categories))
  }
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    categories,
    "categories has been retrieved successfully"
  ))
})

const getAdminProducts = asyncHandler(async(req,res,next)=>{
  let products;
  if (nodeCache.has("all-products")) {
    products = JSON.parse(nodeCache.get("all-products"))
  } else {
    products = await Product.find({});

    if(!products){
      throw new ApiError(404,"We can't able to find the admin products")
    }

    nodeCache.set("all-products", JSON.stringify(products));
  }
 
  return res
  .status(200)
  .json(new ApiResponse(
    200,
    products,
    "Admin Products has been retrieved"
  ))
})

const getSingleProduct = asyncHandler (async(req,res) => {
   const id = req.params?.id;
   let product
   if (nodeCache.has(`product-${id}`)) {
       product = JSON.parse(nodeCache.get(`product-${id}`))
   } else {
      product = await Product.findById(id);

      if(!product){
        throw new ApiError(404,"Single Product is not found")
      }

      nodeCache.set(`product-${id}`,JSON.stringify(product))
   }
   

   return res
   .status(200)
   .json(new ApiResponse(
    200,
    product,
    "Single Product has been retrieved successfully"
   ))
})

const updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, price, stock, category } = req.body;

  try {
    let photoUrl;

    // Check if a photo is included in the request
    // its possible that the photo is not included in the request
    if (req.file && req.file.path) {
      const photo = await uploadOnCloudinary(req.file.path);

      if (!photo) {
        throw new ApiError(400, "Error while uploading the product photo on Cloudinary");
      }

      photoUrl = photo.url;
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, "Product can't be updated since we can't find it");
    }

    // Update product properties if provided in the request
    if (name) product.name = name;
    if (typeof price !== 'undefined') product.price = price;
    if (typeof stock !== 'undefined') product.stock = stock;
    if (category) product.category = category;
    if (photoUrl) product.photo = photoUrl;

    await product.save();
    await invalidateCache({ product: true });

    return res.status(200).json(new ApiResponse(
      200,
      product,
      "Product updated successfully"
    ));
  } catch (error) {
    next(error);
  }
});


const deleteProduct = asyncHandler(async (req, res, next) => {
  
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product is not found, so how can it be deleted?");
  }

  // Delete the product photo from Cloudinary
  // await deletePhotoFromCloudinary(product.photo);

  await product.deleteOne();
  await invalidateCache({product:true})
  
  return res
    .status(204)
    .json(
      new ApiResponse(
        204,
        {},
        "Product deleted successfully"
      )
    );
});

const getAllProducts = asyncHandler(async(req,res,next)=>{
 const {search,sort,category,price} = req.query;
 const page = Number(req.query.page) || 1;
 const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;

 const skip = (page-1) * limit;

 const baseQuery = {};

 if(search){
  baseQuery.name  = {
    $regex : search,
    $options : "i",
  }
 }

 if(price){
  baseQuery.price  = {
    $lte : Number(price),
  }
 }

 if (category) baseQuery.category = category;

  const productsPromise = Product.find(baseQuery)
    .sort(sort && { price: sort === "asc" ? 1 : -1 })
    .limit(limit)
    .skip(skip)

  const filteredProductsCount = await Product.countDocuments(baseQuery)

  const totalPage = Math.ceil(filteredProductsCount / limit)

  const products = await productsPromise

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {products,totalPage},
      "Product fetched according to query")
  )
})



export {newProduct , getLatestProducts ,getAllCategories , getAdminProducts , getSingleProduct , updateProduct , deleteProduct , getAllProducts}