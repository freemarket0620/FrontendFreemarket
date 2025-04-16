import { Component, OnInit } from '@angular/core';
import { DetalleVentas, Productos, Ventas } from '../../../Models/model-panel';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { ActivatedRoute } from '@angular/router';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  
})
export class DashboardComponent implements OnInit {

  productos: Productos[] = [];
  ventas: Ventas[] = [];
  detallesVenta: DetalleVentas[] = [];

  venta: Ventas | null = null;

  // Gráficos
  productosVendidos: any[] = [];
  productoMasVendido: any;
  ventasPorUsuarioGrafico: { name: string, value: number }[] = [];
  ventasTotalesPorUsuarioGrafico: { name: string, value: number }[] = [];
  ventasPorProducto: any[] = [];
  ventasPorCategoria: any[] = [];
  ventasPorFecha: any[] = [];
  estadoVentas: any[] = [];
  ventasResumenPorUsuario: { name: string, value: number, total: number }[] = [];

  totalDineroVendido: number = 0;
  graficoTotalDinero: { name: string, value: number }[] = [];

  ventasPorDiaSemana: any[] = [];
  topProductosVendidos: any[] = [];
  stockPorCategoria: any[] = [];
  comparativaPrecio: any[] = [];
  productosRentables: any[] = [];
  productosBajoStock: any[] = [];
  view: [number, number] = [700, 400]; // valor inicial

  colorScheme = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(
    private route: ActivatedRoute,
    private services: ServicesService
  ) { }

  ngOnInit(): void {
    this.onResize();
    this.updateChartSize();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.services.getVentaByIdPanel(+id).subscribe((venta: Ventas) => this.venta = venta);
      this.services.getDetalleVentasPanel().subscribe((d: DetalleVentas[]) => this.detallesVenta = d);
    }

    this.cargarDatos();
  }
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateChartSize();
  }
  updateChartSize() {
    const width = window.innerWidth;

    if (width < 576) {
      this.view = [300, 250]; // muy pequeño (celulares)
    } else if (width >= 576 && width < 768) {
      this.view = [400, 300]; // sm
    } else if (width >= 768 && width < 992) {
      this.view = [500, 350]; // md
    } else if (width >= 992 && width < 1200) {
      this.view = [600, 400]; // lg
    } else {
      this.view = [700, 400]; // xl o más grande
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

    // 4. Stock por Categoría
    const stockPorCategoriaMap = new Map<string, number>();
    this.productos.forEach(p => {
      const categoria = p.categoria.nombre_categoria;
      this.incrementarMapa(stockPorCategoriaMap, categoria, p.stock);
    });
    this.stockPorCategoria = this.mapToArray(stockPorCategoriaMap);

    // 5. Precio Compra vs Venta
    this.comparativaPrecio = this.productos.map(p => ({
      name: p.nombre_producto,
      series: [
        { name: 'Precio Compra', value: p.precio_compra },
        { name: 'Precio Venta', value: p.precio_unitario }
      ]
    }));

    // 7. Productos con bajo stock
    this.productosBajoStock = this.productos
      .filter(p => p.stock < 10)
      .map(p => ({ name: p.nombre_producto, value: p.stock }));
  }

  private procesarVentas(ventas: Ventas[]): void {
    const cantidadVentasPorUsuarioMap = new Map<string, number>();
    const totalVentasPorUsuarioMap = new Map<string, number>();
    const ventasPorFechaMap = new Map<string, number>();
    const estadoVentasMap = new Map<string, number>();
    const ventasPorMesMap = new Map<string, number>();
    const ventasPorDiaSemana = new Map<string, number>();

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    let totalGlobal = 0;

    ventas.forEach(venta => {
      const usuario = venta.usuario?.nombre_usuario || 'Desconocido';
      const total = parseFloat(venta.total.toString()) || 0;
      const fecha = new Date(venta.fecha_venta);
      const estado = venta.estado;

      this.incrementarMapa(cantidadVentasPorUsuarioMap, usuario, 1);
      this.incrementarMapa(totalVentasPorUsuarioMap, usuario, total);
      this.incrementarMapa(ventasPorFechaMap, fecha.toLocaleDateString(), total);
      this.incrementarMapa(estadoVentasMap, estado, 1);

      // 1. Ventas por Mes
      const mes = fecha.toLocaleString('default', { month: 'long' }) + ' ' + fecha.getFullYear();
      this.incrementarMapa(ventasPorMesMap, mes, total);

      // 2. Ventas por Día de la Semana
      const dia = diasSemana[fecha.getDay()];
      this.incrementarMapa(ventasPorDiaSemana, dia, 1);

      totalGlobal += total;
    });

    this.totalDineroVendido = totalGlobal;
    this.graficoTotalDinero = [{ name: 'Total Vendido', value: totalGlobal }];

    this.ventasPorUsuarioGrafico = this.mapToArray(cantidadVentasPorUsuarioMap);
    this.ventasTotalesPorUsuarioGrafico = this.mapToArray(totalVentasPorUsuarioMap);
    this.ventasPorFecha = [{ name: 'Ventas Mensuales', series: this.mapToArray(ventasPorMesMap) }];
    this.ventasPorDiaSemana = this.mapToArray(ventasPorDiaSemana);
    this.estadoVentas = this.mapToArray(estadoVentasMap);
  }

  private procesarDetallesVenta(detalles: DetalleVentas[]): void {
    const ventasPorProductoMap = new Map<string, number>();
    const ventasPorCategoriaMap = new Map<string, number>();
    const gananciaPorProductoMap = new Map<string, number>();

    detalles.forEach(d => {
      const producto = d.producto.nombre_producto;
      const categoria = d.producto.categoria.nombre_categoria;
      const subtotal = d.producto.precio_unitario * d.cantidad; 
      const ganancia = (d.producto.precio_unitario - d.producto.precio_compra) * d.cantidad;

      this.incrementarMapa(ventasPorProductoMap, producto, d.cantidad);
      this.incrementarMapa(ventasPorCategoriaMap, categoria, subtotal);
      this.incrementarMapa(gananciaPorProductoMap, producto, ganancia);
    });

    this.ventasPorProducto = this.mapToArray(ventasPorProductoMap);

    // 3. Top 5 productos más vendidos
    this.topProductosVendidos = this.mapToArray(ventasPorProductoMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 6. Productos más rentables
    this.productosRentables = this.mapToArray(gananciaPorProductoMap)
      .sort((a, b) => b.value - a.value);

    // 9. Ventas por categoría
    this.ventasPorCategoria = this.mapToArray(ventasPorCategoriaMap);
  }

  private incrementarMapa(map: Map<string, number>, key: string, valor: number): void {
    map.set(key, (map.get(key) || 0) + valor);
  }

  private mapToArray(map: Map<string, number>): { name: string, value: number }[] {
    return Array.from(map.entries()).map(([key, value]) => ({ name: key, value }));
  }
}
