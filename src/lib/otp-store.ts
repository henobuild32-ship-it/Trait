// In-memory OTP store (shared between send-otp and verify-otp)
// In production with multiple instances, use Redis instead
export const otpStore = new Map<string, { code: string; expires: number }>();

// Cleanup expired OTPs every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of otpStore.entries()) {
      if (data.expires < now) otpStore.delete(phone);
    }
  }, 10 * 60 * 1000);
}
