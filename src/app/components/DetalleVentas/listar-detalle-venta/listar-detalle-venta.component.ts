import { Component, OnInit } from '@angular/core';
import { DetalleVenta } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-listar-detalle-venta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-detalle-venta.component.html',
  styleUrls: ['./listar-detalle-venta.component.css'],
})
export class ListarDetalleVentaComponent implements OnInit {
  detallesVenta: DetalleVenta[] = [];
  searchVenta: string = '';
  searchProducto: string = '';
  searchUsuario: string = '';
  searchCodigo: string = '';
  searchFecha: string = ''; // Puedes usar un formato de fecha si es necesario
  page: number = 1;
  pageSize: number = 5;
  paginatedDetallesVenta: DetalleVenta[] = [];

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.getDetallesVenta();
  }

  getDetallesVenta() {
    this.servicesService.getDetalleVentas().subscribe((data) => {
      this.detallesVenta = data.sort((a, b) => {
        return (
          new Date(b.venta.fecha_venta).getTime() -
          new Date(a.venta.fecha_venta).getTime()
        );
      });
      this.updatePaginatedDetallesVenta();
    });
  }

  filteredDetallesVenta(): DetalleVenta[] {
    let filtered = this.detallesVenta;
    if (this.searchVenta) {
      filtered = filtered.filter((detalle) =>
        detalle.venta.id.toString().includes(this.searchVenta)
      );
    }
    if (this.searchProducto) {
      filtered = filtered.filter((detalle) =>
        detalle.producto.nombre_producto
          .toLowerCase()
          .includes(this.searchProducto.toLowerCase())
      );
    }

    if (this.searchUsuario) {
      filtered = filtered.filter((detalle) =>
        (
          detalle.venta.usuario.nombre_usuario +
          ' ' +
          detalle.venta.usuario.apellido +
          ' ' +
          detalle.venta.usuario.ci
        )
          .toLowerCase()
          .includes(this.searchUsuario.toLowerCase())
      );
    }

    if (this.searchCodigo) {
      filtered = filtered.filter((detalle) =>
        detalle.producto.codigo_producto
          .toLowerCase()
          .includes(this.searchCodigo.toLowerCase())
      );
    }

    if (this.searchFecha) {
      filtered = filtered.filter((detalle) =>
        new Date(detalle.venta.fecha_venta)
          .toLocaleDateString()
          .includes(this.searchFecha)
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    );
  }

  updatePaginatedDetallesVenta() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedDetallesVenta = this.detallesVenta.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedDetallesVenta();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedDetallesVenta();
    }
  }
  updateList() {
    this.getDetallesVenta();
  }
}
