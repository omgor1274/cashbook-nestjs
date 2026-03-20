const OTP_USER_KEYS = [
  'OTP_EMAIL_USER',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'MAIL_USER',
  'SMTP_USER',
  'EMAIL',
] as const;

const OTP_PASSWORD_KEYS = [
  'OTP_EMAIL_APP_PASSWORD',
  'OTP_EMAIL_PASSWORD',
  'EMAIL_APP_PASSWORD',
  'EMAIL_PASSWORD',
  'MAIL_PASSWORD',
  'SMTP_PASS',
  'APP_PASSWORD',
  'PASSWORD',
] as const;

const REQUIRED_KEYS = ['MONGO_URI', 'JWT_SECRET_KEY', 'JWT_EXPIRES_IN'] as const;

function hasNonEmptyString(config: Record<string, unknown>, key: string): boolean {
  const value = config[key];
  return typeof value === 'string' && value.trim().length > 0;
}

function hasAnyKey(config: Record<string, unknown>, keys: readonly string[]): boolean {
  return keys.some((key) => hasNonEmptyString(config, key));
}

export function validateEnv(config: Record<string, unknown>) {
  const missing: string[] = [];

  for (const key of REQUIRED_KEYS) {
    if (!hasNonEmptyString(config, key)) {
      missing.push(key);
    }
  }

  if (!hasAnyKey(config, OTP_USER_KEYS)) {
    missing.push(`one of: ${OTP_USER_KEYS.join(', ')}`);
  }

  if (!hasAnyKey(config, OTP_PASSWORD_KEYS)) {
    missing.push(`one of: ${OTP_PASSWORD_KEYS.join(', ')}`);
  }

  if (missing.length > 0) {
    throw new Error(
      `Environment validation failed. Missing required variables: ${missing.join(' | ')}`,
    );
  }

  return config;
}
