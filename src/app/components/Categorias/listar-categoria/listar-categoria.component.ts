import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Categoria } from '../../../Models/models'; // Asegúrate de importar el modelo Categoria
import { ServicesService } from '../../../Services/services.service'; // Asegúrate de tener el servicio para las categorías
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar-categoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-categoria.component.html',
  styleUrls: ['./listar-categoria.component.css'],
})
export class ListarCategoriaComponent implements OnInit {
  categorias: Categoria[] = []; // Array para almacenar las categorías
  searchNombreCategoria: string = ''; // Campo de búsqueda para el nombre de la categoría
  page: number = 1; // Página actual
  pageSize: number = 5; // Tamaño de la página
  paginatedCategorias: Categoria[] = []; // Categorías paginadas
  loading: boolean = true;

  constructor(private servicesService: ServicesService,    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCategorias(); // Obtener las categorías al inicializar el componente
  }

  getCategorias() {
    this.loading = true; // Iniciar el estado de carga
    this.servicesService.getCategorias().subscribe(
      (data) => {
      this.categorias = data; // Asignar las categorías obtenidas
      this.updatePaginatedCategorias(); // Actualizar las categorías paginadas
      this.loading = false;
      },
      () => {
        this.loading = false; // Finalizar el estado de carga en caso de error
      }
    );
  }

  editarCategoriaClick(id: number) {
    this.router.navigate(['panel-control/editar-categorias', id]);
  }

  registrarCategoriaClick() {
    this.router.navigate(['panel-control/registrar-categorias']);
  }

  filteredCategorias(): Categoria[] {
    let filtered = this.categorias;

    if (this.searchNombreCategoria) {
      filtered = this.categorias.filter((categoria) =>
        categoria.nombre_categoria
          .toLowerCase()
          .includes(this.searchNombreCategoria.toLowerCase())
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostramos solo la página actual
  }

  updatePaginatedCategorias() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedCategorias = this.categorias.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedCategorias();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedCategorias();
    }
  }
  toggleCategoriaActivo(Categoria: Categoria) {
    // Invertir el estado de 'estadoCategoria' del Categoria
    Categoria.estado_categoria = !Categoria.estado_categoria; // Cambiar el estado del Categoria

    // Llamar a un servicio que actualice el estado del Categoria en el servidor
    this.servicesService
      .actualizarEstadoCategoria(Categoria.id, Categoria.estado_categoria)
      .subscribe(
        (response) => {
          console.log(
            `Categoria ${Categoria.nombre_categoria} actualizado exitosamente.`
          );
        },
        (error) => {
          console.error('Error al actualizar el estado del Categoria:', error);
          // Si hay un error, revertir el cambio de estado
          Categoria.estado_categoria = !Categoria.estado_categoria; // Revertir el estado
        }
      );
  }
}
