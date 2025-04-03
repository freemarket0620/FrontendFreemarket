import { CommonModule } from '@angular/common';
import { ListarProductosUsuarioComponent } from '../Productos/listar-productos-usuario/listar-productos-usuario.component';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, AfterViewInit, Renderer2, ElementRef } from '@angular/core';
import { ServicesService } from '../../Services/services.service';
import { Categoria, Producto } from '../../Models/models';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css'],
})
export class IndexComponent implements AfterViewInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  productosPorCategoria: { [key: string]: Producto } = {};

  // Definición de categoriasExcluidas como propiedad de la clase
  private categoriasExcluidas = ['targetas entel tigo viva'];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef,
    private productoService: ServicesService
  ) {}

  ngAfterViewInit() {
    const h1 = this.el.nativeElement.querySelector('h1');

    if (h1) {
      this.renderer.listen(h1, 'input', () => {
        this.renderer.setAttribute(h1, 'data-heading', h1.innerText);
      });
    }

    this.getProductos();
    this.getCategorias();
  }

  getProductos() {
    this.productoService.getProductos().subscribe((data) => {
      this.productos = data.filter(
        (producto) =>
          !this.categoriasExcluidas.includes(
            producto.categoria.nombre_categoria.trim().toLowerCase()
          )
      );
      this.agruparProductosPorCategoria();
    });
  }

  getCategorias() {
    this.productoService.getCategorias().subscribe((data) => {
      this.categorias = data.filter(
        (categoria) =>
          !this.categoriasExcluidas.includes(
            categoria.nombre_categoria.trim().toLowerCase()
          )
      );
    });
  }

  agruparProductosPorCategoria() {
    this.productos.forEach((producto) => {
      const categoriaNombre = producto.categoria.nombre_categoria;
      // Solo almacenar un producto por categoría
      if (!this.productosPorCategoria[categoriaNombre]) {
        this.productosPorCategoria[categoriaNombre] = producto; // Almacena solo un producto
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToProductos() {
    this.router.navigate(['/listar-productos-usuario']);
  }
}
