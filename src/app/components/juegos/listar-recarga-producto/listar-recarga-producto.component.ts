import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Categoria, RecargaProducto } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';

@Component({
  selector: 'app-listar-recarga-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './listar-recarga-producto.component.html',
  styleUrl: './listar-recarga-producto.component.css'
})
export class ListarRecargaProductoComponent implements OnInit {
  recargas: RecargaProducto[] = [];
  categorias: Categoria[] = [];
  searchNombre: string = '';
  page: number = 1;
  pageSize: number = 6;

  constructor(private service: ServicesService, private router: Router) {}

  ngOnInit(): void {
    this.getRecargas();
    this.getCategorias();
  }

  getRecargas() {
    this.service.getRecargaProductos().subscribe((data) => {
      this.recargas = data;
    });
  }

  getCategorias() {
    this.service.getCategorias().subscribe((data) => {
      this.categorias = data;
    });
  }

  registrarRecarga() {
    this.router.navigate(['panel-control/registrar-RecargaProducto']);
  }

  editarRecarga(id: number) {
    this.router.navigate(['panel-control/editar-RecargaProducto', id]);
  }

  toggleEstado(recarga: RecargaProducto) {
    recarga.estado = !recarga.estado;
    this.service
      .actualizarEstadoRecargaProducto(recarga.id, recarga.estado)
      .subscribe({
        next: () => {},
        error: () => {
          recarga.estado = !recarga.estado; // revertir si falla
        },
      });
  }

  filteredRecargasForTotals(): RecargaProducto[] {
    let filtered = this.recargas;

    if (this.searchNombre) {
      filtered = filtered.filter(r =>
        r.nombre.toLowerCase().includes(this.searchNombre.toLowerCase())
      );
    }

    return filtered;
  }
  filteredRecargas(): RecargaProducto[] {
    const filtered = this.filteredRecargasForTotals();
    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    );
  }

  nextPage() {
    this.page++;
  }

  previousPage() {
    if (this.page > 1) this.page--;
  }
  getTotalDiamantes(): number {
    return this.filteredRecargasForTotals()
      .reduce((sum, r) => sum + Number(r.cantidad), 0);
  }

  getTotalPrecioCompra(): number {
    return this.filteredRecargasForTotals()
      .reduce((sum, r) => sum + Number(r.precio_compra), 0);
  }

  getTotalPrecioVenta(): number {
    return this.filteredRecargasForTotals()
      .reduce((sum, r) => sum + Number(r.precio_venta), 0);
  }
}