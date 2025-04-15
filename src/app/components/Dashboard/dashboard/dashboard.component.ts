import { Component, OnInit } from '@angular/core';
import { DetalleVenta, Producto, Venta } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  /* https://swimlane.github.io/ngx-charts/#/ngx-charts/bar-vertical-2d */
  // Datos
  productos: Producto[] = [];
  ventas: Venta[] = [];
  detallesVenta: DetalleVenta[] = [];

  // Datos procesados para gráficos
  productosVendidos: any[] = [];
  productoMasVendido: any;
  ventasPorUsuario: any[] = [];
  ventasPorProducto: any[] = [];
  ventasPorCategoria: any[] = [];
  ventasPorFecha: any[] = [];
  estadoVentas: any[] = [];

  // Esquema de colores para gráficos
  colorScheme = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(private services: ServicesService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.obtenerProductos();
    this.obtenerVentas();
    this.obtenerDetallesVenta();
  }

  private obtenerProductos(): void {
    this.services.getProductos().subscribe((productos: Producto[]) => {
      this.productos = productos;
      this.generarDatosProductos();
    });
  }

  private obtenerVentas(): void {
    this.services.getVentas().subscribe((ventas: Venta[]) => {
      this.ventas = ventas;
      this.procesarVentas(ventas);
    });
  }

  private obtenerDetallesVenta(): void {
    this.services.getDetalleVentas().subscribe((detalles: DetalleVenta[]) => {
      this.detallesVenta = detalles;
      this.procesarDetallesVenta(detalles);
    });
  }

  private generarDatosProductos(): void {
    this.productosVendidos = this.productos.map(producto => ({
      name: producto.nombre_producto,
      value: producto.stock
    }));

    this.productoMasVendido = this.productos.reduce((prev, curr) =>
      prev.stock > curr.stock ? prev : curr
    );
  }

  private procesarVentas(ventas: Venta[]): void {
    const ventasPorUsuarioMap = new Map<string, number>();
    const ventasPorFechaMap = new Map<string, number>();
    const estadoVentasMap = new Map<string, number>();

    ventas.forEach(venta => {
      const usuario = venta.usuario?.nombre_usuario || 'Desconocido';
      const total = venta.total || 0;
      const fecha = new Date(venta.fecha_venta).toLocaleDateString();
      const estado = venta.estado;

      this.incrementarMapa(ventasPorUsuarioMap, usuario, total);
      this.incrementarMapa(ventasPorFechaMap, fecha, total);
      this.incrementarMapa(estadoVentasMap, estado, 1);
    });

    this.ventasPorUsuario = this.mapToArray(ventasPorUsuarioMap);
    this.ventasPorFecha = [{
      name: 'Ventas',
      series: this.mapToArray(ventasPorFechaMap)
    }];
    this.estadoVentas = this.mapToArray(estadoVentasMap);

    console.log('Ventas por Usuario:', this.ventasPorUsuario);
  }

  private procesarDetallesVenta(detalles: DetalleVenta[]): void {
    const ventasPorProductoMap = new Map<string, number>();
    const ventasPorCategoriaMap = new Map<string, number>();

    detalles.forEach(detalle => {
      const producto = detalle.producto.nombre_producto;
      const categoria = detalle.producto.categoria.nombre_categoria;

      this.incrementarMapa(ventasPorProductoMap, producto, detalle.cantidad);
      this.incrementarMapa(ventasPorCategoriaMap, categoria, detalle.subtotal);
    });

    this.ventasPorProducto = this.mapToArray(ventasPorProductoMap);
    this.ventasPorCategoria = this.mapToArray(ventasPorCategoriaMap);
  }

  // Función auxiliar para incrementar valores de un mapa
  private incrementarMapa(map: Map<string, number>, key: string, valor: number): void {
    map.set(key, (map.get(key) || 0) + valor);
  }

  // Función auxiliar para convertir mapa a array de objetos
  private mapToArray(map: Map<string, number>): { name: string, value: number }[] {
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }
}
