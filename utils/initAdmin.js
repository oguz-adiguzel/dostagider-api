const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const initAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️  ADMIN_EMAIL veya ADMIN_PASSWORD .env dosyasında tanımlı değil.");
      return;
    }

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("✅ Admin hesabı zaten mevcut:", existingAdmin.email);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = new Admin({
      email: adminEmail,
      sifre: hashedPassword,
      isim: "Sistem Yöneticisi",
    });

    await newAdmin.save();

    console.log("🎉 Yeni admin hesabı oluşturuldu:");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Parola: (env üzerinden ayarlandı, log’lanmadı)`);

  } catch (error) {
    console.error("❌ Admin oluşturulurken hata:", error);
  }
};

module.exports = initAdmin;