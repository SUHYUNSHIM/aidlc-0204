import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-secret-key';

export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// secureStorage 객체
export const secureStorage = {
  setItem(key: string, value: any): void {
    const stringValue = JSON.stringify(value);
    const encrypted = encrypt(stringValue);
    localStorage.setItem(key, encrypted);
  },

  getItem<T>(key: string): T | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};
