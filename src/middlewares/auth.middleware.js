import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminOnly = asyncHandler( async(req,res,next) => {
  const { id } = req.query;

  if (!id) {
    throw new ApiError(400, 'User ID is required');
  }
  
  const user = await User.findById(id)

  if (!user || user.role !== 'admin') {
    throw new ApiError(403, 'Access denied. Admins only.');
  }
  next();
})