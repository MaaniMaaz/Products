const cloudinary = require("cloudinary");
const streamifier = require("streamifier");

cloudinary.v2.config({
  cloud_name: "******",
  api_key: "*********",
  api_secret: "**********",
});

const uploadStreamImage = async (image, public_id) => {
  return new Promise((resolve, reject) => {
    const cloud = cloudinary.v2.uploader.upload_stream(
      { folder: "ufa_media", public_id },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(image).pipe(cloud);
  });
};

const deleteImage = async (url) => {
  const public_id = `ufa_media${url.split("ufa_media")[1].split(".")[0]}`;
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.destroy(public_id, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  deleteImage,
  uploadStreamImage,
};
