import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Permiso } from '../../../Models/models';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-editar-permiso',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OkComponent, ErrorComponent],
  templateUrl: './editar-permiso.component.html',
  styleUrls: ['./editar-permiso.component.css'],
})
export class EditarPermisoComponent implements OnInit {
  permiso!: Permiso;
  editarForm!: FormGroup;

  @Input() set permisoId(id: number | null) {
    if (id) {
      this.loadPermisoData(id); // Cargar los datos cuando se recibe un `id`
    }
  }
  @Output() listarPermisoEditado = new EventEmitter<void>();

  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.editarForm = new FormGroup({
      nombre_permiso: new FormControl('', Validators.required),
      descripcion: new FormControl('', Validators.required),
      estado_Permiso: new FormControl(true),
    });
  }

  loadPermisoData(id: number) {
    this.servicesService.getPermisosById(id).subscribe({
      next: (data) => {
        this.permiso = data;
        this.initializeForm(); // Asegúrate de inicializar el formulario aquí
      },
      error: (error) => {
        console.error('Error al cargar los datos del permiso:', error);
        this.errorModal = 'No se pudo cargar el permiso. Intente nuevamente.';
      },
    });
  }

  initializeForm() {
    this.editarForm.setValue({
      nombre_permiso: this.permiso.nombre_permiso,
      descripcion: this.permiso.descripcion,
      estado_Permiso: this.permiso.estado_Permiso,
    });
  }

  onSubmit(): void {
    if (!this.editarForm.valid) {
      this.errorModal = 'Por favor, complete todos los campos requeridos.';
      return; // Salir si el formulario no es válido
    }

    const updatedPermiso = { ...this.permiso, ...this.editarForm.value };
    this.servicesService
      .editarPermisos(this.permiso.id, updatedPermiso)
      .subscribe({
        next: (data) => {
          this.mensajeModal = 'Permiso actualizado con éxito';
        },
        error: (error) => {
          if (error.message.includes('ya existe')) {
            this.errorModal = 'Error al editar: \n' + error.message; // Mensaje de duplicado
          } else {
            this.errorModal = 'Error al actualizar el permiso';
          }
        },
      });
  }

  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal de éxito
    this.listarPermisoEditado.emit(); // Emitir el evento para listar permisos
  }

  manejarError() {
    this.errorModal = ''; // Cerrar el modal de error
  }
}
