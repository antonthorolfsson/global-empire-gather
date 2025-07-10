/**
 * Security utilities for input validation and sanitization
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Dangerous characters that should be removed or escaped
const DANGEROUS_CHARS_REGEX = /[<>"'&]/g;

export const validateEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
};

export const sanitizeText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  
  // Trim whitespace
  let sanitized = text.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove dangerous characters
  sanitized = sanitized.replace(DANGEROUS_CHARS_REGEX, '');
  
  return sanitized;
};

export const validateGameName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Game name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    return { isValid: false, error: 'Game name must be at least 3 characters long' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Game name must be 50 characters or less' };
  }
  
  if (DANGEROUS_CHARS_REGEX.test(trimmedName)) {
    return { isValid: false, error: 'Game name contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validateDisplayName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Display name is required' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Display name must be 50 characters or less' };
  }
  
  if (DANGEROUS_CHARS_REGEX.test(trimmedName)) {
    return { isValid: false, error: 'Display name contains invalid characters' };
  }
  
  return { isValid: true };
};

export const validateMaxPlayers = (maxPlayers: number): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(maxPlayers)) {
    return { isValid: false, error: 'Max players must be a whole number' };
  }
  
  if (maxPlayers < 2) {
    return { isValid: false, error: 'Game must allow at least 2 players' };
  }
  
  if (maxPlayers > 8) {
    return { isValid: false, error: 'Game cannot have more than 8 players' };
  }
  
  return { isValid: true };
};

/**
 * Generate a CSRF token for invitation links
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate CSRF token (basic length and format check)
 */
export const validateCSRFToken = (token: string): boolean => {
  if (!token || token.length !== 64) return false;
  return /^[a-f0-9]+$/.test(token);
};

/**
 * Check if an invitation has expired
 */
export const isInvitationExpired = (expiresAt: string): boolean => {
  return new Date() > new Date(expiresAt);
};

/**
 * Get client IP address from request headers (for audit logging)
 */
export const getClientIP = (): string => {
  // In browser environment, we can't get real IP
  // This would be handled server-side in edge functions
  return 'client';
};

/**
 * Basic XSS protection by escaping HTML entities
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};