import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSecurityCheck(id: string) {
  // Deterministic 4-char security code
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().slice(-4);
}
export function formatPhoneNumber(phone: string) {
  if (phone.startsWith("+")) return phone;
  if (phone.length === 10) return `+91${phone}`;
  return phone;
}

interface WhatsAppData {
  name: string;
  phone: string;
  course_interest: string;
  preferred_countries: string | string[];
  intake: string;
  generated_id: string;
  passport_url: string;
}

export function generateWhatsAppLink(data: WhatsAppData) {
  const countries = Array.isArray(data.preferred_countries)
    ? data.preferred_countries.join(", ")
    : data.preferred_countries;

  const message = `Hi *${data.name.trim()}*,

Thank you for registering with Eccho Overseas.

We have received your details for *${data.course_interest.trim()}* in *${countries.trim()}* for *${data.intake.trim()}* intake.

Our expert counselor will contact you shortly.

Your Profile ID: *${data.generated_id.trim()}*

You can track your application here: ${data.passport_url.trim()}

For urgent queries, reply to this message.

Regards,
Eccho Overseas Team`;

  const formattedPhone = formatPhoneNumber(data.phone).replace(/\+/g, "");
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
