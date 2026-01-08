import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../Services/Storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const storageService = inject(StorageService);

  // Rutas que no requieren autenticación
  const publicRoutes = ['/', '/login', '/index', '/listar-productos-usuario'];

  // Verifica si la ruta actual está en las rutas públicas
  const currentPath = route.url[0]?.path; // Accede al primer segmento de la URL
  if (publicRoutes.includes(currentPath)) {
    return true; // Permitir acceso a rutas públicas
  }

  // Verifica si estamos en un entorno del navegador
  if (typeof window !== 'undefined') {
    const token = storageService.getItem('token');

    // Si no hay token, redirige al usuario a la página de inicio
    if (!token) {
      router.navigate(['/index']);
      return false;
    }

    // Si hay token, verifica roles y permisos
    const roles: string[] = JSON.parse(localStorage.getItem('roles') || '[]');
    const permisos: string[] = JSON.parse(
      localStorage.getItem('permisos') || '[]'
    );

    // Obtener los roles y permisos requeridos para la ruta
    const requiredRoles: string[] = route.data['roles'] || [];
    const requiredPermisos: string[] = route.data['permisos'] || [];

    // Verificar si el usuario tiene al menos un rol y permiso requerido
    const hasRole =
      requiredRoles.length === 0 ||
      requiredRoles.some((role) => roles.includes(role));
    const hasPermission =
      requiredPermisos.length === 0 ||
      requiredPermisos.some((permiso) => permisos.includes(permiso));

    // Si no tiene el rol o permiso requerido, redirigir a una página de acceso denegado
    if (!hasRole || !hasPermission) {
      router.navigate(['/panel-control']); // Cambia esto a la ruta que desees
      return false;
    }

    // Si hay un token y el usuario tiene roles y permisos, permite el acceso a la ruta
    return true;
  } else {
    // Si no estamos en un entorno del navegador, redirige a la página de inicio
    router.navigate(['/index']);
    return false;
  }
};
