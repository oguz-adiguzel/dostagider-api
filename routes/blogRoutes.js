const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const cacheMiddleware = require("../middleware/cacheMiddleware");


const { createBlog, getAllBlogs, getBlogBySlug, deleteBlog, updateBlog } = require("../controllers/blogController");
const upload = require("../middleware/multer");

router.post("/", upload.single("image"), createBlog);

router.get("/",cacheMiddleware(300), getAllBlogs);

router.get("/blog-detay/:slug",getBlogBySlug );

router.delete('/blog-sil',authMiddleware(["admin"]), deleteBlog)

router.put("/blog-guncelle",authMiddleware(["admin"]), updateBlog);

module.exports = router;
