import { ServicesService } from './../../../Services/services.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';
import { ActivatedRoute, Router } from '@angular/router';

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
  styleUrls: ['./editar-usuario.component.css'],
})
export class EditarUsuarioComponent implements OnInit {
  usuario!: Usuario;
  editarForm!: FormGroup;

  mensajeNombre: string = '';
  exitoNombre: boolean = false;

  imagenPreview: string | ArrayBuffer | null = null;

  mensajeModal: string = '';
  errorModal: string = '';

  constructor(
    private servicesService: ServicesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadUserData(id);
    }
  }

  loadUserData(id: number): void {
    this.servicesService.getUserById(id).subscribe({
      next: (data) => {
        this.usuario = data;
        this.initializeForm();
        this.imagenPreview = this.usuario.imagen_url;
      },
      error: () => {
        this.errorModal = 'Error al cargar los datos del usuario';
      },
    });
  }

  initializeForm(): void {
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
      correo: new FormControl(this.usuario.correo, [
        Validators.required,
        Validators.email,
      ]),
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
        this.imagenPreview = reader.result;
      };
      reader.readAsDataURL(file);
      this.editarForm.patchValue({ imagen_url: file });
    }
  }

  onSubmit(): void {
    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      this.errorModal = 'Por favor, complete todos los campos requeridos.';
      return;
    }

    const updateUsuario = new FormData();
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

    if (this.editarForm.value.imagen_url instanceof File) {
      updateUsuario.append('imagen_url', this.editarForm.value.imagen_url);
    }

    this.servicesService
      .editarUsuario(this.usuario.id, updateUsuario)
      .subscribe({
        next: () => {
          this.mensajeModal = 'Usuario actualizado exitosamente';
        },
        error: () => {
          this.errorModal = 'Error al actualizar el usuario';
        },
      });
  }

  manejarOk(): void {
    this.mensajeModal = '';
    this.router.navigate(['panel-control/listar-usuarios']);
  }

  volver(): void {
    this.router.navigate(['panel-control/listar-usuarios']);
  }

  manejarError(): void {
    this.errorModal = '';
  }

  /* VALIDACIÓN NOMBRE */
  validarNombre(event: FocusEvent | KeyboardEvent | null = null): boolean {
    let inputElement: HTMLInputElement | null;

    inputElement = event
      ? (event.target as HTMLInputElement)
      : (document.getElementById('nombre_usuario') as HTMLInputElement);

    const nombre = inputElement.value.trim();

    if (event instanceof FocusEvent && !nombre) {
      this.mensajeNombre = 'Ingresa su nombre, por favor';
      inputElement.classList.add('is-invalid');
      return false;
    }

    if (event instanceof KeyboardEvent) {
      const char = String.fromCharCode(event.keyCode);
      if (!/^[a-zA-Z ]$/.test(char)) {
        event.preventDefault();
        this.mensajeNombre = 'No se puede ingresar datos numéricos';
        inputElement.classList.add('is-invalid');
        return false;
      }
    }

    if (nombre) {
      this.mensajeNombre = 'Datos correctos';
      inputElement.classList.remove('is-invalid');
      inputElement.classList.add('is-valid');
      setTimeout(() => (this.mensajeNombre = ''), 2000);
    }

    return true;
  }
}
