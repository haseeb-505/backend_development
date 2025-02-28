import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file to cloudinary
       const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("File uploaded successfully on cloudinary !!", response.url);
        fs.unlinkSync(localFilePath); // remove the locally saved temp file
        return response.url;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temp file as upload failed
    }
}

export {uploadToCloudinary};