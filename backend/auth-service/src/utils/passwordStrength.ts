export interface PasswordStrengthResult {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  passed: boolean;
}

export class PasswordStrengthChecker {
  private minLength: number = 8;
  private minScore: number = 3;

  checkStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    if (password.length < this.minLength) {
      feedback.push(`Password must be at least ${this.minLength} characters long`);
    } else {
      score += 1;
      if (password.length >= 12) score += 1;
      if (password.length >= 16) score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    if (this.hasRepeatingCharacters(password)) {
      score -= 1;
      feedback.push('Avoid repeating characters');
    }

    if (this.hasSequentialCharacters(password)) {
      score -= 1;
      feedback.push('Avoid sequential characters');
    }

    if (this.isCommonPassword(password)) {
      score = 0;
      feedback.push('This is a commonly used password');
    }

    const strength = this.getStrengthLabel(score);
    const passed = score >= this.minScore;

    return {
      score: Math.max(0, Math.min(5, score)),
      strength,
      feedback,
      passed
    };
  }

  private hasRepeatingCharacters(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  private hasSequentialCharacters(password: string): boolean {
    const sequences = ['abc', '123', 'xyz', '789', 'qwerty', 'asdfgh'];
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
      'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
      'bailey', 'passw0rd', 'shadow', '123123', '654321'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  private getStrengthLabel(score: number): PasswordStrengthResult['strength'] {
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    if (score === 4) return 'strong';
    return 'very-strong';
  }

  setMinLength(length: number): void {
    this.minLength = length;
  }

  setMinScore(score: number): void {
    this.minScore = score;
  }
}

export const passwordStrengthChecker = new PasswordStrengthChecker();
