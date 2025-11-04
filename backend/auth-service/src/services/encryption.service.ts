import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

  static encrypt(text: string, key?: string): string {
    try {
      const encryptionKey = key || this.ENCRYPTION_KEY;
      const derivedKey = crypto.scryptSync(encryptionKey, 'salt', this.KEY_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  static decrypt(encryptedText: string, key?: string): string {
    try {
      const encryptionKey = key || this.ENCRYPTION_KEY;
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const derivedKey = crypto.scryptSync(encryptionKey, 'salt', this.KEY_LENGTH);
      
      const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  static hash(text: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(text).digest('hex');
  }

  static hmac(text: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(text).digest('hex');
  }

  static generateRandomBytes(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  static compareHash(text: string, hash: string, algorithm: string = 'sha256'): boolean {
    const textHash = this.hash(text, algorithm);
    return crypto.timingSafeEqual(Buffer.from(textHash), Buffer.from(hash));
  }

  static encryptObject(obj: any, key?: string): string {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, key);
  }

  static decryptObject<T>(encryptedText: string, key?: string): T {
    const decrypted = this.decrypt(encryptedText, key);
    return JSON.parse(decrypted) as T;
  }

  static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  static encryptWithPublicKey(text: string, publicKey: string): string {
    const buffer = Buffer.from(text, 'utf8');
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    );
    return encrypted.toString('base64');
  }

  static decryptWithPrivateKey(encryptedText: string, privateKey: string): string {
    const buffer = Buffer.from(encryptedText, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      buffer
    );
    return decrypted.toString('utf8');
  }

  static sign(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  static verify(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'base64');
  }

  static deriveKey(password: string, salt: string, keyLength: number = 32): Buffer {
    return crypto.scryptSync(password, salt, keyLength);
  }

  static generateSalt(length: number = this.SALT_LENGTH): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static pbkdf2(password: string, salt: string, iterations: number = 100000, keyLength: number = 64): string {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha512').toString('hex');
  }

  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    const masked = '*'.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
  }

  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    
    const visibleChars = Math.min(2, Math.floor(localPart.length / 2));
    const maskedLocal = localPart.slice(0, visibleChars) + '*'.repeat(localPart.length - visibleChars);
    
    return `${maskedLocal}@${domain}`;
  }

  static maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '*'.repeat(phone.length);
    
    const visibleDigits = digits.slice(-4);
    const maskedPart = '*'.repeat(digits.length - 4);
    
    return maskedPart + visibleDigits;
  }

  static generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
  }

  static validatePasswordStrength(password: string): {
    isStrong: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    const isStrong = score >= 5;

    return { isStrong, score, feedback };
  }
}
