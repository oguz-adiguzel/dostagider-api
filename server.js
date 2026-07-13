require("dotenv").config();
const express = require("express");
// const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const carOptionRoute = require("./routes/carOptionRoute");
const evCarOptionRoute = require("./routes/electricCarOptionRoute")
const carListingRoute = require("./routes/carListingRoutes");
const userRoute = require("./routes/userRoutes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger"); // Yeni eklenen dosya
const adminRoutes = require("./routes/adminRoutes");
const corporateRoutes = require("./routes/corporateRoutes");
const carBrandRoute = require("./routes/carBrandRoute");
const carBodyTypeRoute = require("./routes/carBodyTypeRoute");
const showcaseRoute = require("./routes/showcaseRoutes");
const dashboardRoute = require("./routes/dashboardRoute");
const conversationRoute = require("./routes/conversationRoutes");
const messageRoute = require("./routes/messageRoutes");
const corporateFeaturedRoute = require("./routes/featuredGalleryRoutes");
const brandPriceListRoute = require("./routes/brandPriceListRoute");
const blogRoute = require("./routes/blogRoutes");
const packageRoute = require("./routes/packageRoute");
const vehicleStockRoute = require("./routes/vehicleStockRoutes");
const aiRoutes = require("./routes/ai.route");
const notificationRoutes = require("./routes/notificationRoute");
const listingReportRoutes = require("./routes/listingReportRoute");
const initAdmin = require("./utils/initAdmin"); // ✅ ekledik
const mongoose = require("mongoose");
const { connectRedis } = require("./config/redis");

const http = require("http");
const socket = require("./socket");

// require("dotenv").config();

const app = express();
app.use(cookieParser());

// MongoDB bağlantısı
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB bağlantısı başarılı");
    await initAdmin(); // ✅ Admin kontrolü burada yapılır
  })
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

  

connectRedis();


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001" ], // Next.js app'in adresi
    credentials: true, // cookie gönderebilmek için
  }),
);
app.use(morgan("dev"));

require("./cron/showcaseCron");
require("./cron/listingExpireJob");
require("./cron/viewTrackCleanup");
require("./cron/cleanOldLogs");
require("./cron/featuredGalleryCron");
require("./cron/priceCheckCron");
require("./cron/checkPriceSources");

// Routes
app.use("/car-options", carOptionRoute);
app.use("/ev-car-options", evCarOptionRoute);
app.use("/ilan", carListingRoute);
app.use("/users", userRoute);
app.use("/admin", adminRoutes);
app.use("/corporate", corporateRoutes);
app.use("/car-brands", carBrandRoute);
app.use("/body-types", carBodyTypeRoute);
app.use("/vitrin", showcaseRoute);
app.use("/dashboard", dashboardRoute);
app.use("/conversations", conversationRoute);
app.use("/messages", messageRoute);
app.use("/galleryFeatured", corporateFeaturedRoute);
app.use("/price-lists", brandPriceListRoute);
app.use("/blogs", blogRoute);
app.use("/package", packageRoute);
app.use("/ai", aiRoutes);
app.use('/vehicle-stock', vehicleStockRoute)
app.use('/bildirim', notificationRoutes)
app.use('/report', listingReportRoutes)


const formatUptime = () => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "dostagider-api",
    version: "1.0.0",
    uptime: formatUptime(),
    message: "API is running",
    timestamp: new Date(),
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
socket.init(server);

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});

module.exports = app;