import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Role } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-listar-rol',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-rol.component.html',
  styleUrls: ['./listar-rol.component.css'],
})
export class ListarRolComponent implements OnInit {
  roles: Role[] = []; // Array para almacenar los roles
  searchNombreRol: string = ''; // Campo de búsqueda para el nombre del rol
  page: number = 1; // Página actual
  pageSize: number = 5; // Tamaño de la página
  paginatedRoles: Role[] = []; // Roles paginados

  @Output() editarRoles = new EventEmitter<number>(); // Emit an event when editing
  @Output() registrarRoles = new EventEmitter<number>(); // Emit an event to register a new role

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.getRoles(); // Obtener los roles al inicializar el componente
  }

  getRoles() {
    this.servicesService.getRoles().subscribe((data) => {
      this.roles = data; // Asignar los roles obtenidos
      this.updatePaginatedRoles(); // Actualizar los roles paginados
    });
  }

  editarRol(id: number) {
    this.editarRoles.emit(id); // Emit the ID of the role to be edited
    this.getRoles(); // Obtener los roles
  }

  registrarRol() {
    this.registrarRoles.emit(); // Emit an event to register a new role
  }
  filteredRoles(): Role[] {
    let filtered = this.roles;

    if (this.searchNombreRol) {
      filtered = this.roles.filter((rol) =>
        rol.nombre_rol
          .toLowerCase()
          .includes(this.searchNombreRol.toLowerCase())
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostramos solo la página actual
  }

  updatePaginatedRoles() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRoles = this.roles.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedRoles();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedRoles();
    }
  }
  toggleRolActivo(rol: Role) {
    // Invertir el estado de 'estadoRol' del rol
    rol.estado_Rol = !rol.estado_Rol; // Cambiar el estado del rol

    // Llamar a un servicio que actualice el estado del rol en el servidor
    this.servicesService.actualizarEstadoRol(rol.id, rol.estado_Rol).subscribe(
      (response) => {
        console.log(`Rol ${rol.nombre_rol} actualizado exitosamente.`);
      },
      (error) => {
        console.error('Error al actualizar el estado del rol:', error);
        // Si hay un error, revertir el cambio de estado
        rol.estado_Rol = !rol.estado_Rol; // Revertir el estado
      }
    );
  }
}
