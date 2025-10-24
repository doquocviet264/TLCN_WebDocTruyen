// utils/responses/ok.js
module.exports = function ok(res, { data = null, meta = null }) {
  return res.json({ success: true, data, meta });
};