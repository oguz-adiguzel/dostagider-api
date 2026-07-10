const { generateContentWithRetry } = require("../services/ai.service");
const { generateCarDescriptionPrompt } = require("../utils/aiPrompt");

const generateCarDescription = async (req, res) => {
  try {
    const { brand, model, variant, year, km } = req.body;

    // basic validation
    if (!brand || !model || !year) {
      return res.status(400).json({
        message: "Brand, model ve year zorunludur",
      });
    }

    const prompt = generateCarDescriptionPrompt({
      brand,
      model,
      variant,
      year,
      km,
    });

    const aiText = await generateContentWithRetry(prompt);

    return res.status(200).json({
      success: true,
      description: aiText,
    });
  } catch (err) {
    console.error("AI ERROR:", err);

    return res.status(500).json({
      message: "Açıklama oluşturulamadı",
    });
  }
};

module.exports = {
  generateCarDescription,
};