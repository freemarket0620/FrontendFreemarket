import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { Role } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-registrar-rol',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './registrar-rol.component.html',
  styleUrl: './registrar-rol.component.css',
})
export class RegistrarRolComponent {
  rolesForm: FormGroup;
  @Output() listarRoles = new EventEmitter<void>();
  errorModal: string = '';
  mensajeModal: string = '';

  constructor(private fb: FormBuilder, private userService: ServicesService) {
    this.rolesForm = this.fb.group({
      nombreRol: ['', Validators.required],
    });
  }
  register() {
    // Validar el campo de nombreRol
    if (this.rolesForm.get('nombreRol')?.invalid) {
      this.errorModal = 'El campo de nombre del rol es obligatorio';
      return;
    }

    if (this.rolesForm.valid) {
      const newRole: Role = {
        id: 0, // Asignar un ID por defecto, el backend lo generará
        nombre_rol: this.rolesForm.value.nombreRol,
        estado_Rol: true, // Asignar un estado por defecto
      };

      this.userService.registrarRoles(newRole).subscribe(
        (response) => {
          this.mensajeModal = 'Rol registrado con éxito';
          this.rolesForm.reset(); // Reiniciar el formulario
        },
        (error) => {
          this.errorModal = 'Error al registrar el rol';
        }
      );
    } else {
      this.errorModal = 'Formulario no válido';
    }
  }

  manejarOk() {
    this.mensajeModal = '';
    this.listarRoles.emit();
  }

  manejarError() {
    this.errorModal = '';
  }
}
