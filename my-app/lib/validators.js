const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const udyamRegex = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function isValidEmail(value = "") {
  return emailRegex.test(String(value).trim().toLowerCase());
}

export function validatePassword(value = "") {
  const password = String(value);
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return "";
}

export function normalizePhone(value = "") {
  return String(value).replace(/\s+/g, "").replace(/-/g, "");
}

export function isValidPhone(value = "") {
  return phoneRegex.test(normalizePhone(value));
}

export function normalizeGst(value = "") {
  return String(value).trim().toUpperCase();
}

export function isValidGst(value = "") {
  return gstRegex.test(normalizeGst(value));
}

export function normalizeUdyam(value = "") {
  return String(value).trim().toUpperCase();
}

export function isValidUdyam(value = "") {
  return udyamRegex.test(normalizeUdyam(value));
}

export function normalizePan(value = "") {
  return String(value).trim().toUpperCase();
}

export function isValidPan(value = "") {
  return panRegex.test(normalizePan(value));
}
