// model-panel.ts

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
  password: string; // Considera no incluir la contraseña en el modelo que se envía al frontend
  ci: string;
  ci_departamento: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  estado_Usuario: boolean;
  imagen_url: string;
}

export interface Categoria {
  id: number;
  nombre_categoria: string;
  descripcion: string;
  estado_categoria: boolean;
}

export interface Productos {
  id: number;
  nombre_producto: string;
  descripcion: string;
  precio_compra: number; // Decimal en Django
  precio_unitario: number; // Decimal en Django
  precio_mayor: number; // Decimal en Django
  stock: number; // PositiveIntegerField en Django
  codigo_producto: string;
  categoria: Categoria; // Relación con la categoría
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  imagen_productos: string;
  estado_equipo: boolean;
}

// venta.model.ts
export interface Ventas {
  id: number;
  total: number;
  fecha_venta: Date;
  estado: string;
  usuario: {
    id: number;
    nombre_usuario: string;
  };
}

// detalle-venta.model.ts

export interface DetalleVentas {
  id: number;
  cantidad: number;
  subtotal: number;
  producto: {
    id: number;
    nombre_producto: string;
    categoria: {
      id: number;
      nombre_categoria: string;
    };
  };
}
