import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString + "T00:00:00");
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatDateInput(dateString: string): string {
  return dateString;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
    case "received":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "overdue":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Pago";
    case "received":
      return "Recebido";
    case "pending":
      return "Pendente";
    case "overdue":
      return "Vencido";
    default:
      return status;
  }
}

export function isOverdue(dueDate: string, status: string): boolean {
  if (status === "paid" || status === "received") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return due < today;
}

export function getDaysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDateRange(period: "day" | "week" | "month"): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  switch (period) {
    case "day":
      return { start: today, end: today };
    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return { start: weekStart, end: weekEnd };
    }
    case "month": {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: monthStart, end: monthEnd };
    }
  }
}

export function toISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
