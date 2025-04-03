import { Usuario, UsuarioRol, Role } from './../../../Models/models';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-editar-usuario-rol',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './editar-usuario-rol.component.html',
  styleUrls: ['./editar-usuario-rol.component.css'],
})
export class EditarUsuarioRolComponent implements OnInit {
  usuarioRol!: UsuarioRol; // Objeto que contendrá los datos del UsuarioRol
  usuarios: Usuario[] = []; // Lista de usuarios disponibles
  roles: Role[] = []; // Lista de roles disponibles
  form!: FormGroup; // Formulario reactivo
  mensajeModal: string = ''; // Mensaje para el modal
  errorModal: string = ''; // Mensaje de error para el modal
  @Input() usuarioRolId: number | null = null; // ID del UsuarioRol a editar
  @Output() listarUsuarioRolEditado = new EventEmitter<void>(); // Evento para notificar que se ha editado un UsuarioRol

  constructor(private usuarioRolService: ServicesService) {}

  ngOnInit(): void {
    this.loadUsuarios(); // Cargar usuarios
    this.loadRoles(); // Cargar roles
    if (this.usuarioRolId !== null) {
      this.loadUsuarioRolData(this.usuarioRolId); // Cargar datos del UsuarioRol si el ID es válido
    } else {
      console.error('usuarioRolId es nulo o no definido');
    }
  }

  loadUsuarioRolData(id: number): void {
    this.usuarioRolService.getUsuarioRolById(id).subscribe({
      next: (data) => {
        console.log(data); // Verifica que los datos se están recuperando
        this.usuarioRol = data; // Asigna los datos recuperados al objeto usuarioRol
        this.initializeForm(); // Inicializa el formulario con los datos
      },
    });
  }

  initializeForm(): void {
    this.form = new FormGroup({
      rol: new FormControl(this.usuarioRol.rol.id, Validators.required),
      usuario: new FormControl(this.usuarioRol.usuario.id, Validators.required),
    });
  }
  loadUsuarios(): void {
    this.usuarioRolService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios; // Asigna la lista de usuarios
      },
    });
  }

  loadRoles(): void {
    this.usuarioRolService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles; // Asigna la lista de roles
      },
    });
  }

  onSubmit(): void {
    if (this.usuarioRol) {
      const { id, rol, usuario } = this.usuarioRol;
      const updatedUsuarioRol: UsuarioRol = {
        id,
        rol: { ...rol },
        usuario: { ...usuario },
      };
      this.usuarioRolService
        .editarUsuarioRol(this.usuarioRol.id, updatedUsuarioRol)
        .subscribe({
          next: () => {
            this.mensajeModal = 'Usuario Rol Actualizado con éxito';
          },
          error: (error) => {
            this.errorModal =
              error.error?.error?.join('<br>') ||
              'Error al actualizar el usuario rol.';
          },
        });
    } else {
      this.errorModal = 'Por favor, completa todos los campos requeridos.';
    }
  }

  manejarOk() {
    this.mensajeModal = '';
    this.listarUsuarioRolEditado.emit();
  }
  manejarError() {
    this.errorModal = '';
  }
}
