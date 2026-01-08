import { ServicesService } from './../../../Services/services.service';
import { UsuarioRol } from './../../../Models/models';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar-usuario-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-usuario-rol.component.html',
  styleUrl: './listar-usuario-rol.component.css',
})
export class ListarUsuarioRolComponent implements OnInit {
  usuarioRoles: UsuarioRol[] = []; // Array para almacenar los usuarios y roles
  searchNombreUsuario: string = ''; // Campo de búsqueda para el nombre del usuario
  page: number = 1; // Página actual
  pageSize: number = 5; // Tamaño de la página
  paginatedUsuarioRoles: UsuarioRol[] = []; // UsuarioRoles paginados
  loading: boolean = true; // Propiedad para manejar el estado de carga

  
  constructor(private servicesService: ServicesService, private router: Router) {}

  ngOnInit(): void {
    this.getUsuarioRoles(); // Obtener los usuarios y roles al inicializar el componente
  }

  getUsuarioRoles() {
    this.loading = true; 
    this.servicesService.getUsuariosRoles().subscribe(
      (data) => {
        this.usuarioRoles = data; 
        this.updatePaginatedUsuarioRoles(); 
        this.loading = false; 
      },
      () => {
        this.loading = false; 
      }
    );
  }
  editarUsuarioRole(id: number) {
    this.router.navigate(['panel-control/editar-usuarios-roles', id]);

  }
  registrarUsuarioRole() {
    this.router.navigate(['panel-control/registrar-usuarios-roles']);
  }

  filteredUsuarioRoles(): UsuarioRol[] {
    let filtered = this.usuarioRoles;

    if (this.searchNombreUsuario) {
      filtered = this.usuarioRoles.filter((usuarioRol) =>
        usuarioRol.usuario.nombre_usuario
          .toLowerCase()
          .includes(this.searchNombreUsuario.toLowerCase())
      );
    }
    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostramos solo la página actual
  }

  updatePaginatedUsuarioRoles() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsuarioRoles = this.usuarioRoles.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedUsuarioRoles();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedUsuarioRoles();
    }
  }

  toggleUsuarioRolActivo(usuarioRol: UsuarioRol) {
    // Invertir el estado de 'estado_Usuario' del usuario
    usuarioRol.usuario.estado_Usuario = !usuarioRol.usuario.estado_Usuario; // Cambiar el estado del usuario

    // Llamar a un servicio que actualice el estado del usuario en el servidor
    this.servicesService
      .actualizarEstadoUsuario(
        usuarioRol.usuario.id,
        usuarioRol.usuario.estado_Usuario
      )
      .subscribe(
        (response) => {
          console.log(
            `Usuario ${usuarioRol.usuario.nombre_usuario} actualizado exitosamente.`
          );
        },
        (error) => {
          console.error('Error al actualizar el estado del usuario:', error);
          // Si hay un error, revertir el cambio de estado
          usuarioRol.usuario.estado_Usuario =
            !usuarioRol.usuario.estado_Usuario; // Revertir el estado
        }
      );
  }
}
