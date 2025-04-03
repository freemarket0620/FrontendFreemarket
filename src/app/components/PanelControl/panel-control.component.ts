import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServicesService } from '../../Services/services.service';
import { HttpClientModule } from '@angular/common/http';
import { EditarUsuarioComponent } from '../Usuarios/editar-usuario/editar-usuario.component';
import { RegistrarUsuarioComponent } from '../Usuarios/registrar-usuario/registrar-usuario.component';
import { ListarUsuarioComponent } from '../Usuarios/listar-usuario/listar-usuario.component';
import { ListarRolComponent } from '../Roles/listar-rol/listar-rol.component';
import { RegistrarRolComponent } from '../Roles/registrar-rol/registrar-rol.component';
import { EditarRolComponent } from '../Roles/editar-rol/editar-rol.component';
import { ListarPermisoComponent } from '../Permisos/listar-permiso/listar-permiso.component';
import { RegistrarPermisoComponent } from '../Permisos/registrar-permiso/registrar-permiso.component';
import { EditarPermisoComponent } from '../Permisos/editar-permiso/editar-permiso.component';
import { ListarUsuarioRolComponent } from '../UsuariosRoles/listar-usuario-rol/listar-usuario-rol.component';
import { RegistrarUsuarioRolComponent } from '../UsuariosRoles/registrar-usuario-rol/registrar-usuario-rol.component';
import { EditarUsuarioRolComponent } from '../UsuariosRoles/editar-usuario-rol/editar-usuario-rol.component';
import { ListarRolPermisoComponent } from '../RolesPermisos/listar-rol-permiso/listar-rol-permiso.component';
import { RegistrarRolPermisoComponent } from '../RolesPermisos/registrar-rol-permiso/registrar-rol-permiso.component';
import { EditarRolPermisoComponent } from '../RolesPermisos/editar-rol-permiso/editar-rol-permiso.component';
import { ListarCategoriaComponent } from '../Categorias/listar-categoria/listar-categoria.component';
import { RegistrarCategoriaComponent } from '../Categorias/registrar-categoria/registrar-categoria.component';
import { EditarCategoriaComponent } from '../Categorias/editar-categoria/editar-categoria.component';
import { ListarProductoComponent } from '../Productos/listar-producto/listar-producto.component';
import { RegistrarProductoComponent } from '../Productos/registrar-producto/registrar-producto.component';
import { EditarProductoComponent } from '../Productos/editar-producto/editar-producto.component';
import { ListarDetalleVentaComponent } from '../DetalleVentas/listar-detalle-venta/listar-detalle-venta.component';
import { ListarVentaComponent } from '../Ventas/listar-venta/listar-venta.component';
import { StorageService } from '../../Services/Storage.service';
import { ListarProductosEmpleadoComponent } from '../Productos/listar-productos-empleado/listar-productos-empleado.component';
import { DashboardComponent } from '../Dashboard/dashboard/dashboard.component';
import { PerfilComponent } from '../Usuarios/perfil/perfil.component';
import { TargetasComponent } from '../CalculoTargetas/targetas/targetas.component';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RegistrarUsuarioComponent,
    EditarUsuarioComponent,
    ListarUsuarioComponent,
    ListarRolComponent,
    RegistrarRolComponent,
    EditarRolComponent,
    ListarPermisoComponent,
    RegistrarPermisoComponent,
    EditarPermisoComponent,
    ListarUsuarioRolComponent,
    RegistrarUsuarioRolComponent,
    EditarUsuarioRolComponent,
    ListarRolPermisoComponent,
    RegistrarRolPermisoComponent,
    EditarRolPermisoComponent,
    ListarCategoriaComponent,
    RegistrarCategoriaComponent,
    EditarCategoriaComponent,
    RegistrarProductoComponent,
    EditarProductoComponent,
    ListarProductoComponent,
    ListarDetalleVentaComponent,
    ListarVentaComponent,
    ListarProductosEmpleadoComponent,
    DashboardComponent,
    PerfilComponent,
    TargetasComponent,
  ],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.css',
})
export class PanelControlComponent implements OnInit {
  permisos: string[] = [];
  roles: string[] = [];
  nombre_usuario: string = '';
  apellido: string | null = '';
  imagenUrl: string | null = '';
  usuario_id: number = 0;

  componenteActual: string = 'app-dashboard'; // Componente activo actual
  idParaEditar: number = 0; //

  isSidebarOpen = false;
  iconClass: string = 'fas fa-bars';
  windowWidth: number = 0; // Inicializa en 0

  private openSubmenu: string | null = null;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private authService: ServicesService
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.windowWidth = window.innerWidth;
    this.isSidebarOpen = this.windowWidth >= 768;
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const token = this.storageService.getItem('token');
      if (!token) {
        this.router.navigate(['/index']); // Redirigir al login si no hay token
        return;
      }

      // Resto de tu lógica para cargar datos del usuario
      this.windowWidth = window.innerWidth;
      this.isSidebarOpen = this.windowWidth >= 768;

      const usuario = this.getUsuarioLocalStorage();
      if (usuario) {
        this.nombre_usuario = usuario.nombre_usuario || '';
        this.apellido = usuario.apellido || '';
        this.permisos = usuario.permisos || [];
        this.roles = usuario.roles || [];
        this.imagenUrl = usuario.imagen_url || '';
        this.usuario_id = usuario.usuario_id || 0;
      }

      // Cargar roles y permisos desde localStorage
      this.roles = JSON.parse(localStorage.getItem('roles') || '[]');
      this.permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
    } else {
      console.warn('localStorage no está disponible en este entorno.');
    }
  }
  private getUsuarioLocalStorage() {
    if (typeof window !== 'undefined') {
      // Verifica si localStorage está disponible
      try {
        const usuario = localStorage.getItem('usuario');
        return usuario ? JSON.parse(usuario) : null;
      } catch (error) {
        console.error('Error al recuperar usuario de localStorage', error);
        return null;
      }
    }
    return null; // Devuelve null si localStorage no está disponible
  }

  puedeVer(permiso: string): boolean {
    return this.permisos.includes(permiso);
  }
  // Ejemplo de cómo establecer un token
  login() {
    const token = 'mi_token_de_ejemplo'; // Este sería el token que obtienes al iniciar sesión
    this.storageService.setItem('token', token);
  }

  logout(): void {
    this.storageService.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('roles');
    localStorage.removeItem('permisos');
    this.router.navigate(['/index']);
  }
  onLogout() {
    this.authService.logout();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.iconClass = this.isSidebarOpen ? 'fas fa-bars' : 'fas fa-times';
  }

  // Método para confirmar el cierre de sesión
  confirmarCerrarSesion() {
    console.log('Intentando cerrar sesión...');
    if (window.confirm('¿Está seguro de que desea cerrar sesión?')) {
      this.logout(); // Si el usuario acepta, se cierra sesión
    } else {
      console.log('Cierre de sesión cancelado.');
    }
  }

  // Método para manejar el evento de selección
  onSelectChange(action: string) {
    if (action === 'cerrarSesion') {
      this.confirmarCerrarSesion(); // Maneja el cierre de sesión
    }
  }

  toggleSubmenu(menu: string) {
    // Alterna el estado del submenú
    if (this.openSubmenu === menu) {
      this.openSubmenu = null; // Cierra el submenú si ya está abierto
    } else {
      this.openSubmenu = menu; // Abre el submenú seleccionado
    }
  }
  mostrarComponente(componente: string, id?: number) {
    this.componenteActual = componente; // Cambia el componente actual
    if (id) {
      this.idParaEditar = id; // Establece el ID si se proporciona
    }

    // Mantener el submenú abierto si se selecciona un componente dentro de su grupo
    if (componente.includes('Usuario')) {
      this.openSubmenu = 'usuarios'; // Mantiene abierto el submenú de Usuarios
    } else if (componente.includes('Prestamos')) {
      this.openSubmenu = 'prestamos'; // Mantiene abierto el submenú de Préstamos
    } else if (componente.includes('Ventas')) {
      this.openSubmenu = 'VentasProductos'; // Mantiene abierto el submenú de Productos Ventas
    }
  }
  handleItemClick() {
    // Cierra el submenú si se hace clic en un elemento que no es un encabezado de submenú
    this.openSubmenu = null;
  }

  isSubmenuOpen(menu: string): boolean {
    return this.openSubmenu === menu; // Verifica si el submenú está abierto
  }
}
