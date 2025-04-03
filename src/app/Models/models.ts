export interface Role {
  id: number;
  nombre_rol: string;
  estado_Rol: boolean;
}

export interface Permiso {
  id: number;
  nombre_permiso: string;
  descripcion: string;
  estado_Permiso: boolean;
}

export interface Usuario {
  id: number;
  nombre_usuario: string;
  apellido: string;
  fecha_nacimiento: Date;
  telefono: string;
  correo: string;
  password: string;
  ci: string;
  ci_departamento: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  estado_Usuario: boolean;
  imagen_url: string;
}

export interface UsuarioRol {
  id: number;
  usuario: Usuario; // Debe ser un objeto completo de Usuario
  rol: Role; // Debe ser un objeto completo de Role
}

export interface RolePermiso {
  id: number;
  rol: Role;
  permiso: Permiso;
}

/* esta es la seccion de de ventas  */

export interface Categoria {
  id: number;
  nombre_categoria: string;
  descripcion: string;
  estado_categoria: boolean;
}

export interface Producto {
  id: number;
  nombre_producto: string;
  descripcion: string;
  precio_compra: number;
  precio_unitario: number;
  precio_mayor: number;
  stock: number;
  codigo_producto: string;
  categoria: Categoria; // Relación con la categoría
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  imagen_productos: string;
  estado_equipo: boolean;
}

export interface Venta {
  id: number;
  fecha_venta: Date;
  usuario: Usuario; // Relación con el Usuario que hizo la venta
  estado: string; // Nueva variable 'estado'
  total: number; // Nueva variable 'total'
}

export interface DetalleVenta {
  id: number;
  venta: Venta;
  producto: Producto; // Relación con el producto
  cantidad: number;
  precio: number;
  subtotal: number; // Nueva variable 'subtotal'
  tipo_venta: string; // Tipo de venta (detalle o mayor)
}
