const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Car Sales API",
      version: "1.0.0",
      description: "Dostagider.com uygulaması için API dokümantasyonu",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Geliştirme sunucusu",
      },
    ],
    components: {
      // buraya ekle
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "The email address of the user.",
              example: "user@example.com",
            },
            sifre: {
              type: "string",
              description: "The password of the user.",
              example: "securepassword123",
            },
            isim: {
              type: "string",
              description: "The first name of the user.",
              example: "John",
            },
            soyisim: {
              type: "string",
              description: "The last name of the user.",
              example: "Doe",
            },
            sehir: {
              type: "string",
              description: "The city where the user lives.",
              example: "Istanbul",
            },
            ilce: {
              type: "string",
              description: "The district of the city where the user lives.",
              example: "Kadıköy",
            },
            mahalle: {
              type: "string",
              description: "The neighborhood where the user lives.",
              example: "Moda",
            },
            telefon: {
              type: "string",
              description: "The phone number of the user.",
              example: "1234567890",
            },
            hesapOlusturmaTarihi: {
              type: "object",
              properties: {
                ay: {
                  type: "number",
                  description: "The month when the account was created.",
                  example: 10,
                },
                yil: {
                  type: "number",
                  description: "The year when the account was created.",
                  example: 2023,
                },
              },
            },
            ilanlar: {
              type: "array",
              items: {
                type: "string",
                format: "objectId",
                description:
                  "The list of car listings associated with the user.",
              },
              description: "The car listings that the user has posted.",
            },
            favoriler: {
              type: "array",
              items: {
                type: "string",
                format: "objectId",
                description: "The list of car listings favorited by the user.",
              },
              description: "The car listings that the user has favorited.",
            },
            role: {
              type: "string",
              enum: ["admin", "user"], // USER_ROLES enum değerine göre güncelleme yapın
              description: "The role of the user (e.g. admin, user).",
              example: "user",
            },
            isVerified: {
              type: "boolean",
              description: "Whether the user has verified their email address.",
              example: false,
            },
            verificationCode: {
              type: "string",
              description:
                "The verification code sent to the user for email verification.",
              example: "123456",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the user was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the user was last updated.",
              example: "2023-11-29T12:34:56.789Z",
            },
          },
        },
        Ekip: {
          type: "object",
          properties: {
            ad: {
              type: "string",
              description: "The first name of the team member.",
              example: "John",
            },
            soyad: {
              type: "string",
              description: "The last name of the team member.",
              example: "Doe",
            },
            gorev: {
              type: "string",
              description: "The role of the team member.",
              example: "Project Manager",
            },
            telefon: {
              type: "string",
              description: "The phone number of the team member.",
              example: "1234567890",
            },
            fotoUrl: {
              type: "string",
              description:
                "The URL of the team member's photo (Cloudinary URL).",
              example:
                "https://res.cloudinary.com/demo/image/upload/v1618456570/team_member.jpg",
            },
            publicId: {
              type: "string",
              description: "The public ID used for Cloudinary file management.",
              example: "team_member_public_id",
            },
          },
        },
        CorporateUser: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "The email address of the corporate user.",
              example: "corporate@example.com",
            },
            sifre: {
              type: "string",
              description: "The password of the corporate user.",
              example: "securePassword123",
            },
            galeriAdi: {
              type: "string",
              description: "The name of the gallery.",
              example: "My Gallery",
            },
            slug: {
              type: "string",
              description: "A unique slug identifier for the gallery.",
              example: "my-gallery",
            },
            logoUrl: {
              type: "string",
              description: "The URL of the gallery logo (Cloudinary URL).",
              example:
                "https://res.cloudinary.com/demo/image/upload/v1618456570/gallery_logo.jpg",
            },
            coverPhotoUrl: {
              type: "string",
              description:
                "The URL of the gallery cover photo (Cloudinary URL).",
              example:
                "https://res.cloudinary.com/demo/image/upload/v1618456570/gallery_cover.jpg",
            },
            hakkimizda: {
              type: "string",
              description: "A description about the gallery.",
              example: "This is a modern gallery showcasing contemporary art.",
            },
            telefon: {
              type: "string",
              description: "The phone number of the corporate user.",
              example: "0987654321",
            },
            yetkiliAdi: {
              type: "string",
              description: "The first name of the authorized person.",
              example: "Alice",
            },
            yetkiliSoyadi: {
              type: "string",
              description: "The last name of the authorized person.",
              example: "Smith",
            },
            vergiDairesi: {
              type: "string",
              description: "The tax office of the corporate user.",
              example: "Istanbul Tax Office",
            },
            vergiNo: {
              type: "string",
              description: "The tax number of the corporate user.",
              example: "1234567890",
            },
            sehir: {
              type: "string",
              description: "The city where the corporate user is located.",
              example: "Istanbul",
            },
            ilce: {
              type: "string",
              description: "The district where the corporate user is located.",
              example: "Kadıköy",
            },
            mahalle: {
              type: "string",
              description:
                "The neighborhood where the corporate user is located.",
              example: "Moda",
            },
            acikAdres: {
              type: "string",
              description: "The open address of the corporate user.",
              example: "123 Art Gallery St, Moda, Kadıköy, Istanbul",
            },
            hesapOlusturmaTarihi: {
              type: "object",
              properties: {
                ay: {
                  type: "number",
                  description:
                    "The month when the corporate account was created.",
                  example: 10,
                },
                yil: {
                  type: "number",
                  description:
                    "The year when the corporate account was created.",
                  example: 2023,
                },
              },
            },
            ilanlar: {
              type: "array",
              items: {
                type: "string",
                format: "objectId",
                description:
                  "The list of car listings associated with the corporate user.",
              },
              description: "The car listings posted by the corporate user.",
            },
            role: {
              type: "string",
              enum: ["bireysel", "kurumsal", "admin"],
              description: "The role of the corporate user.",
              example: "kurumsal",
            },
            isVerified: {
              type: "boolean",
              description:
                "Whether the corporate user has verified their email.",
              example: false,
            },
            verificationCode: {
              type: "string",
              description: "The verification code sent for email confirmation.",
              example: "123456",
            },
            calismaSaatleri: {
              type: "object",
              properties: {
                haftaIci: {
                  type: "string",
                  description: "Working hours on weekdays.",
                  example: "9:00 AM - 6:00 PM",
                },
                haftaSonu: {
                  type: "string",
                  description: "Working hours on weekends.",
                  example: "10:00 AM - 4:00 PM",
                },
              },
            },
            isVerifiedAdmin: {
              type: "boolean",
              description:
                "Whether the corporate user is manually approved by an admin.",
              example: false,
            },
            ekip: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Ekip",
              },
              description:
                "The team members associated with the corporate user.",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the corporate user was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description:
                "The timestamp when the corporate user was last updated.",
              example: "2023-11-29T12:34:56.789Z",
            },
          },
        },
        Admin: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "The email address of the admin.",
              example: "admin@example.com",
            },
            sifre: {
              type: "string",
              description: "The password for the admin account.",
              example: "securePassword123",
            },
            isim: {
              type: "string",
              description: "The name of the admin user.",
              default: "Admin",
              example: "Admin User",
            },
            role: {
              type: "string",
              description:
                'The role of the user, which is always "admin" for this model.',
              default: "admin",
              example: "admin",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the admin account was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description:
                "The timestamp when the admin account was last updated.",
              example: "2023-11-29T12:34:56.789Z",
            },
          },
        },
        CarBodyType: {
          type: "object",
          properties: {
            bodyType: {
              type: "string",
              description:
                "The type of the car body (e.g., Sedan, Hatchback, SUV).",
              example: "Sedan",
            },
            imageUrl: {
              type: "string",
              description:
                "The URL of the car body type image (Cloudinary URL).",
              example:
                "https://res.cloudinary.com/demo/image/upload/v1618456570/sedan_image.jpg",
            },
            publicId: {
              type: "string",
              description:
                "The Cloudinary public ID for the car body type image, used for file management and deletion.",
              example: "car_body_sedan_public_id",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the car body type was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description:
                "The timestamp when the car body type was last updated.",
              example: "2023-11-29T12:34:56.789Z",
            },
          },
        },
        CarBrand: {
          type: "object",
          properties: {
            brandName: {
              type: "string",
              description:
                "The name of the car brand (e.g., Toyota, Ford, BMW).",
              example: "Toyota",
            },
            logoUrl: {
              type: "string",
              description:
                "The URL of the car brand logo (Cloudinary URL or other image hosting URL).",
              example:
                "https://res.cloudinary.com/demo/image/upload/v1618456570/toyota_logo.jpg",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the car brand was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the car brand was last updated.",
              example: "2023-11-29T12:34:56.789Z",
            },
          },
        },
        CarListing: {
          type: "object",
          properties: {
            ilanNo: {
              type: "string",
              description: "Unique listing number for the car.",
              example: "12345AB",
            },
            baslik: {
              type: "string",
              description: "The title of the car listing.",
              example: "2019 Toyota Corolla, Low Mileage, Excellent Condition",
            },
            category: {
              type: "string",
              description: "The category of the car listing (e.g., New, Used).",
              example: "Used",
            },
            price: {
              type: "string",
              description: "The price of the car.",
              example: "25000",
            },
            brand: {
              type: "string",
              description: "The brand of the car.",
              example: "Toyota",
            },
            model: {
              type: "string",
              description: "The model of the car.",
              example: "Corolla",
            },
            variant1: {
              type: "string",
              description: "Optional first variant of the car.",
              example: "LE",
            },
            variant2: {
              type: "string",
              description: "Optional second variant of the car.",
              example: "XLE",
            },
            variant3: {
              type: "string",
              description: "Optional third variant of the car.",
              example: "SE",
            },
            ilanTarihi: {
              type: "string",
              format: "date-time",
              description: "The listing date of the car.",
              example: "2023-11-29T12:34:56.789Z",
            },
            aracYili: {
              type: "integer",
              description: "The year of the car.",
              example: 2019,
            },
            yakit: {
              type: "string",
              description: "The fuel type of the car.",
              enum: ["Benzin", "Dizel", "Hybrid", "Elektrik", "LPG", "Diğer"],
              example: "Benzin",
            },
            vites: {
              type: "string",
              description: "The transmission type of the car.",
              enum: ["Manuel", "Otomatik", "Yarı Otomatik"],
              example: "Otomatik",
            },
            km: {
              type: "integer",
              description: "The mileage of the car.",
              example: 50000,
            },
            kasaTipi: {
              type: "string",
              description: "The body type of the car.",
              example: "Sedan",
            },
            garanti: {
              type: "boolean",
              description: "Whether the car comes with a warranty.",
              example: true,
            },
            agirHasarKaydi: {
              type: "boolean",
              description: "Whether the car has severe damage record.",
              example: false,
            },
            takas: {
              type: "boolean",
              description: "Whether the car listing accepts trade-ins.",
              example: true,
            },
            aciklama: {
              type: "string",
              description: "Description of the car listing.",
              example:
                "This car is in excellent condition and has been well-maintained.",
            },
            gorseller: {
              type: "array",
              items: {
                type: "string",
              },
              description: "URLs of images related to the car listing.",
              example: [
                "https://example.com/car-image1.jpg",
                "https://example.com/car-image2.jpg",
              ],
            },
            noExpertiz: {
              type: "boolean",
              description: "Whether the car has passed an expert inspection.",
              example: false,
            },
            teknikOzellikler: {
              type: "object",
              properties: {
                guvenlik: {
                  type: "object",
                  properties: {
                    abs: { type: "boolean", default: false },
                    aeb: { type: "boolean", default: false },
                    bas: { type: "boolean", default: false },
                    cocukKilidi: { type: "boolean", default: false },
                    distronic: { type: "boolean", default: false },
                    geceGorusSistemi: { type: "boolean", default: false },
                    havaYastıgıSürücü: { type: "boolean", default: false },
                    havaYastıgıYolcu: { type: "boolean", default: false },
                    immobilizer: { type: "boolean", default: false },
                    isofix: { type: "boolean", default: false },
                    korNokta: { type: "boolean", default: false },
                    merkeziKilit: { type: "boolean", default: false },
                    seritTakip: { type: "boolean", default: false },
                    yokusKalkis: { type: "boolean", default: false },
                    yorgunlukTespit: { type: "boolean", default: false },
                  },
                },
                icDonanim: {
                  type: "object",
                  properties: {
                    hidrolikDireksiyon: { type: "boolean", default: false },
                    ucuncuSiraKoltuk: { type: "boolean", default: false },
                    deriKoltuk: { type: "boolean", default: false },
                    kumasKoltuk: { type: "boolean", default: false },
                    elektrikliCam: { type: "boolean", default: false },
                    klima: { type: "boolean", default: false },
                    otmKararanDikiz: { type: "boolean", default: false },
                    onGorüsKamera: { type: "boolean", default: false },
                    onKolDayama: { type: "boolean", default: false },
                    anahtarsizGiris: { type: "boolean", default: false },
                    fonksiyonelDireksiyon: { type: "boolean", default: false },
                    isitmaliDireksiyon: { type: "boolean", default: false },
                    elektrikliKoltuk: { type: "boolean", default: false },
                    isitmaliKoltuk: { type: "boolean", default: false },
                    sogutmaliKoltuk: { type: "boolean", default: false },
                    hizSabitleme: { type: "boolean", default: false },
                    sogutmaliTorpido: { type: "boolean", default: false },
                    yolBilgisayari: { type: "boolean", default: false },
                    headUp: { type: "boolean", default: false },
                    startStop: { type: "boolean", default: false },
                    geriGorus: { type: "boolean", default: false },
                  },
                },
                dısDonanim: {
                  type: "object",
                  properties: {
                    ayaklaAcilanBagaj: { type: "boolean", default: false },
                    hardtop: { type: "boolean", default: false },
                    adaptifFar: { type: "boolean", default: false },
                    elektrikliAyna: { type: "boolean", default: false },
                    isitmaliAyna: { type: "boolean", default: false },
                    hafizaliAyna: { type: "boolean", default: false },
                    parkSensorüArka: { type: "boolean", default: false },
                    parkSensorüOn: { type: "boolean", default: false },
                    parkAsistani: { type: "boolean", default: false },
                    sunroof: { type: "boolean", default: false },
                    panoramikTavan: { type: "boolean", default: false },
                    cekiDemiri: { type: "boolean", default: false },
                  },
                },
                multimedya: {
                  type: "object",
                  properties: {
                    android: { type: "boolean", default: false },
                    apple: { type: "boolean", default: false },
                    bluetooth: { type: "boolean", default: false },
                    usb: { type: "boolean", default: false },
                  },
                },
              },
            },
            ekspertiz: {
              type: "object",
              properties: {
                kaput: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                tavan: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                bagaj: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                sagOnKapi: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                sagArkaKapi: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                sagOnCamurluk: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                sagArkaCamurluk: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                solOnKapi: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                solArkaKapi: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                solOnCamurluk: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
                solArkaCamurluk: {
                  type: "string",
                  enum: ["Orijinal", "Boyalı", "Lokal Boyalı", "Değişmiş"],
                  default: "Orijinal",
                },
              },
            },
            user: {
              type: "string",
              description: "The ID of the user who created the listing.",
              example: "60d70a5b1f35c81b54cda97c",
            },
            corporateUser: {
              type: "string",
              description: "The ID of the corporate user, if applicable.",
              example: "60d70a5b1f35c81b54cda97d",
            },
            isShowcased: {
              type: "boolean",
              description: "Whether the car is showcased.",
              example: true,
            },
            showcaseExpiresAt: {
              type: "string",
              format: "date-time",
              description: "The expiration date of the showcase listing.",
              example: "2023-12-29T12:34:56.789Z",
            },
            isActive: {
              type: "boolean",
              description: "Whether the car listing is active or not.",
              example: true,
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "The expiration date of the car listing.",
              example: "2025-11-29T12:34:56.789Z",
            },
            views: {
              type: "integer",
              description: "Number of views the listing has received.",
              example: 150,
            },
          },
        },
        Variant3: {
          type: "object",
          properties: {
            variant3: {
              type: "string",
              description: "Third-level variant of the car.",
              example: "Electric",
            },
          },
        },
        Variant2: {
          type: "object",
          properties: {
            variant2: {
              type: "string",
              description: "Second-level variant of the car.",
              example: "Hybrid",
            },
            children: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Variant3",
              },
              description: "List of third-level variants.",
            },
          },
        },
        Variant1: {
          type: "object",
          properties: {
            variant1: {
              type: "string",
              description: "First-level variant of the car.",
              example: "Sedan",
            },
            children: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Variant2",
              },
              description: "List of second-level variants.",
            },
          },
        },
        Model: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the car model.",
              example: "Toyota Corolla",
            },
            variants: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Variant1",
              },
              description: "List of first-level variants for the model.",
            },
          },
        },
        Brand: {
          type: "object",
          properties: {
            brand: {
              type: "string",
              description: "The name of the car brand.",
              example: "Toyota",
            },
            models: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Model",
              },
              description: "List of models under the brand.",
            },
          },
        },
        CarOption: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "The category of the car options.",
              example: "Sedan",
            },
            brands: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Brand",
              },
              description: "List of brands under the category.",
            },
          },
        },
        Log: {
          type: "object",
          properties: {
            level: {
              type: "string",
              enum: ["info", "warn", "error", "debug"],
              description: "The severity level of the log message.",
              default: "info",
              example: "error",
            },
            type: {
              type: "string",
              description:
                'The type of the log entry, such as "auth.login" or "ilan.create".',
              example: "ilan.create",
            },
            message: {
              type: "string",
              description: "The log message content.",
              example: "User created a new car listing.",
            },
            meta: {
              type: "object",
              description:
                "Additional metadata related to the log, such as request body or stack trace.",
              additionalProperties: true,
              example: {
                requestBody: { carModel: "Toyota", price: "20000" },
                stackTrace: "Error stack trace...",
              },
            },
            userId: {
              type: "string",
              description:
                "The ID of the user related to this log entry (if applicable).",
              example: "60d70a5b1f35c81b54cda97c",
            },
            corporateUserId: {
              type: "string",
              description:
                "The ID of the corporate user related to this log entry (if applicable).",
              example: "60d70a5b1f35c81b54cda97d",
            },
            listingId: {
              type: "string",
              description:
                "The ID of the car listing related to this log entry (if applicable).",
              example: "60d70a5b1f35c81b54cda97e",
            },
            ip: {
              type: "string",
              description:
                "The IP address from which the action was performed.",
              example: "192.168.1.1",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The date and time when the log entry was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
          },
        },
        ShowcaseRequest: {
          type: "object",
          properties: {
            listingId: {
              type: "string",
              description:
                "The ID of the car listing that the showcase request is for.",
              example: "60d70a5b1f35c81b54cda97e",
            },
            requestedBy: {
              type: "string",
              description:
                "The ID of the user or corporate user who requested the showcase.",
              example: "60d70a5b1f35c81b54cda97c",
            },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
              description: "The current status of the showcase request.",
              default: "pending",
              example: "pending",
            },
            reason: {
              type: "string",
              description:
                "The reason provided by the user for the showcase request (optional).",
              example: "I want to highlight this car for more visibility.",
              default: "",
            },
            adminMessage: {
              type: "string",
              description:
                "Admin’s message for the approval/rejection (optional).",
              example: "Approved for showcasing.",
              default: "",
            },
            processedBy: {
              type: "string",
              description: "The ID of the admin who processed the request.",
              example: "60d70a5b1f35c81b54cda97d",
            },
            processedAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the request was processed.",
              example: "2023-11-29T12:34:56.789Z",
              default: null,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the request was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the request was last updated.",
              example: "2023-11-30T12:34:56.789Z",
            },
          },
        },
        Showcase: {
          type: "object",
          properties: {
            listingId: {
              type: "string",
              description: "The ID of the car listing that is being showcased.",
              example: "60d70a5b1f35c81b54cda97e",
            },
            isActive: {
              type: "boolean",
              description: "Whether the showcase is active or not.",
              default: true,
              example: true,
            },
            expiresAt: {
              type: "string",
              format: "date-time",
              description: "The expiration date and time of the showcase.",
              example: "2023-12-31T23:59:59.000Z",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the showcase was created.",
              example: "2023-11-29T12:34:56.789Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "The timestamp when the showcase was last updated.",
              example: "2023-11-30T12:34:56.789Z",
            },
          },
        },
        ViewTrack: {
      type: 'object',
      properties: {
        listingId: {
          type: 'string',
          description: 'The ID of the car listing that was viewed.',
          example: '60d70a5b1f35c81b54cda97e',
        },
        ip: {
          type: 'string',
          description: 'The IP address of the user who viewed the listing.',
          example: '192.168.1.1',
        },
        viewedAt: {
          type: 'string',
          format: 'date-time',
          description: 'The date and time when the listing was viewed.',
          example: '2023-11-29T12:34:56.789Z',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'The timestamp when the view record was created.',
          example: '2023-11-29T12:34:56.789Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'The timestamp when the view record was last updated.',
          example: '2023-11-29T12:34:56.789Z',
        },
      },
    },
      },
    },
  },
  apis: ["./routes/*.js"], // Route dosyalarının yolu
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
