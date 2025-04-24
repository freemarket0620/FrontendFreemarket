import { CommonModule } from '@angular/common';
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
  }
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
