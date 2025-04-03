import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  getItem(key: string): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(key);
    }
    return null; // Retorna null si no está disponible
  }

  // Método para establecer un elemento en localStorage
  setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  // Método para obtener un elemento de localStorage

  // Método para eliminar un elemento de localStorage
  removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  // Método para verificar si estamos en un entorno de navegador
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
