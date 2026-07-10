module.exports = function getPublicIdFromUrl(url) {
  const parts = url.split("/");
  const fileWithExt = parts[parts.length - 1];
  const publicId = fileWithExt.split(".")[0]; // örnek: abc123.jpg → abc123
  const folder = parts[parts.length - 2]; // örnek: otosat klasörü
  return `${folder}/${publicId}`; // örnek: otosat/abc123
};