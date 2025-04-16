import { Component, OnInit } from '@angular/core';
import { DetalleVentas, Productos, Ventas } from '../../../Models/model-panel';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  productos: Productos[] = [];
  ventas: Ventas[] = [];
  venta: Ventas | null = null;
  detallesVenta: DetalleVentas[] = [];
  detalles: DetalleVentas[] = [];

  productosVendidos: any[] = [];
  productoMasVendido: any;

  ventasCantidadPorUsuario: any[] = [];
  ventasPorUsuarioGrafico: { name: string, value: number }[] = [];

  ventasCantidadTotalPorUsuario: any[] = [];
  ventasTotalesPorUsuarioGrafico: { name: string, value: number }[] = [];

  ventasPorProducto: any[] = [];
  ventasPorCategoria: any[] = [];
  ventasPorFecha: any[] = [];
  estadoVentas: any[] = [];

  totalDineroVendido: number = 0;
  graficoTotalDinero: { name: string, value: number }[] = [];

  ventasResumenPorUsuario: { name: string, value: number, total: number }[] = [];

  colorScheme = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(
    private route: ActivatedRoute,
    private services: ServicesService
  ) {}

  ngOnInit(): void {
    let totalGlobal = 0;
    this.cargarDatos();

    this.services.getProductos();
    this.services.getVentas();
    this.services.getDetalleVentas();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.services.getVentaByIdPanel(+id).subscribe((ventaData: Ventas) => {
        this.venta = ventaData;
      });

      this.services.getDetalleVentasPanel().subscribe((detalleData: DetalleVentas[]) => {
        this.detalles = detalleData;
      });
    }
  }

  cargarDatos(): void {
    this.obtenerProductos();
    this.obtenerVentas();
    this.obtenerDetallesVenta();
  }

  private obtenerProductos(): void {
    this.services.getProductosPanel().subscribe((productos: Productos[]) => {
      this.productos = productos;
      this.generarDatosProductos();
    });
  }

  private obtenerVentas(): void {
    this.services.getVentasPanel().subscribe((ventas: Ventas[]) => {
      this.ventas = ventas;
      this.procesarVentas(ventas);
    });
  }

  private obtenerDetallesVenta(): void {
    this.services.getDetalleVentasPanel().subscribe((detalles: DetalleVentas[]) => {
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

  private procesarVentas(ventas: Ventas[]): void {
    const cantidadVentasPorUsuarioMap = new Map<string, number>();
    const totalVentasPorUsuarioMap = new Map<string, number>();
    const ventasPorFechaMap = new Map<string, number>();
    const estadoVentasMap = new Map<string, number>();
    this.ventasTotalesPorUsuarioGrafico = [];

    let totalGlobal = 0;

    ventas.forEach(venta => {
      const usuario = venta.usuario?.nombre_usuario || 'Desconocido';
      const total = parseFloat(venta.total.toString()) || 0;
      const fecha = new Date(venta.fecha_venta).toLocaleDateString();
      const estado = venta.estado;

      this.incrementarMapa(cantidadVentasPorUsuarioMap, usuario, 1);
      this.incrementarMapa(totalVentasPorUsuarioMap, usuario, total);
      this.incrementarMapa(ventasPorFechaMap, fecha, total);
      this.incrementarMapa(estadoVentasMap, estado, 1);

      totalGlobal += total;
    });

    this.totalDineroVendido = totalGlobal;
    this.graficoTotalDinero = [{ name: 'Total Vendido', value: this.totalDineroVendido }];

    this.ventasCantidadPorUsuario = this.mapToArray(cantidadVentasPorUsuarioMap);
    this.ventasPorUsuarioGrafico = [...this.ventasCantidadPorUsuario];

    this.ventasCantidadTotalPorUsuario = this.mapToArray(totalVentasPorUsuarioMap);
    this.ventasTotalesPorUsuarioGrafico = [...this.ventasCantidadTotalPorUsuario];

    // Fusión correcta de ventas y totales para la vista combinada
    this.ventasResumenPorUsuario = this.ventasCantidadPorUsuario.map(item => {
      const totalEncontrado = this.ventasTotalesPorUsuarioGrafico.find(t => t.name === item.name);
      return {
        name: item.name,
        value: item.value,
        total: totalEncontrado ? totalEncontrado.value : 0
      };
    });

    this.ventasPorFecha = [{
      name: 'Ventas',
      series: this.mapToArray(ventasPorFechaMap)
    }];

    this.estadoVentas = this.mapToArray(estadoVentasMap);
  }

  private procesarDetallesVenta(detalles: DetalleVentas[]): void {
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

  private incrementarMapa(map: Map<string, number>, key: string, valor: number): void {
    map.set(key, (map.get(key) || 0) + valor);
  }

  private mapToArray(map: Map<string, number>): { name: string, value: number }[] {
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }
}
