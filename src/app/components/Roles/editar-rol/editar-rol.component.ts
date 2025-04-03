import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Role } from '../../../Models/models';
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
  selector: 'app-editar-rol',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OkComponent, ErrorComponent],
  templateUrl: './editar-rol.component.html',
  styleUrls: ['./editar-rol.component.css'],
})
export class EditarRolComponent implements OnInit {
  role!: Role;
  editarForm!: FormGroup;

  @Input() set roleId(id: number | null) {
    if (id) {
      this.loadRoleData(id); // Cargar los datos cuando se recibe un `id`
    }
  }
  @Output() listarRoleEditado = new EventEmitter<void>();

  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.editarForm = new FormGroup({
      nombre_rol: new FormControl('', Validators.required),
      estado_Rol: new FormControl(true),
    });
  }

  loadRoleData(id: number) {
    this.servicesService.getRolesById(id).subscribe({
      next: (data) => {
        this.role = data;
        this.initializeForm(); // Asegúrate de inicializar el formulario aquí
      },
      error: (error) => {
        console.error('Error al cargar los datos del rol:', error);
      },
    });
  }

  initializeForm() {
    this.editarForm.setValue({
      nombre_rol: this.role.nombre_rol,
      estado_Rol: this.role.estado_Rol,
    });
  }
  onSubmit(): void {
    if (!this.editarForm.valid) {
      this.errorModal = 'Por favor, complete todos los campos requeridos.';
      return; // Salir si el formulario no es válido
    }

    const updatedRol = { ...this.role, ...this.editarForm.value };
    this.servicesService.editarRoles(this.role.id, updatedRol).subscribe({
      next: (data) => {
        console.log(data);
        this.mensajeModal = 'Rol actualizado con éxito';
      },
      error: (error) => {
        if (error.message.includes('ya existe')) {
          this.errorModal = 'Error al editar: \n' + error.message; // Mensaje de duplicado
        } else {
          this.errorModal = 'Error al actualizar el rol';
        }
      },
    });
  }

  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal
    this.listarRoleEditado.emit(); // Emitir el evento para listar usuarios
  }

  manejarError() {
    this.errorModal = ''; // Cerrar el modal
  }
}
