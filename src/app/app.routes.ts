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
import { RegistrarVentaComponent } from './components/Ventas/registrar-venta/registrar-venta.component';
import { EditarVentaComponent } from './components/Ventas/editar-venta/editar-venta.component';
import { ListarVentaComponent } from './components/Ventas/listar-venta/listar-venta.component';
import { RegistrarDetalleVentaComponent } from './components/DetalleVentas/registrar-detalle-venta/registrar-detalle-venta.component';
import { EditarDetalleVentaComponent } from './components/DetalleVentas/editar-detalle-venta/editar-detalle-venta.component';
import { ListarDetalleVentaComponent } from './components/DetalleVentas/listar-detalle-venta/listar-detalle-venta.component';
import { ListarProductosUsuarioComponent } from './components/Productos/listar-productos-usuario/listar-productos-usuario.component';
import { ListarProductosEmpleadoComponent } from './components/Productos/listar-productos-empleado/listar-productos-empleado.component';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './components/Dashboard/dashboard/dashboard.component';
import { PerfilComponent } from './components/Usuarios/perfil/perfil.component';

import { TargetasComponent } from './components/CalculoTargetas/targetas/targetas.component';

export const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'login', component: LoginComponent },
  { path: 'index', component: IndexComponent },
  {
    path: 'listar-productos-usuario',
    component: ListarProductosUsuarioComponent,
  },

  {
    path: 'panel-control',
    component: PanelControlComponent,
    canActivate: [authGuard],
  },

  {
    path: 'registrar-usuarios',
    component: RegistrarUsuarioComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-usuarios/:id',
    component: EditarUsuarioComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-usuarios',
    component: ListarUsuarioComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-roles',
    component: RegistrarRolComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-roles',
    component: EditarRolComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-roles',
    component: ListarRolComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-permisos',
    component: RegistrarPermisoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-permisos',
    component: EditarPermisoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-permisos',
    component: ListarPermisoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-usuarios-roles',
    component: RegistrarUsuarioRolComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-usuarios-roles',
    component: EditarUsuarioRolComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-usuarios-roles',
    component: ListarUsuarioRolComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-roles-permisos',
    component: RegistrarRolPermisoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-roles-permisos',
    component: EditarRolPermisoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-roles-permisos',
    component: ListarRolPermisoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  /* seccion de ventas de los productos  */
  {
    path: 'registrar-categorias',
    component: RegistrarCategoriaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-categorias',
    component: EditarCategoriaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-categorias',
    component: ListarCategoriaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-productos',
    component: RegistrarProductoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-productos',
    component: EditarProductoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-productos',
    component: ListarProductoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'listar-productos-empleado',
    component: ListarProductosEmpleadoComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-ventas',
    component: RegistrarVentaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-ventas',
    component: EditarVentaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-ventas',
    component: ListarVentaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },

  {
    path: 'registrar-detalle-ventas',
    component: RegistrarDetalleVentaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'editar-detalle-ventas',
    component: EditarDetalleVentaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'listar-detalle-ventas',
    component: ListarDetalleVentaComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  /* seccion de perfil y dashboard */
  {
    path: 'dashboardComponent',
    component: DashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  {
    path: 'perfil',
    component: PerfilComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
  /* esta es la seccio  de prestamos  */

  {
    path: 'targetas',
    component: TargetasComponent,
    canActivate: [authGuard],
    data: { roles: ['admin540'], permisos: ['permiso540'] },
  },
];
