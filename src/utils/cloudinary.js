import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


cloudinary.config({ 
  cloud_name: process.env.ClOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localfilePath) => {
  try{
        if(!localfilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload
        (
          localfilePath,{
            resource_type : "auto"
          }
        )
        //file has been uploaded successfully
        console.log("file has been uploaded on cloudinary",
        response.url)
        fs.unlinkSync(localfilePath)
        return response
  }catch(error){
        fs.unlinkSync(localfilePath)
        return null
  }
}

const deleteFromCloudinary = async (public_id) => {
  try {
    const response = await cloudinary.uploader.destroy(public_id)
    return response
  } catch (error) {
    console.log(error)
    return null
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
