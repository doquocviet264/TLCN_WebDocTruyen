// app/integrations/momo.gateway.js
const axios = require("axios");
const crypto = require("crypto");

/**
 * Gateway MoMo: chỉ lo chuyện build signature + call API MoMo
 */
module.exports = () => {
  // Nên để vào biến môi trường
  const accessKey = process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85";
  const secretKey = process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMO";
  const redirectUrl = process.env.MOMO_REDIRECT_URL || "http://localhost:5173";
  const ipnUrl = process.env.MOMO_IPN_URL || "https://mitzie-cereless-bonita.ngrok-free.dev/api/payments/momo-ipn";
  const endpoint = process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create";

  async function createPayment({ amount, userId }) {
    const requestType = "payWithMethod";
    const amountStr = amount.toString();
    const orderId = partnerCode + Date.now();
    const requestId = orderId;
    const orderInfo = "Nạp vàng MoMo";
    const extraData = "";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = "vi";

    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amountStr}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      partnerName: "ComicApp",
      storeId: "ComicAppStore",
      requestId,
      amount: amountStr,
      orderId,
      userId: userId.toString(),
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    };
    const result = await axios.post(endpoint, requestBody, {
      headers: { "Content-Type": "application/json" },
    });

    return {
      raw: result.data,
      orderId,
      requestId,
    };
  }

  return {
    createPayment,
  };
};
