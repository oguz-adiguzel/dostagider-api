const bcrypt = require("bcryptjs");
const User = require("../models/User");
const CorporateUser = require("../models/CorporateUser");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const CarListing = require("../models/CarListing");
const { createTransporterAndSend } = require("../utils/sendMail");

const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const logger = require("../utils/logger");
const crypto = require("crypto");
const sendNotification = require("../utils/sendNotification");

const getUserList = async (req, res) => {
  try {
    const users = await User.find().select("-sifre").select("-ilanlar").select("-favoriler");

    res.status(200).json({
      message: "Kullanıcı listesi getirildi",
      users,
    });
  } catch (error) {
    console.error("error", error);
    res
      .status(500)
      .json({ message: "Kullanıcı listesi getirilirken hata oluştu." });
  }
};

const registerUser = async (req, res) => {
  try {
    const { email, sifre, isim, soyisim, telefon, role } = req.body;

    if (!email || !sifre || !isim || !soyisim) {
      await logger.error({
        type: "auth.register.missing_fields",
        message: `Kayıt başarısız: eksik alanlar mevcut`,
        meta: { email, isim, soyisim, telefon, role },
        req,
      });
      return res.status(400).json({ message: "Zorunlu alanları doldurun." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await logger.error({
        type: "auth.register.email_exists",
        message: `Kayıt başarısız: email zaten kayıtlı (${email})`,
        meta: { email },
        req,
      });
      return res.status(409).json({ message: "Bu email zaten kayıtlı." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sifre, salt);

    const simdi = new Date();
    const hesapOlusturmaTarihi = {
      ay: simdi.getMonth() + 1,
      yil: simdi.getFullYear(),
    };

    // 6 haneli doğrulama kodu üret
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const newUser = new User({
      email,
      sifre: hashedPassword,
      isim,
      soyisim,
      telefon,
      hesapOlusturmaTarihi,
      role,
      verificationCode,
    });

    await newUser.save();

    // ⚡ INFO LOG — Kullanıcı oluşturuldu
    await logger.info({
      type: "auth.register.success",
      message: `Yeni kullanıcı kaydı oluşturuldu: ${newUser._id}`,
      meta: {
        email: newUser.email,
        isim: newUser.isim,
        soyisim: newUser.soyisim,
        role: newUser.role,
      },
      req,
      userId: newUser._id,
    });

    // Mail içeriği
    const mailHtml = `
      <h2>Hesap Doğrulama</h2>
      <p>Merhaba ${isim},</p>
      <p>Doğrulama Kodunuz: <b>${verificationCode}</b></p>
      <p>Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın:</p>
      <a href="http://localhost:3000/verify?email=${email}&code=${verificationCode}" target="_blank">Hesabı Doğrula</a>
    `;

    // Ethereal ile test mail gönder
    const { previewUrl } = await createTransporterAndSend({
      to: email,
      subject: "Hesap Doğrulama Kodu (TEST)",
      html: mailHtml,
    });

    res.status(201).json({
      message:
        "Kayıt başarılı. Lütfen emailinize gelen kod ile doğrulama yapın.",
      userId: newUser._id,
      previewUrl,
    });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    // ❌ ERROR LOG — beklenmeyen sistem hatası
    await logger.error({
      type: "auth.register.error",
      message: `Kullanıcı kaydı sırasında sunucu hatası oluştu`,
      meta: { error: error.message },
      req,
    });
    res.status(500).json({ message: "Kullanıcı oluşturulamadı." });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Önce bireysel kullanıcıyı ara
    let user = await User.findOne({ email });
    let isCorporate = false;

    // Eğer bireysel kullanıcı bulunmazsa kurumsal kullanıcıyı ara
    if (!user) {
      user = await CorporateUser.findOne({ email });
      isCorporate = true;
    }

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    if (user.verificationCode != code) {
      return res.status(400).json({ message: "Kod hatalı." });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.status(200).json({
      message: isCorporate
        ? "Kurumsal hesap doğrulandı."
        : "Bireysel hesap doğrulandı.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Doğrulama sırasında hata." });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    console.log("COOKIES:", req.cookies);

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token bulunamadı." });
    }

    // Refresh token'ı doğrula
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Geçersiz veya süresi dolmuş refresh token." });
        }

        const userId = decoded.userId;
        const role = decoded.role; // ✅ Eklenmesi gereken kısım

        // Yeni access token üret
        const newAccessToken = generateAccessToken(userId, role);

        logger.info({
          type: "auth.refresh",
          message: `Access token yenilendi`,
          req,
          userId,
        });

        return res.status(200).json({
          accessToken: newAccessToken,
        });
      },
    );
  } catch (error) {
    console.error("Refresh hatası:", error);

    await logger.error({
      type: "auth.refresh.error",
      message: "Refresh token yenileme sırasında sunucu hatası",
      req,
      userId: null,
      error: error.message,
    });
    res.status(500).json({ message: "Token yenilenemedi." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, sifre } = req.body;

    if (!email || !sifre) {
      return res.status(400).json({ message: "Email ve şifre zorunludur." });
    }

    let user = await User.findOne({ email });
    let userType = "bireysel";

    // ❌ Bireysel bulunamadı → Kurumsal kullanıcıda ara
    if (!user) {
      user = await CorporateUser.findOne({ email });
      userType = "kurumsal";
    }

    if (!user) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    // Email doğrulaması kontrolü (ikisi için de)
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Hesabınız email ile doğrulanmamış.",
      });
    }

    // Admin onayı bekleyen kurumsal hesaplar login olamasın
    if (userType === "kurumsal" && !user.isVerifiedAdmin) {
      return res.status(403).json({
        message: "Hesabınız henüz admin tarafından onaylanmamış.",
      });
    }

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(sifre, user.sifre);
    if (!isMatch) {
      return res.status(401).json({ message: "Email veya şifre hatalı." });
    }

    // Token üret
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id, user.role);

    // Refresh Token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logger.info({
      type: "auth.login",
      message: `Kullanıcı giriş yaptı`,
      meta: {
        email: user.email,
        role: user.role,
      },
      req,
      userId: user._id,
    });

    // Response
    res.status(200).json({
      message: "Giriş başarılı.",
      accessToken,
      userId: user._id,
      role: user.role,
    });
  } catch (error) {
    console.error("Giriş hatası:", error);
    await logger.error({
      type: "auth.login_error",
      message: `Login sırasında beklenmeyen bir hata oluştu`,
      meta: { error: error.message },
      req,
      userId: null,
    });
    res.status(500).json({ message: "Giriş yapılamadı." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email zorunludur." });
    }

    // Hem User hem CorporateUser kontrolü
    let user = await User.findOne({ email });
    let userModel = "User";

    if (!user) {
      user = await CorporateUser.findOne({ email });
      userModel = "CorporateUser";
    }

    // Güvenlik: kullanıcı var/yok belli etme
    if (!user) {
      return res.status(200).json({
        message: "Eğer bu email kayıtlıysa şifre sıfırlama linki gönderildi.",
      });
    }

    // Token üret
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hashleyip DB'ye kaydet (token DB'de düz tutulmaz!)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 dk

    await user.save();

    const resetLink = `http://localhost:3000/sifre-sifirla?token=${resetToken}&email=${email}`;

    const mailHtml = `
      <h2>Şifre Sıfırlama</h2>
      <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
      <a href="${resetLink}" target="_blank">Şifreyi Sıfırla</a>
      <p>Bu link 15 dakika geçerlidir.</p>
    `;

    const { previewUrl } = await createTransporterAndSend({
      to: email,
      subject: "Şifre Sıfırlama",
      html: mailHtml,
    });

    await logger.info({
      type: "auth.forgot_password",
      message: "Şifre sıfırlama talebi oluşturuldu",
      meta: { email },
      req,
      userId: user._id,
    });

    res.status(200).json({
      message: "Şifre sıfırlama linki gönderildi.",
      previewUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    await logger.error({
      type: "auth.forgot_password_error",
      message: "Şifre sıfırlama sırasında hata oluştu",
      meta: { error: error.message },
      req,
    });

    res.status(500).json({ message: "İşlem başarısız." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        message: "Tüm alanlar zorunludur.",
      });
    }

    // Token hashle
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    let user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      user = await CorporateUser.findOne({
        email,
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({
        message: "Token geçersiz veya süresi dolmuş.",
      });
    }

    // Yeni şifre hashle
    const salt = await bcrypt.genSalt(10);
    user.sifre = await bcrypt.hash(newPassword, salt);

    // Token temizle
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    await logger.info({
      type: "auth.reset_password",
      message: "Şifre başarıyla güncellendi",
      meta: { email },
      req,
      userId: user._id,
    });

    res.status(200).json({
      message: "Şifreniz başarıyla güncellendi.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    await logger.error({
      type: "auth.reset_password_error",
      message: "Şifre sıfırlama sırasında hata oluştu",
      meta: { error: error.message },
      req,
    });

    res.status(500).json({ message: "İşlem başarısız." });
  }
};

const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ilanId } = req.body;

    if (!ilanId) {
      return res.status(400).json({
        message: "İlan ID gereklidir.",
      });
    }

    const listing = await CarListing.findById(ilanId);

    if (!listing) {
      return res.status(404).json({
        message: "İlan bulunamadı.",
      });
    }

    let user = await User.findById(userId);

    if (!user) {
      user = await CorporateUser.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    if (
      user.ilanlar &&
      user.ilanlar.some(
        (id) => id.toString() === ilanId
      )
    ) {
      return res.status(400).json({
        message: "Kendi ilanınızı favorilere ekleyemezsiniz.",
      });
    }

    if (
      user.favoriler.some(
        (fav) => fav.ilan.toString() === ilanId
      )
    ) {
      return res.status(400).json({
        message: "Bu ilan zaten favorilerde.",
      });
    }

    user.favoriler.push({
      ilan: ilanId,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "İlan favorilere eklendi.",
    });
  } catch (error) {
    console.error("Favori ekleme hatası:", error);

    res.status(500).json({
      message: "Favori eklenirken hata oluştu.",
    });
  }
};

const getUserInfo = async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("-sifre");

    if (!user) {
      user = await CorporateUser.findById(req.user.id).select("-sifre");
    }

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      message: "Kullanıcı bilgileri getirildi",
      user,
    });
  } catch (error) {
    console.error("Kullanıcı bilgisi çekme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

const checkFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.params;

    if (!listingId) {
      return res.status(400).json({
        message: "İlan ID gereklidir",
      });
    }

    let user = await User.findById(userId).select("favoriler");

    if (!user) {
      user = await CorporateUser.findById(userId).select("favoriler");
    }

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı",
      });
    }

    const isFavorited = user.favoriler.some(
      (fav) => fav.ilan.toString() === listingId
    );

    return res.status(200).json({
      success: true,
      favorited: isFavorited,
    });
  } catch (error) {
    console.error("checkFavoriteStatus error:", error);

    return res.status(500).json({
      message: "Sunucu hatası",
    });
  }
};

const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({
        message: "İlan ID gerekli.",
      });
    }

    let user = await User.findById(userId);

    if (!user) {
      user = await CorporateUser.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    user.favoriler = user.favoriler.filter(
      (fav) => fav.ilan.toString() !== listingId
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message: "İlan favorilerden kaldırıldı.",
      favorites: user.favoriler,
    });
  } catch (error) {
    console.error("Favorilerden kaldırma hatası:", error);

    return res.status(500).json({
      message: "Sunucu hatası.",
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    // Token'dan gelen kullanıcı ID
    const userId = req.user.id;

    // Güncellenebilecek alanları al
    const { isim, soyisim, sehir, ilce, mahalle, telefon } = req.body;

    // Sadece izin verilen alanları güncelle
    const updatedData = {};

    if (isim !== undefined) updatedData.isim = isim;
    if (soyisim !== undefined) updatedData.soyisim = soyisim;
    if (sehir !== undefined) updatedData.sehir = sehir;
    if (ilce !== undefined) updatedData.ilce = ilce;
    if (mahalle !== undefined) updatedData.mahalle = mahalle;
    if (telefon !== undefined) updatedData.telefon = telefon;

    // Kullanıcıyı güncelle
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedData },
      { new: true }, // Güncellenmiş veriyi dönmesi için
    ).select("-sifre"); // Şifreyi geri döndürme

    if (!updatedUser) {
      // ERROR LOG — kullanıcı bulunamadı
      await logger.error({
        type: "user.update.not_found",
        message: `Profil güncelleme başarısız: kullanıcı bulunamadı`,
        req,
        userId,
      });
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // INFO LOG — başarılı güncelleme
    await logger.info({
      type: "user.update.success",
      message: `Kullanıcı profil bilgileri güncellendi`,
      meta: { updatedFields: updatedData },
      req,
      userId,
    });

    res.status(200).json({
      message: "Profil başarıyla güncellendi.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profil güncelleme hatası:", error);
    // ERROR LOG — sunucu hatası
    await logger.error({
      type: "user.update.error",
      message: `Profil güncelleme sırasında hata oluştu`,
      meta: { error: error.message },
      req,
      userId: req.user?.id || null,
    });
    res.status(500).json({ message: "Profil güncellenemedi." });
  }
};

const updateCorporateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Güncellenmesine izin verilen alanlar
    const allowedFields = [
      "galeriAdi",
      "logoUrl",
      "coverPhotoUrl",
      "hakkimizda",
      "telefon",
      "yetkiliAdi",
      "yetkiliSoyadi",
      "sehir",
      "ilce",
      "mahalle",
      "acikAdres",
      "calismaSaatleri",
    ];

    // Body'den gelen verilerde allowedFields'a uygun olanları ekle
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const corporateUser = await CorporateUser.findById(id);
    if (!corporateUser) {
      // LOG — kullanıcı bulunamadı
      await logger.error({
        type: "corporate.update.not_found",
        message: `Kurumsal kullanıcı bulunamadı: ${id}`,
        req,
        meta: { userId: id },
      });
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    // LOGO yükleme işlemi
    if (req.files && req.files.logo && req.files.logo[0]) {
      // Eski logo varsa sil
      if (corporateUser.logoUrl) {
        const publicId = corporateUser.logoUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`kurumsal_logo/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(req.files.logo[0].path, {
        folder: "kurumsal_logo",
        resource_type: "image",
      });
      updateData.logoUrl = result.secure_url;
      fs.unlinkSync(req.files.logo[0].path); // local dosyayı sil
    }

    // COVER yükleme işlemi
    if (req.files && req.files.cover && req.files.cover[0]) {
      if (corporateUser.coverPhotoUrl) {
        const publicId = corporateUser.coverPhotoUrl
          .split("/")
          .pop()
          .split(".")[0];
        await cloudinary.uploader.destroy(`kurumsal_cover/${publicId}`);
      }

      const result = await cloudinary.uploader.upload(req.files.cover[0].path, {
        folder: "kurumsal_cover",
        resource_type: "image",
      });
      updateData.coverPhotoUrl = result.secure_url;
      fs.unlinkSync(req.files.cover[0].path);
    }

    const updatedUser = await CorporateUser.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // LOG — güncelleme başarılı
    await logger.info({
      type: "corporate.update.success",
      message: `Kurumsal kullanıcı güncellendi: ${id}`,
      req,
      userId: id,
      meta: {
        updatedFields: Object.keys(updateData),
        galeriAdi: updateData.galeriAdi || corporateUser.galeriAdi,
      },
    });

    return res.status(200).json({
      message: "Kullanıcı başarıyla güncellendi.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Kurumsal kullanıcı güncelleme hatası:", error);
    // LOG — genel hata
    await logger.error({
      type: "corporate.update.error",
      message: "Kurumsal kullanıcı güncellenirken hata oluştu",
      req,
      meta: { error: error.message },
    });
    return res.status(500).json({ message: "Sunucu hatası", error });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Çıkış başarılı." });
  } catch (error) {
    console.error("Logout hatası:", error);
    res.status(500).json({ message: "Çıkış yapılamadı." });
  }
};

const registerCorporateUser = async (req, res) => {
  try {
    const {
      email,
      sifre,
      galeriAdi,
      telefon,
      yetkiliAdi,
      yetkiliSoyadi,
      vergiDairesi,
      vergiNo,
      sehir,
      ilce,
      mahalle,
    } = req.body;

    // Zorunlu alan kontrolü
    if (
      !email ||
      !sifre ||
      !galeriAdi ||
      !telefon ||
      !yetkiliAdi ||
      !yetkiliSoyadi ||
      !vergiDairesi ||
      !vergiNo ||
      !sehir ||
      !ilce ||
      !mahalle
    ) {
      // LOG — eksik alan uyarısı
      await logger.error({
        type: "corporate.register.validation_error",
        message: `Kurumsal kullanıcı kayıt başarısız: zorunlu alanlar eksik`,
        req,
        meta: { body: req.body },
      });

      return res
        .status(400)
        .json({ message: "Lütfen zorunlu alanları doldurun." });
    }

    // Email ya da Vergi No zaten kayıtlı mı?
    const existingUser = await CorporateUser.findOne({
      $or: [{ email }, { vergiNo }],
    });

    if (existingUser) {
      // LOG — email veya vergi numarası çakışması
      await logger.error({
        type: "corporate.register.already_exists",
        message: `Kurumsal kayıt başarısız: email veya vergi no zaten mevcut`,
        req,
        meta: { email, vergiNo },
      });

      return res
        .status(409)
        .json({ message: "Bu email veya vergi numarası zaten kayıtlı." });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sifre, salt);

    // Hesap oluşturma tarihi
    const simdi = new Date();
    const hesapOlusturmaTarihi = {
      ay: simdi.getMonth() + 1,
      yil: simdi.getFullYear(),
    };

    // 6 haneli doğrulama kodu
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // ✅ slug oluştur
    const baseSlug = galeriAdi
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s-]/gi, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Aynı slug varsa sonuna numara ekle
    let slug = baseSlug;
    let slugExists = await CorporateUser.findOne({ slug });
    let counter = 1;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await CorporateUser.findOne({ slug });
      counter++;
    }

    const newUser = new CorporateUser({
      email,
      sifre: hashedPassword,
      galeriAdi,
      telefon,
      yetkiliAdi,
      yetkiliSoyadi,
      vergiDairesi,
      vergiNo,
      sehir,
      ilce,
      mahalle,
      hesapOlusturmaTarihi,
      verificationCode,
      role: "kurumsal",
      slug,
    });

    await newUser.save();

    // Mail içeriği
    const mailHtml = `
      <h2>Hesap Doğrulama</h2>
      <p>Merhaba ${galeriAdi},</p>
      <p>Doğrulama Kodunuz: <b>${verificationCode}</b></p>
      <p>Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın:</p>
      <a href="http://localhost:3000/verify?email=${email}&code=${verificationCode}" target="_blank">Hesabı Doğrula</a>
    `;

    // Ethereal ile test mail gönder
    const { previewUrl } = await createTransporterAndSend({
      to: email,
      subject: "Hesap Doğrulama Kodu (TEST)",
      html: mailHtml,
    });

    // LOG — kurumsal kayıt başarılı
    await logger.info({
      type: "corporate.register.success",
      message: `Yeni kurumsal kullanıcı oluşturuldu: ${galeriAdi}`,
      req,
      userId: newUser._id,
      meta: {
        slug,
        email,
        vergiNo,
        yetkili: `${yetkiliAdi} ${yetkiliSoyadi}`,
      },
    });

    res.status(201).json({
      message: "Kayıt başarılı. Mail doğrulama adımını tamamlamanız gerekiyor.",
      userId: newUser._id,
      slug, // frontend'te gerekirse kullanabilirsin
      previewUrl,
    });
  } catch (error) {
    console.error("Kurumsal kayıt hatası:", error);

    // LOG — Sunucu hatası
    await logger.error({
      type: "corporate.register.error",
      message: `Kurumsal kullanıcı kayıt sırasında hata oluştu.`,
      req,
      meta: { error: error.message },
    });

    res.status(500).json({ message: "Kayıt işlemi başarısız." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  addToFavorites,
  getUserInfo,
  checkFavoriteStatus,
  removeFromFavorites,
  updateUserProfile,
  logoutUser,
  verifyUser,
  registerCorporateUser,
  updateCorporateUser,
  forgotPassword,
  resetPassword,
  getUserList
};
