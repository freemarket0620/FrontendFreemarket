import { Usuario, Role } from './../../../Models/models';
import { Component, EventEmitter, Output } from '@angular/core';
import { ServicesService } from '../../../Services/services.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsuarioRol } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-registrar-usuario-rol',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './registrar-usuario-rol.component.html',
  styleUrl: './registrar-usuario-rol.component.css',
})
export class RegistrarUsuarioRolComponent {
  usuarioRolForm: FormGroup;
  usuario: Usuario[] = [];
  roles: Role[] = [];
  @Output() listarUsuarioRoles = new EventEmitter<void>();
  errorModal: string = '';
  mensajeModal: string = '';

  constructor(private fb: FormBuilder, private userService: ServicesService) {
    this.usuarioRolForm = this.fb.group({
      usuario: ['', Validators.required],
      rol: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsuario();
  }

  loadUsuario() {
    this.userService.getUsuarios().subscribe((data) => {
      this.usuario = data;
    });
  }

  loadRoles() {
    this.userService.getRoles().subscribe((data) => {
      this.roles = data;
    });
  }

  registrarUsuarioRol() {
    if (this.usuarioRolForm.valid) {
      this.userService
        .registrarUsuarioRol(this.usuarioRolForm.value)
        .subscribe({
          next: () => {
            this.mensajeModal = 'Usuario Rol Registrado con éxito';
            this.usuarioRolForm.reset();
          },
          error: (error) => {
            if (error.error && error.error.error) {
              this.errorModal = error.error.error.join('<br>');
            } else {
              this.errorModal = 'Error al registrar el usuario rol.';
            }
          },
        });
    }
  }

  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal
    this.listarUsuarioRoles.emit(); // Emitir evento para listar los usuarios y roles
  }

  manejarError() {
    this.errorModal = ''; // Cerrar el modal en caso de error
  }
}
