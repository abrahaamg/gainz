import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Primera letra en mayúscula, para usar una palabra suelta como título o etiqueta. */
export function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
