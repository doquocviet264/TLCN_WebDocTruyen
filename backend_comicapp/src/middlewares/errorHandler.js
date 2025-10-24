// app/middlewares/errorHandler.js
module.exports = function errorHandler(err, req, res, next) {
  console.error("🔥 Error:", err);

  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: { message, code, status },
  });
};
