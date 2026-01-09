import { Routes } from '@angular/router';
import { IndexComponent } from './components/Index/index.component';
import { LoginComponent } from './components/Login/login.component';
import { PanelControlComponent } from './components/PanelControl/panel-control.component';
import { RegistrarUsuarioComponent } from './components/Usuarios/registrar-usuario/registrar-usuario.component';
import { EditarUsuarioComponent } from './components/Usuarios/editar-usuario/editar-usuario.component';
import { ListarUsuarioComponent } from './components/Usuarios/listar-usuario/listar-usuario.component';
import { RegistrarRolComponent } from './components/Roles/registrar-rol/registrar-rol.component';
import { EditarRolComponent } from './components/Roles/editar-rol/editar-rol.component';
import { ListarRolComponent } from './components/Roles/listar-rol/listar-rol.component';
import { RegistrarPermisoComponent } from './components/Permisos/registrar-permiso/registrar-permiso.component';
import { EditarPermisoComponent } from './components/Permisos/editar-permiso/editar-permiso.component';
import { ListarPermisoComponent } from './components/Permisos/listar-permiso/listar-permiso.component';
import { RegistrarUsuarioRolComponent } from './components/UsuariosRoles/registrar-usuario-rol/registrar-usuario-rol.component';
import { EditarUsuarioRolComponent } from './components/UsuariosRoles/editar-usuario-rol/editar-usuario-rol.component';
import { ListarUsuarioRolComponent } from './components/UsuariosRoles/listar-usuario-rol/listar-usuario-rol.component';
import { RegistrarRolPermisoComponent } from './components/RolesPermisos/registrar-rol-permiso/registrar-rol-permiso.component';
import { EditarRolPermisoComponent } from './components/RolesPermisos/editar-rol-permiso/editar-rol-permiso.component';
import { ListarRolPermisoComponent } from './components/RolesPermisos/listar-rol-permiso/listar-rol-permiso.component';
import { RegistrarCategoriaComponent } from './components/Categorias/registrar-categoria/registrar-categoria.component';
import { EditarCategoriaComponent } from './components/Categorias/editar-categoria/editar-categoria.component';
import { ListarCategoriaComponent } from './components/Categorias/listar-categoria/listar-categoria.component';
import { RegistrarProductoComponent } from './components/Productos/registrar-producto/registrar-producto.component';
import { EditarProductoComponent } from './components/Productos/editar-producto/editar-producto.component';
import { ListarProductoComponent } from './components/Productos/listar-producto/listar-producto.component';
import { ListarVentaComponent } from './components/Ventas/listar-venta/listar-venta.component';
import { ListarDetalleVentaComponent } from './components/DetalleVentas/listar-detalle-venta/listar-detalle-venta.component';
import { ListarProductosEmpleadoComponent } from './components/Productos/listar-productos-empleado/listar-productos-empleado.component';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './components/Dashboard/dashboard/dashboard.component';
import { PerfilComponent } from './components/Usuarios/perfil/perfil.component';
import { TargetasComponent } from './components/CalculoTargetas/targetas/targetas.component';
import { EjBarraComponent } from './components/ej-barra/ej-barra.component';
import { RegistrarRecargaProductoComponent } from './components/juegos/registrar-recarga-producto/registrar-recarga-producto.component';
import { EditarRecargaProductoComponent } from './components/juegos/editar-recarga-producto/editar-recarga-producto.component';
import { ListarRecargaProductoComponent } from './components/juegos/listar-recarga-producto/listar-recarga-producto.component';
import { RegistrarDetalleVentaRecargaComponent } from './components/juegos/registrar-detalle-venta-recarga/registrar-detalle-venta-recarga.component';
import { EditarDetalleVentaRecargaComponent } from './components/juegos/editar-detalle-venta-recarga/editar-detalle-venta-recarga.component';
import { ListarDetalleVentaRecargaComponent } from './components/juegos/listar-detalle-venta-recarga/listar-detalle-venta-recarga.component';
import { EfectivoComponent } from './components/efectivo/efectivo.component';
import { RecargamaxComponent } from './components/recargamax/recargamax.component';


export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'index', component: IndexComponent },
  { path: 'login', component: LoginComponent },

  {
    path: 'panel-control',
    component: PanelControlComponent,
    canActivate: [authGuard],  // Agregado: Protege toda la ruta del panel
    children: [
      /* ================= USUARIOS ================= */
      { path: 'registrar-usuarios', component: RegistrarUsuarioComponent },
      { path: 'editar-usuarios/:id', component: EditarUsuarioComponent },
      { path: 'listar-usuarios', component: ListarUsuarioComponent },

      /* ================= ROLES ================= */
      { path: 'registrar-roles', component: RegistrarRolComponent },
      { path: 'editar-roles/:id', component: EditarRolComponent },
      { path: 'listar-roles', component: ListarRolComponent },

      /* ================= PERMISOS ================= */
      { path: 'registrar-permisos', component: RegistrarPermisoComponent },
      { path: 'editar-permisos/:id', component: EditarPermisoComponent },
      { path: 'listar-permisos', component: ListarPermisoComponent },

      /* ========== USUARIO - ROLES ========== */
      { path: 'registrar-usuarios-roles', component: RegistrarUsuarioRolComponent },
      { path: 'editar-usuarios-roles/:id', component: EditarUsuarioRolComponent },
      { path: 'listar-usuarios-roles', component: ListarUsuarioRolComponent },

      /* ========== ROLES - PERMISOS ========== */
      { path: 'registrar-roles-permisos', component: RegistrarRolPermisoComponent },
      { path: 'editar-roles-permisos/:id', component: EditarRolPermisoComponent },
      { path: 'listar-roles-permisos', component: ListarRolPermisoComponent },

      /* ================= CATEGORÍAS ================= */
      { path: 'registrar-categorias', component: RegistrarCategoriaComponent },
      { path: 'editar-categorias/:id', component: EditarCategoriaComponent },
      { path: 'listar-categorias', component: ListarCategoriaComponent },

      /* ================= PRODUCTOS ================= */
      { path: 'registrar-productos', component: RegistrarProductoComponent },
      { path: 'editar-productos/:id', component: EditarProductoComponent },
      { path: 'listar-productos', component: ListarProductoComponent },
      { path: 'listar-productos-empleado', component: ListarProductosEmpleadoComponent },


      /* ================= JUEGOS ================= */
      { path: 'registrar-RecargaProducto', component: RegistrarRecargaProductoComponent },
      { path: 'editar-RecargaProducto/:id', component: EditarRecargaProductoComponent },
      { path: 'listar-RecargaProducto', component: ListarRecargaProductoComponent },
      
      /* ================= JUEGOS ================= */
      { path: 'registrar-DetalleVentaRecarga', component: RegistrarDetalleVentaRecargaComponent },
      { path: 'editar-DetalleVentaRecarga/:id', component: EditarDetalleVentaRecargaComponent },
      { path: 'listar-DetalleVentaRecarga', component: ListarDetalleVentaRecargaComponent },

      /* ================= VENTAS ================= */
      { path: 'listar-ventas', component: ListarVentaComponent },
      { path: 'listar-detalle-ventas', component: ListarDetalleVentaComponent },

      { path: 'efectivo', component: EfectivoComponent },
      { path: 'recargamax', component: RecargamaxComponent },

      /* ================= DASHBOARD / PERFIL ================= */
      { path: 'dashboardComponent', component: DashboardComponent },
      { path: 'perfil', component: PerfilComponent },

      /* ================= TARJETAS ================= */
      { path: 'targetas', component: TargetasComponent },

      /* ================= DEFAULT ================= */
      { path: '', component: DashboardComponent },  // Cambiado: Usa DashboardComponent como default (asegúrate de que exista)
    ],
  },
];