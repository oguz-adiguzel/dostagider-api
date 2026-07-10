function generateCarDescriptionPrompt(data) {
  const { brand, model, variant, year, km } = data;

  return `
Aşağıdaki araç için doğal ve gerçekçi bir ilan açıklaması yaz.

Kurallar:
- Samimi ve akıcı bir dil kullan
- Abartıdan kaçın
- Emojisiz yaz
- "satış odaklı", "güven veren" gibi ifadeleri metinde kullanma
- Maddeler halinde yazma
- 250-300 kelime arası olsun
- En önemlisi otomobil ilan platformlarındaki açıklamalar ile benzer olmalı. Bir araç kataloğundaki yazı gibi görünmemeli
- Verilen araç marka model variant bilgisini bir satırda belirt, başka bir satırda aracın year bilgisini belirt, başka bir satırda km bilgisi ve başka bir satırda da güzel bir ifade ile ilgili araç hakkında bilgi paragrafı yaz

Araç bilgileri:
${year} ${brand} ${model} ${variant}
${km} km

Sadece ilan açıklamasını yaz.
`;
}

module.exports = { generateCarDescriptionPrompt };