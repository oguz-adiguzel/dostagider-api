const Blog = require("../models/Blog");
const sharp = require("sharp");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const { log } = require("console");
const { deleteCacheByPattern } = require("../utils/cache");

const createBlog = async (req, res) => {
  try {
    const { title, category, text } = req.body;
    const file = req.file;

    if (!title || !category || !text) {
      return res.status(400).json({ message: "Zorunlu alanları doldurunuz." });
    }

    if (!file) {
      return res.status(400).json({ message: "Blog için görsel gereklidir." });
    }

    const optimizedPath = file.path + "-optimized.webp";

    await sharp(file.path)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(optimizedPath);

    const uploadResult = await cloudinary.uploader.upload(optimizedPath, {
      folder: "blogs",
      transformation: [{ fetch_format: "webp" }, { quality: "auto:eco" }],
    });

    const newBlog = await Blog.create({
      title,
      category,
      text,
      imageUrl: uploadResult.secure_url,
    });

    await deleteCacheByPattern("cache:/blogs*");

    return res.status(201).json({
      message: "Blog başarıyla eklendi.",
      data: newBlog,
    });
  } catch (error) {
    console.error("Blog oluşturulurken hata:", error);
    res.status(500).json({ message: "Blog oluşturulurken bir hata oluştu." });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.status(200).json({ data: blogs });
  } catch (error) {
    console.error("Blog çekme hatası:", error);
    res.status(500).json({ message: "Bloglar alınamadı", error });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug });
    res.status(200).json({ data: blog });
  } catch (error) {
    console.error("Blog çekme hatası:", error);
    res.status(500).json({ message: "Blog alınamadı", error });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { slug } = req.query;

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return res.status(404).json({ message: "Blog bulunamadı." });
    }

    if (blog.imageUrl) {
      try {
        await cloudinary.uploader.destroy(blog.imageUrl);
      } catch (err) {
        console.error("Cloudinary silme hatası:", err);
      }
    }

    await Blog.deleteOne({ slug });
    await deleteCacheByPattern("cache:/blogs*");

    res.status(200).json({
      message: `${blog.title} başarıyla silindi`,
    });
  } catch (error) {
    conseole.error("Blog silme hatası");
    res.status(500).json({ message: "Blog silinirken hata oluştu", error });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({
        message: "Blog slug bilgisi zorunludur.",
      });
    }

    const allowedFields = ["title", "text"];

    const updateData = {};

    // Sadece gönderilen alanları update objesine ekle
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "Güncellenecek herhangi bir alan gönderilmedi.",
      });
    }

    const blog = await Blog.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { new: true }, // güncellenmiş halini döner
    );

    await deleteCacheByPattern("cache:/blogs*");

    res.status(200).json({
      message: "Blog başarıyla güncellendi.",
      blog,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Blog güncellenirken hata oluştu", error });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  deleteBlog,
  updateBlog
};
