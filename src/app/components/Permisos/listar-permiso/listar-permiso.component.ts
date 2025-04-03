import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Permiso } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-listar-permiso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-permiso.component.html',
  styleUrl: './listar-permiso.component.css',
})
export class ListarPermisoComponent implements OnInit {
  permisos: Permiso[] = []; // Array para almacenar los permisos
  searchNombrePermiso: string = ''; // Campo de búsqueda para el nombre del permiso
  page: number = 1; // Página actual
  pageSize: number = 5; // Tamaño de la página
  paginatedPermisos: Permiso[] = []; // Permisos paginados

  @Output() editarPermisos = new EventEmitter<number>(); // Emit an event when editing
  @Output() registrarPermisos = new EventEmitter<number>(); // Emit an event to register a new permission

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.getPermisos(); // Obtener los permisos al inicializar el componente
  }

  getPermisos() {
    this.servicesService.getPermisos().subscribe((data) => {
      this.permisos = data; // Asignar los permisos obtenidos
      this.updatePaginatedPermisos(); // Actualizar los permisos paginados
    });
  }

  editarPermiso(id: number) {
    this.editarPermisos.emit(id); // Emit the ID of the permission to be edited
    this.getPermisos(); // Obtener los permisos
  }

  registrarPermiso() {
    this.registrarPermisos.emit(); // Emit an event to register a new permission
  }

  filteredPermisos(): Permiso[] {
    let filtered = this.permisos;

    if (this.searchNombrePermiso) {
      filtered = this.permisos.filter((permiso) =>
        permiso.nombre_permiso
          .toLowerCase()
          .includes(this.searchNombrePermiso.toLowerCase())
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostramos solo la página actual
  }

  updatePaginatedPermisos() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPermisos = this.permisos.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedPermisos();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedPermisos();
    }
  }

  togglePermisoActivo(permiso: Permiso) {
    // Invertir el estado de 'estado_Permiso' del permiso
    permiso.estado_Permiso = !permiso.estado_Permiso; // Cambiar el estado del permiso

    // Llamar a un servicio que actualice el estado del permiso en el servidor
    this.servicesService
      .actualizarEstadoPermisos(permiso.id, permiso.estado_Permiso)
      .subscribe(
        (response) => {
          console.log(
            `Permiso ${permiso.nombre_permiso} actualizado exitosamente.`
          );
        },
        (error) => {
          console.error('Error al actualizar el estado del permiso:', error);
          // Si hay un error, revertir el cambio de estado
          permiso.estado_Permiso = !permiso.estado_Permiso; // Revertir el estado
        }
      );
  }
}
