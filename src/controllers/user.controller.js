import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const newUser = asyncHandler( async (req,res)=> {

  const {name,email,photo,gender,dob} = req.body


  if(
    [name,email,photo,gender,dob].some((field)=> field?.trim() === "")
  ){
     return res.status(400).json(
        {
          "statusCode": 400,
          "message": "All fields are required",
        }
     )
  }
  
  const existedUser = await User.findOne({ email : email });
  
  if(existedUser){
    return res.status(201).json(
      new ApiResponse(
        200,
        `Welcome ${existedUser?.name}`,
        `Welcome back! ${existedUser?.name}`
      )
    )
  }

  const user = await User.create({
    name,
    email,
    photo,
    gender,
    dob: new Date(dob)
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500,"Internal Servor Erorr in registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200,createdUser,`Welcome ${user?.name}`)
  )
})

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  
  return res.status(200).json(
    new ApiResponse(
      200,
      {users},
      "All users retrived successfully"
    )
  );
});

const getUser = asyncHandler( async (req,res) => {
    
  const id = req.params.id;

  const user =  await User.findOne({ email : `${id}` });

  if(!user){
    throw new ApiError(
        401,"user not found may be id is invalid",
    )
  }
  
  return res.status(200).json(
    new ApiResponse(
      200,
      {user},
      "User has been retrieved successfully"
    )
  )
})

const deleteUser = asyncHandler( async (req,res) => {
    
  const id = req.params.id;
  const user =  await User.findOne({ email : `${id}` });

  if(!user){
    throw new ApiError(
        401,"user not found may be id is invalid",
    )
  }
   
  await user.deleteOne()

  return res.status(204).json(
    new ApiResponse(
      200,
      "user deleted successfully"
    )
  )
})


export {newUser,getAllUsers,getUser,deleteUser};