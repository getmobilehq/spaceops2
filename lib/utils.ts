import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDefaultPathForRole(
  orgSlug: string,
  role: string
): string {
  switch (role) {
    case "admin":
      return `/${orgSlug}/admin/dashboard`
    case "supervisor":
      return `/${orgSlug}/supervisor/dashboard`
    case "janitor":
      return `/${orgSlug}/janitor/today`
    case "client":
      return `/${orgSlug}/client/overview`
    default:
      return "/auth/login"
  }
}
