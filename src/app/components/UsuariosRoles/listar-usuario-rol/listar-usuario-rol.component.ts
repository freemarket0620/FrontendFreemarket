import { ServicesService } from './../../../Services/services.service';
import { UsuarioRol } from './../../../Models/models';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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

  @Output() editarUsuarioRol = new EventEmitter<number>(); // Emit an event when editing
  @Output() registrarUsuarioRol = new EventEmitter<void>(); // Emit an event to register a new user-role

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.getUsuarioRoles(); // Obtener los usuarios y roles al inicializar el componente
  }

  getUsuarioRoles() {
    this.loading = true; // Iniciar el estado de carga
    this.servicesService.getUsuariosRoles().subscribe(
      (data) => {
        this.usuarioRoles = data; // Asignar los usuarios y roles obtenidos
        this.updatePaginatedUsuarioRoles(); // Actualizar los usuarios y roles paginados
        this.loading = false; // Finalizar el estado de carga
      },
      () => {
        this.loading = false; // Finalizar el estado de carga en caso de error
      }
    );
  }

  /*   editarUsuarioRole(id: number) {
    this.editarUsuarioRol.emit(id); // Emit the ID of the user-role to be edited
  } */
  editarUsuarioRole(id: number) {
    this.editarUsuarioRol.emit(id); // Emitir el ID del usuario-rol a editar
  }
  registrarUsuarioRole() {
    this.registrarUsuarioRol.emit(); // Emit an event to register a new user-role
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
