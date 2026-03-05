/**
 * donate-config.js
 * 
 * SPENDEN-KONFIGURATION
 * =====================
 * Trage hier deine Zahlungsdaten ein.
 * Nicht ausgefüllte Felder werden automatisch ausgeblendet.
 * 
 * Beispiele:
 * - Ko-fi: "https://ko-fi.com/deinname"
 * - PayPal: "https://paypal.me/deinname"
 * - Bitcoin: { address: "bc1q...", qr: "images/qr-btc.png" }
 */

const DONATE_CONFIG = {
  // ===== EINFACHE ZAHLUNGEN =====
  
  // Ko-fi (empfohlen für die meisten Spender)
  // Erstelle Account: https://ko-fi.com
  kofi: null,  // z.B. "https://ko-fi.com/deinname"
  
  // PayPal.me Direktlink
  paypal: null,  // z.B. "https://paypal.me/deinname"
  
  
  // ===== KRYPTOWÄHRUNGEN =====
  
  // Bitcoin
  btc: null,
  // Beispiel:
  // btc: {
  //   address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  //   qr: "images/qr-btc.png"  // Optional: Pfad zum QR-Code Bild
  // },
  
  // Litecoin
  ltc: null,
  // Beispiel:
  // ltc: {
  //   address: "ltc1q...",
  //   qr: "images/qr-ltc.png"
  // },
  
  // Dogecoin
  doge: null,
  // Beispiel:
  // doge: {
  //   address: "D...",
  //   qr: "images/qr-doge.png"
  // },
  
  // Monero (maximale Privatsphäre)
  xmr: null,
  // Beispiel:
  // xmr: {
  //   address: "4...",
  //   qr: "images/qr-xmr.png"
  // },
};
