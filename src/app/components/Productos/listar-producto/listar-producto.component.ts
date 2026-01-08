import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Categoria, Producto } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-listar-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './listar-producto.component.html',
  styleUrls: ['./listar-producto.component.css'],
})
export class ListarProductoComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  searchNombreProducto: string = '';
  searchCategoria: string = '';
  searchCodigoProducto: string = '';
  page: number = 1;
  pageSize: number = 6;
  ordenarAscendente: boolean = true;

  constructor(private productoService: ServicesService,    private router: Router
  ) {}

  ngOnInit(): void {
    this.getProductos();
    this.getCategorias();
  }

  getProductos() {
    this.productoService.getProductos().subscribe((data) => {
      this.productos = data;
    });
  }

  getCategorias() {
    this.productoService.getCategorias().subscribe((data) => {
      this.categorias = data;
    });
  }

  editarProducto(id: number) {
    this.router.navigate(['panel-control/editar-productos', id]);

  }

  registrarProducto() {
    this.router.navigate(['panel-control/registrar-productos']);
  }
  ordenarPorStock() {
    this.ordenarAscendente = !this.ordenarAscendente; // Cambiar el estado de orden

    this.productos.sort((a, b) => {
      if (this.ordenarAscendente) {
        if (a.stock === 0) return -1; // Colocar productos con stock 0 al principio
        if (b.stock === 0) return 1; // Colocar productos con stock 0 al principio
        return a.stock - b.stock; // Ordenar normalmente
      } else {
        // Ordenar de mayor a menor
        if (a.stock === 0) return 1; // Colocar productos con stock 0 al final
        if (b.stock === 0) return -1; // Colocar productos con stock 0 al final
        return b.stock - a.stock; // Ordenar normalmente
      }
    });
  }

  filteredProductos(): Producto[] {
    let filtered = this.productos;

    // Filtrar por categoría
    if (this.searchCategoria) {
      filtered = filtered.filter((producto) =>
        producto.categoria.nombre_categoria
          .toLowerCase()
          .includes(this.searchCategoria.toLowerCase())
      );
    }

    // Filtrar por nombre de producto
    if (this.searchNombreProducto) {
      filtered = filtered.filter((producto) =>
        producto.nombre_producto
          .toLowerCase()
          .includes(this.searchNombreProducto.toLowerCase())
      );
    }

    // Filtrar por código de producto
    if (this.searchCodigoProducto) {
      filtered = filtered.filter((producto) =>
        producto.codigo_producto
          .toLowerCase()
          .includes(this.searchCodigoProducto.toLowerCase())
      );
    }

    // Filtrar productos con stock cero
    const productosConStockCero = filtered.filter(producto => producto.stock === 0);
    const productosConStock = filtered.filter(producto => producto.stock > 0);

    // Combinar los productos con stock cero y los que tienen stock
    const productosFiltrados = [...productosConStockCero, ...productosConStock];

    return productosFiltrados.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    );
  }

  nextPage() {
    this.page++;
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }
  modalVisible: boolean = false;
  imageToShow: string = '';
  openModal(imageUrl: string) {
    this.imageToShow = imageUrl;
    this.modalVisible = true;
  }
  closeModal() {
    this.modalVisible = false;
  }
  toggleProductoActivado(producto: Producto) {
    producto.estado_equipo = !producto.estado_equipo;
    this.productoService
      .actualizarEstadoProducto(producto.id, producto.estado_equipo)
      .subscribe(
        (response) => {
          console.log(
            `Producto ${producto.estado_equipo} actualizado exitosamente.`
          );
        },
        (error) => {
          console.error('Error al actualizar el estado del equipo:', error);
          producto.estado_equipo = !producto.estado_equipo;
        }
      );
  }
}
