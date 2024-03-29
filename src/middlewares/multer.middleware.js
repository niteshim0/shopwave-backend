import multer from "multer";


const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "./public/temp");
  },
  filename(req, file, callback) {
    const extName = file.originalname.split(".").pop();
    callback(null, `${extName}`);
  },
});

export const singleUpload = multer({ storage }).single("photo");