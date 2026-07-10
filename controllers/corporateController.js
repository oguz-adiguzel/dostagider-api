const CorporateUser = require("../models/CorporateUser");
const CarListing = require("../models/CarListing");
const cloudinary = require("../config/cloudinary");
const sharp = require("sharp");
const fs = require("fs");

const getCorporateUserDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    const corporateUser = await CorporateUser.findOne({ slug })
      .select("-sifre -verificationCode") // gizli alanları çıkar
      .populate({
        path: "ilanlar",
        select:
          "ilanNo baslik price brand model variant1 variant2 variant3 ilanTarihi gorseller isEV category",
        options: { sort: { ilanTarihi: -1 } }, // en yeni ilan en üstte
      });

    if (!corporateUser) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({
      success: true,
      message: "Kurumsal kullanıcı bilgileri getirildi.",
      user: corporateUser,
    });
  } catch (error) {
    console.error("Kurumsal kullanıcı bilgisi çekme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

const addTeam = async (req, res) => {
  try {
    const { slug } = req.params;
    const { ad, soyad, gorev, telefon } = req.body;
    const foto = req.file; // multer ile gelen dosya

    const user = await CorporateUser.findOne({ slug });
    if (!user) return res.status(404).json({ message: "Galeri bulunamadı" });

    let fotoUrl = null;
    let publicId = null;

    const optimizedPath = foto.path + "-optimized.webp";

    if (foto) {

      await sharp(foto.path)
        .resize({
          width: 1600, // büyük fotoğrafları küçültüyoruz
          withoutEnlargement: true,
        })
        .webp({ quality: 70 }) // kalite azalt → 12MB → 600KB
        .toFile(optimizedPath);

      // 📁 galeri adı ile özel klasör
      const uploadResult = await cloudinary.uploader.upload(optimizedPath, {
        folder: `galeriler/${user.galeriAdi}/ekip`,
      });
      fotoUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }

    // Yeni ekip üyesini ekle
    user.ekip.push({
      ad,
      soyad,
      gorev,
      telefon,
      fotoUrl,
      publicId,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Ekip üyesi eklendi.",
      ekip: user.ekip,
    });
  } catch (error) {
    console.error("Ekip üyesi ekleme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

const getCorporateTeam = async (req, res) => {
  try {
    const { slug } = req.params;

    // Galeriyi slug ile bul
    const corporateUser = await CorporateUser.findOne({ slug }).select(
      "galeriAdi ekip"
    );

    if (!corporateUser) {
      return res.status(404).json({
        success: false,
        message: "Galeri bulunamadı.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ekip üyeleri başarıyla getirildi.",
      galeriAdi: corporateUser.galeriAdi,
      ekip: corporateUser.ekip,
    });
  } catch (error) {
    console.error("Ekip bilgisi çekme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const { slug, memberId } = req.params;

    const user = await CorporateUser.findOne({ slug });
    if (!user) return res.status(404).json({ message: "Galeri bulunamadı" });

    const member = user.ekip.id(memberId);
    if (!member)
      return res.status(404).json({ message: "Ekip üyesi bulunamadı" });

    // 📷 Cloudinary'den fotoğrafı sil
    if (member.publicId) {
      try {
        await cloudinary.uploader.destroy(member.publicId);
      } catch (err) {
        console.error("Cloudinary silme hatası:", err);
      }
    }

    // 🗑 MongoDB'den ekip üyesini kaldır
    user.ekip.pull({ _id: memberId });
    await user.save();

    res.status(200).json({
      success: true,
      message: "Ekip üyesi başarıyla silindi.",
      ekip: user.ekip,
    });
  } catch (error) {
    console.error("Ekip üyesi silme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

const payment = async (req, res) => {
  try {
     const { slug } = req.body;
 
     const user = await CorporateUser.findOne({slug});
     if (!user) {
       return res.status(404).json({ message: "Kullanıcı bulunamadı." });
     }

     if(user.isPayment === true){
      return res.status(404).json({message : "Daha önce ödeme yapılmıştır."})
     }
 
     user.isPayment = true;
     await user.save();
 
     res.status(200).json({ message: "Ödeme başarıyla gerçekleşti Admin onayından sonra giriş yapabilirsiniz." });
   } catch (error) {
     console.error("Ödeme hatası:", error);
     res.status(500).json({ message: "Ödeme işlemi başarısız." });
   }
}

module.exports = {
  getCorporateUserDetails,
  addTeam,
  getCorporateTeam,
  deleteTeamMember,
  payment
};
