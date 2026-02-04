import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'yyyy-MM-dd', { locale: ko });
}

export function formatTime(date: string): string {
  return format(parseISO(date), 'HH:mm', { locale: ko });
}

export function formatDateTime(date: string): string {
  return format(parseISO(date), 'yyyy-MM-dd HH:mm', { locale: ko });
}
