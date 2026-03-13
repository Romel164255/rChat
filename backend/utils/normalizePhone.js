export function normalizePhone(phone) {

  if (!phone) return null;

  // remove spaces, +, -, etc
  phone = phone.replace(/\D/g, "");

  // if 10 digit indian number
  if (phone.length === 10) {
    phone = "91" + phone;
  }

  // add +
  return "+" + phone;

}