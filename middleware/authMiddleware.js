const jwt = require("jsonwebtoken");

const authMiddleware = (requiredRoles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token bulunamadı." });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      req.user = {
        id: decoded.userId,
        role: decoded.role,
      };

      // Role kontrolü (örneğin ["admin"] ya da ["admin", "superadmin"])
      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(decoded.role)
      ) {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
      }

      next();
    } catch (error) {
      console.error("🔒 Auth hatası:", error.message);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Oturum süresi doldu." });
      }

      return res.status(401).json({ message: "Geçersiz token." });
    }
  };
};



module.exports = authMiddleware;
