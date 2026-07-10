const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
      required: true,
    },
     slug: {
      type: String,
      unique: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    // Türkçe karakterler
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    // özel karakterleri temizle
    .replace(/[^a-z0-9\s-]/g, "")
    // boşlukları tire yap
    .trim()
    .replace(/\s+/g, "-")
    // birden fazla tireyi tek tire yap
    .replace(/-+/g, "-");
};

blogSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return next();

  const baseSlug = generateSlug(this.title);
  let slug = baseSlug;
  let count = 1;

  while (await mongoose.models.Blog.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  this.slug = slug;
  next();
});

module.exports = mongoose.model("Blog", blogSchema);
