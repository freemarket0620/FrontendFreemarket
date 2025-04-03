import { ServicesService } from './../../../Services/services.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './editar-usuario.component.html',
  styleUrl: './editar-usuario.component.css',
})
export class EditarUsuarioComponent {
  usuario!: Usuario;
  editarForm!: FormGroup;

  mensajeNombre: string = '';
  exitoNombre: boolean = false;

  @Input() usuarioId: number | null = null;
  @Output() listarUsuarioEditado = new EventEmitter<void>();

  imagenPreview: string | ArrayBuffer | null = null;

  mensajeModal: string = '';
  errorModal: string = '';
  constructor(private servicesService: ServicesService) {}
  ngOnInit(): void {
    if (this.usuarioId !== null) {
      this.loadUserData(this.usuarioId);
    } else {
      console.error('El ID de usuario es nulo o indefinido');
    }
  }

  loadUserData(id: number) {
    this.servicesService.getUserById(id).subscribe({
      next: (data) => {
        this.usuario = data;
        this.initializeForm();
        this.imagenPreview = this.usuario.imagen_url;
      },
    });
  }
  initializeForm() {
    this.editarForm = new FormGroup({
      nombre_usuario: new FormControl(
        this.usuario.nombre_usuario,
        Validators.required
      ),
      apellido: new FormControl(this.usuario.apellido, Validators.required),
      fecha_nacimiento: new FormControl(
        this.usuario.fecha_nacimiento,
        Validators.required
      ),
      telefono: new FormControl(this.usuario.telefono, Validators.required),
      correo: new FormControl(this.usuario.correo, Validators.required),
      ci: new FormControl(this.usuario.ci, Validators.required),
      ci_departamento: new FormControl(
        this.usuario.ci_departamento,
        Validators.required
      ),
      imagen_url: new FormControl(this.usuario.imagen_url),
    });
  }
  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result; // Set image preview
      };
      reader.readAsDataURL(file);
      this.editarForm.patchValue({ imagen_url: file });
    }
  }
  onSubmit(): void {
    // Declarar updateUsuario antes de la verificación de validez
    const updateUsuario: FormData = new FormData();

    if (this.editarForm.valid) {
      updateUsuario.append('id', this.usuario.id.toString());
      updateUsuario.append(
        'nombre_usuario',
        this.editarForm.value.nombre_usuario
      );
      updateUsuario.append('apellido', this.editarForm.value.apellido);
      updateUsuario.append(
        'fecha_nacimiento',
        this.editarForm.value.fecha_nacimiento
      );
      updateUsuario.append('telefono', this.editarForm.value.telefono);
      updateUsuario.append('correo', this.editarForm.value.correo);
      updateUsuario.append('ci', this.editarForm.value.ci);
      updateUsuario.append(
        'ci_departamento',
        this.editarForm.value.ci_departamento
      );
      if (this.editarForm.value.imagen_url) {
        updateUsuario.append('imagen_url', this.editarForm.value.imagen_url);
      }

      // Llamar al servicio para editar el usuario
      this.servicesService
        .editarUsuario(this.usuario.id, updateUsuario)
        .subscribe({
          next: () => {
            this.mensajeModal = 'Usuario actualizado exitosamente'; // Mensaje para el modal
          },
          error: (err) => {
            this.errorModal = 'Error al actualizar el usuario';
          },
        });
    } else {
      // Manejar el caso en que el formulario no es válido
      this.errorModal = 'Por favor, complete todos los campos requeridos.';
    }
  }
  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal
    this.listarUsuarioEditado.emit(); // Emitir el evento para listar usuarios
  }
  manejarError() {
    this.errorModal = ''; // Cerrar el modal
  }

  /* cion de validaciones  */
  validarNombre(event: FocusEvent | KeyboardEvent | null = null): boolean {
    let inputElement: HTMLInputElement | null = null;

    // Obtener el elemento si se proporcionó un evento, de lo contrario buscar el elemento directamente
    if (event) {
      inputElement = event.target as HTMLInputElement;
    } else {
      inputElement = document.getElementById(
        'nombre_usuario'
      ) as HTMLInputElement;
    }

    const nombre = inputElement.value.trim();

    // Validar si el campo está vacío
    if (event instanceof FocusEvent && !nombre) {
      this.mensajeNombre = 'Ingresa su nombre, por favor'; // Mensaje de error
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
      return false;
    }

    // Validar si el nombre contiene números
    if (event instanceof KeyboardEvent) {
      const inputChar = String.fromCharCode(event.keyCode);
      if (!/^[a-zA-Z ]$/.test(inputChar)) {
        event.preventDefault(); // Evitar la entrada de caracteres no válidos
        this.mensajeNombre = 'No se puede ingresar datos numéricos'; // Mensaje de error
        inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
        return false;
      }
    }

    // Si el nombre es válido
    if (nombre) {
      this.mensajeNombre = 'Datos correctos'; // Mensaje de éxito
      inputElement.classList.remove('is-invalid'); // Quitar clase de error
      inputElement.classList.add('is-valid'); // Clase de Bootstrap para marcar éxito
      setTimeout(() => {
        this.mensajeNombre = ''; // Limpiar mensaje después de 2 segundos
      }, 2000);
    } else {
      // Mensaje de error si el campo está vacío
      this.mensajeNombre = 'Ingresa su nombre, por favor'; // Mensaje de error
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
    }

    return true; // El nombre es válido
  }
}
