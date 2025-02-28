import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },

    // file name generation 
    filename: function (req, file, cb) {
        cb(null, file.originalname)
        }
    // incase you want to generate a unique file name
    // filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
    // }
  })
  
export  const upload = multer(
    { 
        storage: storage 
    }
)