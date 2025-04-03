import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { Permiso } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-registrar-permiso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './registrar-permiso.component.html',
  styleUrl: './registrar-permiso.component.css',
})
export class RegistrarPermisoComponent {
  permisosForm: FormGroup;
  @Output() listarPermisos = new EventEmitter<void>();
  errorModal: string = '';
  mensajeModal: string = '';

  constructor(private fb: FormBuilder, private userService: ServicesService) {
    this.permisosForm = this.fb.group({
      nombrePermiso: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  register() {
    // Validar el campo de nombrePermiso
    if (this.permisosForm.get('nombrePermiso')?.invalid) {
      this.errorModal = 'El campo de nombre del permiso es obligatorio';
      return;
    }

    if (this.permisosForm.valid) {
      const newPermiso: Permiso = {
        id: 0, // Asignar un ID por defecto, el backend lo generará
        nombre_permiso: this.permisosForm.value.nombrePermiso,
        descripcion: this.permisosForm.value.descripcion,
        estado_Permiso: true, // Asignar un estado por defecto
      };

      this.userService.registrarPermisos(newPermiso).subscribe(
        (response) => {
          this.mensajeModal = 'Permiso registrado con éxito';
          this.permisosForm.reset(); // Reiniciar el formulario
        },
        (error) => {
          this.errorModal = 'Error al registrar el permiso';
        }
      );
    } else {
      this.errorModal = 'Formulario no válido';
    }
  }
  manejarOk() {
    this.mensajeModal = '';
    this.listarPermisos.emit();
  }
  manejarError() {
    this.errorModal = '';
  }
}
