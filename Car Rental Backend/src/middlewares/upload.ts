import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../helpers/config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "vehicles",
    allowed_formats: ["jpg", "jpeg", "png"],
  } as any,
});

// // Extra safety: validate file type
// const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
//   if (
//     file.mimetype === "image/jpeg" ||
//     file.mimetype === "image/png" ||
//     file.mimetype === "image/jpg"
//   ) {
//     cb(null, true);
//   } else {
//     cb(new Error("Only image files are allowed"));
//   }
// };

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  //  fileFilter,
});

export default upload;
