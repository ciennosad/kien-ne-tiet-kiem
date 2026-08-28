// Middleware xu ly loi tap trung. Khong bao gio tra ve chi tiet loi he thong
// (stack trace, cau truy van SQL...) ra ngoai de tranh lo thong tin nhay cam.
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = status === 500 ? "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." : err.message;
  res.status(status).json({ message });
}

function notFound(req, res) {
  res.status(404).json({ message: "Không tìm thấy đường dẫn yêu cầu." });
}

module.exports = { errorHandler, notFound };
