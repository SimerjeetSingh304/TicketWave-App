import QRCode from 'qrcode';

/**
 * Generate a base64 encoded QR Code image representing the booking ID
 * @param {string} bookingId - The booking ID to encode
 * @returns {Promise<string>} Base64 image URL data
 */
export async function generateBookingQRCode(bookingId) {
  try {
    // Generate inline base64 QR Code string
    const qrDataUrl = await QRCode.toDataURL(bookingId.toString(), {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 250,
      color: {
        dark: '#1e1b4b', // Deep indigo
        light: '#ffffff'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('[QR Service Error] Failed to generate QR Code:', error.message);
    throw new Error('QR Code generation failed');
  }
}
