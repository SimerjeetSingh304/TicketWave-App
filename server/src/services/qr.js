import QRCode from 'qrcode';

/**
 * Generates a QR Code as a base64 Data URL.
 * @param {string} text - The content of the QR Code (e.g. Booking ID)
 * @returns {Promise<string>} Base64 representation of the QR Code
 */
export const generateQRCode = async (text) => {
  try {
    const dataUrl = await QRCode.toDataURL(text.toString());
    return dataUrl;
  } catch (error) {
    console.error('[QR Generator] Error:', error.message);
    throw error;
  }
};

export default generateQRCode;
