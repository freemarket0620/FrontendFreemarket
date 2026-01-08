import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../Services/Storage.service';
import { ServicesService } from '../../Services/services.service';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-control.component.html',
  styleUrls: ['./panel-control.component.css'],
})
export class PanelControlComponent implements OnInit {
  // Propiedades esenciales, alineadas con la respuesta del login
  isSidebarOpen = false;
  windowWidth: number = 0;
  userName: string = '';
  userPermissions: string[] = [];
  roles: string[] = [];  // Array de roles (leer de 'roles' en localStorage)
  nombre_usuario: string = '';
  apellido: string = '';
  imagen_url: string | null = null;
  usuario_id: number = 0;

  // Para submenús
  openSubmenu: string | null = null;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private authService: ServicesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log('PanelControlComponent: ngOnInit ejecutado');  // Log para depuración

    // Leer datos del usuario de 'usuario'
    const usuarioStr = this.storageService.getItem('usuario');
    let datosUsuario: any = {};
    try {
      datosUsuario = usuarioStr ? JSON.parse(usuarioStr) : {};
    } catch (error) {
      console.error('Error al parsear usuario desde localStorage', error);
      datosUsuario = {};
    }

    // Leer roles de 'roles' (clave separada)
    this.roles = JSON.parse(localStorage.getItem('roles') || '[]');

    // Leer permisos de 'permisos' (clave separada)
    this.userPermissions = JSON.parse(localStorage.getItem('permisos') || '[]');

    // Alinear con la respuesta del login
    this.nombre_usuario = datosUsuario.nombre_usuario ?? '';
    this.apellido = datosUsuario.apellido ?? '';
    this.userName = `${this.nombre_usuario} ${this.apellido}`.trim();
    this.imagen_url = datosUsuario.imagen_url ?? null;
    this.usuario_id = datosUsuario.usuario_id ?? 0;

    // Logs para verificar que los datos se carguen correctamente
    console.log('Datos del usuario cargados:', datosUsuario);
    console.log('Roles:', this.roles);
    console.log('Permisos:', this.userPermissions);
    console.log('Nombre completo:', this.userName);

    this.checkScreenSize();
  }

  // Verificar permisos (array)
  puedeVer(permiso: string | string[]): boolean {
    if (Array.isArray(permiso)) {
      return permiso.some(p => this.userPermissions.includes(p));
    }
    return this.userPermissions.includes(permiso);
  }

  // Verificar roles (array)
  tieneRol(rol: string): boolean {
    return this.roles.includes(rol);
  }

  // Sidebar
  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.windowWidth = window.innerWidth;
      this.isSidebarOpen = this.windowWidth >= 768;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleSubmenu(menu: string) {
    this.openSubmenu = this.openSubmenu === menu ? null : menu;
  }

  isSubmenuOpen(menu: string): boolean {
    return this.openSubmenu === menu;
  }

  // Sesión
  logout() {
    this.storageService.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('roles');
    localStorage.removeItem('permisos');
    this.router.navigate(['/index']);
  }

  confirmarCerrarSesion() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
      this.logout();
    }
  }

  verPerfil() {
    this.router.navigate(['panel-control/perfil']);
  }
  panelDeControl() {
    this.router.navigate(['panel-control/dashboardComponent']);
  }
}