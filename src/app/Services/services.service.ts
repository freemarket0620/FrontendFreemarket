import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Categoria,
  DetalleVenta,
  Permiso,
  Producto,
  Role,
  RolePermiso,
  Usuario,
  UsuarioRol,
  Venta,
} from '../Models/models';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';

// Define una interfaz para la respuesta del login
interface LoginResponse {
  access_token: string;
  roles: string[];
  permisos: string[];
  nombre_usuario: string; // Agregar esta línea
  apellido: string; // Agregar esta línea
  imagen_url: string; // Agregar esta línea
  usuario_id: number; // Agregar esta línea
}

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  private apiUrl = 'http://localhost:8000/api/';
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  productos$ = this.productosSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    if (typeof window !== 'undefined') {
      this.windowWidthSubject.next(window.innerWidth);
      window.addEventListener('resize', () => {
        this.windowWidthSubject.next(window.innerWidth);
      });
    }
  }
  // Sección de autenticación
  login(correo: string, password: string): Observable<LoginResponse> {
    // Cambia el tipo de retorno aquí
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { correo, password };

    return this.http
      .post<LoginResponse>(`${this.apiUrl}login/`, body, { headers })
      .pipe(
        tap((response) => {
          console.log(response); // Muestra la respuesta completa del backend

          // Almacenar el token de acceso, roles y permisos
          if (response.access_token) {
            localStorage.setItem('token', response.access_token);
            localStorage.setItem('roles', JSON.stringify(response.roles));
            localStorage.setItem('permisos', JSON.stringify(response.permisos));
            localStorage.setItem(
              'usuario',
              JSON.stringify({
                nombre_usuario: response.nombre_usuario,
                apellido: response.apellido,
                imagen_url: response.imagen_url,
                usuario_id: response.usuario_id,
                rol: response.roles[0],
              })
            ); // Almacenar información del usuario
          }
        })
      );
  }
  getRolesFromLocalStorage(): string[] {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }
  // Obtener el usuario desde localStorage
  private getUserFromLocalStorage(): Usuario | null {
    const user = localStorage.getItem('usuario');
    return user ? JSON.parse(user) : null;
  }
  // Verificar si el usuario está autenticado (Token presente en localStorage)
  isAuthenticated(): boolean {
    return localStorage.getItem('token') !== null;
  }

  // Obtener el token del almacenamiento local
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Establecer las cabeceras con el token de autenticación
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Función para manejar el cierre de sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('usuario_id');
    this.router.navigate(['/login']);
  }

  getUsuarioLocalStorage() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null; // Asegúrate de que el usuario se parsea correctamente
  }
  /* esto para manejo de errores en Windowes  */
  private windowWidthSubject = new BehaviorSubject<number>(0);
  windowWidth$ = this.windowWidthSubject.asObservable();

  /* ---------------------------- usuario ---------------------------- */
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}usuarios/`);
  }
  getUserById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}usuarios/${id}/`);
  }
  registrarUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}usuarios/`, usuario);
  }
  editarUsuario(id: number, usuario: FormData): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}usuarios/${id}/`, usuario);
  }
  actualizarEstadoUsuario(
    id: number,
    estado_Usuario: boolean
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}usuarios/${id}/`, {
      estado_Usuario: estado_Usuario ? 'true' : 'false',
    });
  }
  // Cambia el nombre de editarUsuario a actualizarUsuario
  actualizarUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}usuarios/${id}/`, usuario);
  }
  /* ----------------------------perfil----------------------------  */

  /* seigue la seecionde de usuario  */
  // Método para obtener el ID del usuario desde localStorage

  /* ---------------------------- roles ---------------------------- */

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}roles/`);
  }
  // Obtener un rol por ID
  getRolesById(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}roles/${id}/`);
  }

  registrarRoles(roles: Role): Observable<Role> {
    return this.http.post<Role>(`${this.apiUrl}roles/`, roles);
  }
  editarRoles(id: number, roles: Role): Observable<Role> {
    return this.http.put<Role>(`${this.apiUrl}roles/${id}/`, roles);
  }
  actualizarEstadoRol(id: number, estado_Rol: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}roles/${id}/`, {
      estado_Rol: estado_Rol ? 'true' : 'false',
    });
  }
  /* ---------------------------- permisos ---------------------------- */

  getPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(`${this.apiUrl}permisos/`);
  }
  // Obtener un rol por ID
  getPermisosById(id: number): Observable<Permiso> {
    return this.http.get<Permiso>(`${this.apiUrl}permisos/${id}/`);
  }

  registrarPermisos(permisos: Permiso): Observable<Permiso> {
    return this.http.post<Permiso>(`${this.apiUrl}permisos/`, permisos);
  }
  editarPermisos(id: number, permisos: Permiso): Observable<Permiso> {
    return this.http.put<Permiso>(`${this.apiUrl}permisos/${id}/`, permisos);
  }
  actualizarEstadoPermisos(
    id: number,
    estado_Permiso: boolean
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}permisos/${id}/`, {
      estado_Permiso: estado_Permiso ? 'true' : 'false',
    });
  }

  /* ---------------------------- UsuarioRol ---------------------------- */

  getUsuariosRoles(): Observable<UsuarioRol[]> {
    return this.http.get<UsuarioRol[]>(`${this.apiUrl}usuariosroles/`);
  }

  getUsuarioRolById(id: number): Observable<UsuarioRol> {
    return this.http.get<UsuarioRol>(`${this.apiUrl}usuariosroles/${id}/`);
  }

  registrarUsuarioRol(usuarioRol: UsuarioRol): Observable<UsuarioRol> {
    return this.http.post<UsuarioRol>(
      `${this.apiUrl}usuariosroles/`,
      usuarioRol
    );
  }

  editarUsuarioRol(id: number, usuarioRol: UsuarioRol): Observable<UsuarioRol> {
    return this.http.put<UsuarioRol>(
      `${this.apiUrl}usuariosroles/${id}/`,
      usuarioRol
    );
  }

  /* ---------------------------- RolePermiso ---------------------------- */

  getRolesPermisos(): Observable<RolePermiso[]> {
    return this.http.get<RolePermiso[]>(`${this.apiUrl}rolespermisos/`);
  }

  getRolePermisoById(id: number): Observable<RolePermiso> {
    return this.http.get<RolePermiso>(`${this.apiUrl}rolespermisos/${id}/`);
  }

  registrarRolePermiso(rolePermiso: RolePermiso): Observable<RolePermiso> {
    return this.http.post<RolePermiso>(
      `${this.apiUrl}rolespermisos/`,
      rolePermiso
    );
  }

  editarRolePermiso(
    id: number,
    rolePermiso: RolePermiso
  ): Observable<RolePermiso> {
    return this.http.put<RolePermiso>(
      `${this.apiUrl}rolespermisos/${id}/`,
      rolePermiso
    );
  }

  /* ---------------------------- ---------- ---------------------------- */
  /* ---------------------------- CATEGORÍAS ---------------------------- */
  /* ---------------------------- CATEGORÍAS ---------------------------- */
  /* ---------------------------- ---------- ---------------------------- */

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}categorias/`);
  }
  getCategoriaById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}categorias/${id}/`);
  }
  crearCategoria(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.apiUrl}categorias/`, categoria);
  }
  actualizarCategoria(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(
      `${this.apiUrl}categorias/${id}/`,
      categoria
    );
  }
  actualizarEstadoCategoria(
    id: number,
    estado_categoria: boolean
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}categorias/${id}/`, {
      estado_categoria: estado_categoria ? 'true' : 'false',
    });
  }
  /* ---------------------------- PRODUCTOS ---------------------------- */
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}productos/`);
  }
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}productos/${id}/`);
  }
  crearProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}productos/`, producto);
  }
  actualizarProducto(id: number, producto: FormData): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}productos/${id}/`, producto);
  }
  actualizarEstadoProducto(
    id: number,
    estado_equipo: boolean
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}productos/${id}/`, {
      estado_equipo: estado_equipo ? 'true' : 'false',
    });
  }
  /* ---------------------------- VENTAS ---------------------------- */

  getVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.apiUrl}ventas/`);
  }
  getVentaById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}ventas/${id}/`);
  }
  crearVenta(venta: Venta): Observable<Venta> {
    return this.http.post<Venta>(`${this.apiUrl}ventas/`, venta);
  }
  actualizarVenta(id: number, venta: Venta): Observable<Venta> {
    return this.http.put<Venta>(`${this.apiUrl}ventas/${id}/`, venta);
  }

  /* ---------------------------- DETALLES DE VENTAS ---------------------------- */
  getDetalleVentas(): Observable<DetalleVenta[]> {
    return this.http.get<DetalleVenta[]>(`${this.apiUrl}detallesventas/`);
  }
  getDetalleVentaById(id: number): Observable<DetalleVenta> {
    return this.http.get<DetalleVenta>(`${this.apiUrl}detallesventas/${id}/`);
  }

  crearDetalleVenta(detalleventas: DetalleVenta): Observable<DetalleVenta> {
    return this.http.post<DetalleVenta>(`${this.apiUrl}detallesventas/`, {
      ...detalleventas,
      producto_id: detalleventas.producto.id, // Asegúrate de enviar el ID del producto
    });
  }

  actualizarDetalleVenta(
    id: number,
    detallesVenta: DetalleVenta
  ): Observable<DetalleVenta> {
    return this.http.put<DetalleVenta>(
      `${this.apiUrl}detallesventas/${id}/`,
      detallesVenta
    );
  }
  /* SECCION DE VENTAS  Y DE TALLE VENTAS  */
  verificarUsuario(usuario_id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}usuarios/${usuario_id}`);
  }
  registrarVenta(ventaData: any): Observable<Venta> {
    const usuario = this.getUserFromLocalStorage(); // Obtener los datos del usuario desde localStorage
    if (usuario) {
      const ventaConUsuario = {
        ...ventaData,
        usuario: usuario.id,
      };

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getToken()}`, // Aquí aseguramos el envío del token
      });

      return this.http.post<Venta>(`${this.apiUrl}ventas/`, ventaConUsuario, {
        headers,
      });
    } else {
      throw new Error('Usuario no autenticado');
    }
  }
}
