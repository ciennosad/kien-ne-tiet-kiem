const crypto = require("crypto");

// Ma hoa/giai ma truong du lieu nhay cam (vi du: ghi chu giao dich) truoc khi
// luu vao CSDL, dung AES-256-GCM (co xac thuc toan ven du lieu bang authTag).
const ALGORITHM = "aes-256-gcm";

function getKey() {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("ENCRYPTION_KEY phai la chuoi hex 64 ky tu (32 byte)");
  }
  return Buffer.from(hex, "hex");
}

function encrypt(plainText) {
  if (plainText === null || plainText === undefined || plainText === "") return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Lưu chung iv + authTag + du lieu ma hoa, ma hoa base64 de de luu vao cot TEXT
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decrypt(payload) {
  if (!payload) return "";
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
