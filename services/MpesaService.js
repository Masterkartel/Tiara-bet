
const axios = require("axios");

class MpesaService {
  constructor() {
    this.consumerKey    = process.env.DARAJA_CONSUMER_KEY;
    this.consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    this.shortcode      = process.env.TILL_NUMBER;
    this.passkey        = process.env.MPESA_PASSKEY;
    this.baseUrl        = process.env.DARAJA_BASE_URL;
    this.callbackUrl    = process.env.MPESA_CALLBACK_URL;
  }

  async getAccessToken() {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");
    const { data } = await axios.get(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return data.access_token;
  }

  getTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
      d.getFullYear().toString() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds())
    );
  }

  getPassword(timestamp) {
    return Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString("base64");
  }

  async stkPush({ phone, amount, accountReference, description }) {
    const token = await this.getAccessToken();
    const timestamp = this.getTimestamp();
    const password = this.getPassword(timestamp);

    const payload = {
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline", // Till / Buy Goods
      Amount: Math.round(amount),
      PartyA: phone,
      PartyB: this.shortcode,
      PhoneNumber: phone,
      CallBackURL: this.callbackUrl,
      AccountReference: accountReference || "CrashGame",
      TransactionDesc: description || "Deposit",
    };

    const { data } = await axios.post(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  }
}

module.exports = new MpesaService();
