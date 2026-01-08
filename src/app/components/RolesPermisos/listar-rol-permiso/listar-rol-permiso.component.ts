import { ServicesService } from './../../../Services/services.service';
import { RolePermiso } from './../../../Models/models';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar-rol-permiso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-rol-permiso.component.html',
  styleUrls: ['./listar-rol-permiso.component.css'],
})
export class ListarRolPermisoComponent implements OnInit {
  rolePermisos: RolePermiso[] = []; // Array para almacenar los roles y permisos
  searchNombreRol: string = ''; // Campo de búsqueda para el nombre del rol
  page: number = 1; // Página actual
  pageSize: number = 5; // Tamaño de la página
  paginatedRolePermisos: RolePermiso[] = []; // RolePermisos paginados
  loading: boolean = true; // Propiedad para manejar el estado de carga

  constructor(private servicesService: ServicesService, private router: Router) {}

  ngOnInit(): void {
    this.getRolePermisos(); // Obtener los roles y permisos al inicializar el componente
  }

  getRolePermisos() {
    this.loading = true; // Iniciar el estado de carga
    this.servicesService.getRolesPermisos().subscribe(
      (data) => {
        this.rolePermisos = data; // Asignar los roles y permisos obtenidos
        this.updatePaginatedRolePermisos(); // Actualizar los roles y permisos paginados
        this.loading = false; // Finalizar el estado de carga
      },
      () => {
        this.loading = false; // Finalizar el estado de carga en caso de error
      }
    );
  }

  editarRolePermiso(id: number) {
    this.router.navigate(['panel-control/editar-roles-permisos', id]);
  }

  registrarRolePermiso() {
    this.router.navigate(['panel-control/registrar-roles-permisos']);
  }

  filteredRolePermisos(): RolePermiso[] {
    let filtered = this.rolePermisos;

    if (this.searchNombreRol) {
      filtered = this.rolePermisos.filter((rolePermiso) =>
        rolePermiso.rol.nombre_rol
          .toLowerCase()
          .includes(this.searchNombreRol.toLowerCase())
      );
    }
    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostramos solo la página actual
  }

  updatePaginatedRolePermisos() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRolePermisos = this.rolePermisos.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedRolePermisos();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedRolePermisos();
    }
  }
}
