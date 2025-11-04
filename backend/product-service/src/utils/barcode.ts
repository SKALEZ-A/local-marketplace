import { logger } from './logger';

export interface BarcodeData {
  type: string;
  value: string;
  checksum?: string;
}

export class BarcodeGenerator {
  static generateEAN13(productId: string): string {
    const prefix = '200';
    const paddedId = productId.padStart(9, '0').slice(0, 9);
    const baseCode = prefix + paddedId;
    const checksum = this.calculateEAN13Checksum(baseCode);
    return baseCode + checksum;
  }

  static generateUPC(productId: string): string {
    const paddedId = productId.padStart(11, '0').slice(0, 11);
    const checksum = this.calculateUPCChecksum(paddedId);
    return paddedId + checksum;
  }

  static generateSKU(category: string, subcategory: string, sequence: number): string {
    const catCode = category.substring(0, 3).toUpperCase();
    const subCode = subcategory.substring(0, 3).toUpperCase();
    const seqCode = sequence.toString().padStart(6, '0');
    return `${catCode}-${subCode}-${seqCode}`;
  }

  private static calculateEAN13Checksum(code: string): string {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum.toString();
  }

  private static calculateUPCChecksum(code: string): string {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    const checksum = (10 - (sum % 10)) % 10;
    return checksum.toString();
  }

  static validateEAN13(barcode: string): boolean {
    if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
      return false;
    }
    const base = barcode.slice(0, 12);
    const checksum = barcode[12];
    return this.calculateEAN13Checksum(base) === checksum;
  }

  static validateUPC(barcode: string): boolean {
    if (barcode.length !== 12 || !/^\d+$/.test(barcode)) {
      return false;
    }
    const base = barcode.slice(0, 11);
    const checksum = barcode[11];
    return this.calculateUPCChecksum(base) === checksum;
  }

  static parseBarcodeType(barcode: string): string {
    if (barcode.length === 13 && this.validateEAN13(barcode)) {
      return 'EAN-13';
    }
    if (barcode.length === 12 && this.validateUPC(barcode)) {
      return 'UPC-A';
    }
    if (barcode.length === 8) {
      return 'EAN-8';
    }
    return 'UNKNOWN';
  }
}
