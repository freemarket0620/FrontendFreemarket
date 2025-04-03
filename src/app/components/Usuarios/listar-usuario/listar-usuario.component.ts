import { ServicesService } from './../../../Services/services.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Usuario } from '../../../Models/models';

@Component({
  selector: 'app-listar-usuario',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-usuario.component.html',
  styleUrl: './listar-usuario.component.css',
})
export class ListarUsuarioComponent implements OnInit {
  usuarios: Usuario[] = [];
  //variables para las busquedas
  searchnombreUsuario: string = ''; // Nuevo campo para el nombre
  searchcorreo: string = ''; // Nuevo campo para el modelo
  searchci: string = ''; // Nuevo campo para la marca
  searchdepartamento: string = ''; // Nuevo campo para la marca

  page: number = 1;
  pageSize: number = 5;
  paginatedUsuario: Usuario[] = [];

  @Output() editar = new EventEmitter<number>(); // Emit an event when editing
  @Output() registrar = new EventEmitter<number>(); // Emit an event when editing

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.getUsuarios();
  }
  getUsuarios() {
    this.servicesService.getUsuarios().subscribe((data) => {
      this.usuarios = data;
      this.ordenarUsuariosPorId();
      this.updatePaginatedUsuario();
    });
  }
  editarUsuario(id: number) {
    this.editar.emit(id); // Emit the ID of the user to be edited
    this.getUsuarios(); // Volver a obtener la lista después de editar
  }
  registrarUsuario() {
    this.registrar.emit(); // Emit an event to register a new user
  }
  filteredUsuarios(): Usuario[] {
    let filtered = this.usuarios;

    // Filtrado basado en los tres campos
    if (this.searchnombreUsuario) {
      filtered = filtered.filter((usuario) =>
        (usuario.nombre_usuario + '' + usuario.apellido)

          .toLowerCase()
          .includes(this.searchnombreUsuario.toLowerCase())
      );
    }
    if (this.searchcorreo) {
      filtered = filtered.filter((usuario) =>
        usuario.correo?.toLowerCase().includes(this.searchcorreo.toLowerCase())
      );
    }
    if (this.searchci) {
      filtered = filtered.filter((usuario) =>
        usuario.ci.toLowerCase().includes(this.searchci.toLowerCase())
      );
    }
    if (this.searchdepartamento) {
      filtered = filtered.filter((usuario) =>
        usuario.ci_departamento
          .toLowerCase()
          .includes(this.searchdepartamento.toLowerCase())
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostramos solo la página actual
  }
  updatePaginatedUsuario() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsuario = this.usuarios.slice(start, end);
  }

  nextPage() {
    this.page++;
    this.updatePaginatedUsuario();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.updatePaginatedUsuario();
    }
  }
  toggleUsuarioActivo(usuario: any) {
    // Invertir el estado de 'estado_Usuario' del usuario
    usuario.estado_Usuario = !usuario.estado_Usuario; // Cambia esto a estado_Usuario
    // Llamar a un servicio que actualice el estado del usuario en el servidor
    this.servicesService
      .actualizarEstadoUsuario(usuario.id, usuario.estado_Usuario) // Asegúrate de que se esté pasando el estado correcto
      .subscribe(
        (response) => {
          console.log(
            `Usuario ${usuario.nombre_usuario} actualizado exitosamente.`
          );
        },
        (error) => {
          console.error('Error al actualizar el estado del usuario:', error);
        }
      );
  }
  ordenarUsuariosPorId() {
    this.usuarios.sort((a, b) => a.id - b.id); // Ordenar por ID en orden ascendente
  }
}
