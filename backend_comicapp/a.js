// === Giả lập DB ===
const wallets = { 1: { userId: 1, balance: 100000 } };
const momoOrders = {};  // lưu order tạm

const userId = 1; // giả lập user đăng nhập

// === API tạo payment ===
app.post("/payment", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ error: "Amount required" });
    const userId = 1;
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const partnerCode = "MOMO";
    const orderInfo = "pay with MoMo";
    const redirectUrl = "http://localhost:5173"; // FE redirect
    const ipnUrl = "https://beige-parrots-joke.loca.lt/momo-ipn"; // IPN endpoint backend
    const requestType = "payWithMethod";
    const amountStr = amount.toString();
    const orderId = partnerCode + Date.now();
    const requestId = orderId;
    const extraData = "";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = "vi";

    const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

    const requestBody = {
      partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
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
      signature
    };

    // Lưu tạm order
    momoOrders[orderId] = { userId, amount: Number(amount), status: "pending" };

    const result = await axios.post("https://test-payment.momo.vn/v2/gateway/api/create", requestBody, {
      headers: { "Content-Type": "application/json" }
    });

    res.json(result.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// === IPN endpoint ===
app.post("/momo-ipn", async (req, res) => {
  try {
    console.log("IPN payload:", req.body);
    const { orderId, requestId, amount, resultCode, signature } = req.body;
    console.log("IPN received:", req.body);

    const order = momoOrders[orderId];
    if (!order) return res.status(404).json({ error: "Order not found" });

    // TODO: Xác thực signature với MoMo secretKey
    if (resultCode === 0) {
      // thanh toán thành công
      const wallet = wallets[order.userId];
      wallet.balance += Number(amount);

      // Cập nhật order status
      order.status = "success";

      console.log(`User ${order.userId} nạp ${amount}. Balance: ${wallet.balance}`);
      return res.json({ success: true });
    } else {
      order.status = "failed";
      return res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "IPN server error" });
  }
});

// === API lấy số dư ví ===
app.get("/user/wallet", (req, res) => {
  const wallet = wallets[userId];
  res.json({ balance: wallet.balance });
});
// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint' });
});