// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('✅ MongoDB Connected');
//   } catch (error) {
//     console.error('❌ MongoDB Connection Error:', error.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;


const mongoose = require('mongoose');

// Bağlantı durumunu hafızada tutmak için global değişken
let isConnected = false;

const connectDB = async () => {
  // Eğer zaten bağlıysak boşuna tekrar el sıkışma (handshake) yapma
  if (isConnected) {
    console.log('✅ MongoDB (Mevcut bağlantı kullanılıyor)');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB (Yeni bağlantı kuruldu)');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Vercel serverless ortamındaysak process.exit(1) fonksiyonu tamamen çökertir.
    // Sadece lokalde geliştirme yaparken kapatsın diye kontrol ekleyelim:
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;