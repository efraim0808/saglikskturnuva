import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TR_LOCALE = 'tr-TR';

export function toTurkishUpper(value: string): string {
  return value.toLocaleUpperCase(TR_LOCALE);
}

export function normalizeTurkish(value: string): string {
  return value.toLocaleLowerCase(TR_LOCALE).trim();
}

export function equalsIgnoreCaseTurkish(a: string, b: string): boolean {
  return normalizeTurkish(a) === normalizeTurkish(b);
}

export const PASSWORD_RULE_MESSAGE =
  'Şifre en az 6 karakter olmalı; en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.';

export function validatePassword(password: string): string | null {
  if (password.length < 6) return PASSWORD_RULE_MESSAGE;
  if (!/[A-Z]/.test(password)) return PASSWORD_RULE_MESSAGE;
  if (!/[a-z]/.test(password)) return PASSWORD_RULE_MESSAGE;
  if (!/[0-9]/.test(password)) return PASSWORD_RULE_MESSAGE;
  return null;
}

export function formatMatchDate(matchDate: string | null): { date: string; time: string; full: string } {
  if (!matchDate) return { date: 'Tarih Belirtilmemiş', time: '--:--', full: 'Tarih Belirtilmemiş' };
  const d = new Date(matchDate);
  if (isNaN(d.getTime())) return { date: 'Tarih Belirtilmemiş', time: '--:--', full: 'Tarih Belirtilmemiş' };
  const date = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const weekday = d.toLocaleDateString('tr-TR', { weekday: 'long' });
  return { date, time, full: `${weekday}, ${date} · ${time}` };
}

export function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}
