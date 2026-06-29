export const otpStore = new Map<string, { code: string; expires: number }>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [phone, data] of otpStore.entries()) {
      if (data.expires < now) otpStore.delete(phone)
    }
  }, 10 * 60 * 1000)
}
