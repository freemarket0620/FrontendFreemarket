import { Role, Permiso, RolePermiso } from './../../../Models/models';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
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
  selector: 'app-editar-rol-permiso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './editar-rol-permiso.component.html',
  styleUrls: ['./editar-rol-permiso.component.css'],
})
export class EditarRolPermisoComponent implements OnInit {
  rolPermiso!: RolePermiso; // Objeto que contendrá los datos del RolPermiso
  roles: Role[] = []; // Lista de roles disponibles
  permisos: Permiso[] = []; // Lista de permisos disponibles
  form!: FormGroup; // Formulario reactivo
  manejarModal: boolean = false; // Controla la visibilidad del modal
  mensajeModal: string = ''; // Mensaje para el modal
  errorModal: string = ''; // Mensaje de error para el modal
  @Input() rolPermisoId: number | null = null; // ID del RolPermiso a editar
  @Output() listarRolPermisoEditado = new EventEmitter<void>(); // Evento para notificar que se ha editado un RolPermiso

  constructor(private rolPermisoService: ServicesService) {}

  ngOnInit(): void {
    this.loadRoles(); // Cargar roles
    this.loadPermisos(); // Cargar permisos
    if (this.rolPermisoId !== null) {
      this.loadRolPermisoData(this.rolPermisoId); // Cargar datos del RolPermiso si el ID es válido
    } else {
      console.error('rolPermisoId es nulo o no definido');
    }
  }

  loadRolPermisoData(id: number): void {
    this.rolPermisoService.getRolePermisoById(id).subscribe({
      next: (data) => {
        console.log(data); // Verifica que los datos se están recuperando
        this.rolPermiso = data; // Asigna los datos recuperados al objeto rolPermiso
        this.initializeForm(); // Inicializa el formulario con los datos
      },
    });
  }

  initializeForm(): void {
    this.form = new FormGroup({
      rol: new FormControl(this.rolPermiso.rol.id, Validators.required),
      permiso: new FormControl(this.rolPermiso.permiso.id, Validators.required),
    });
  }

  loadRoles(): void {
    this.rolPermisoService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles; // Asigna la lista de roles
      },
    });
  }

  loadPermisos(): void {
    this.rolPermisoService.getPermisos().subscribe({
      next: (permisos) => {
        this.permisos = permisos; // Asigna la lista de permisos
      },
    });
  }

  onSubmit(): void {
    if (this.rolPermiso) {
      const { id, rol, permiso } = this.rolPermiso;
      const updatedRolPermiso: RolePermiso = {
        id,
        rol: { ...rol },
        permiso: { ...permiso },
      };
      this.rolPermisoService
        .editarRolePermiso(this.rolPermiso.id, updatedRolPermiso)
        .subscribe({
          next: () => {
            this.mensajeModal = 'Rol Permiso Actualizado con éxito';
          },
          error: (error) => {
            this.errorModal =
              error.error?.error?.join('<br>') ||
              'Error al actualizar el rol permiso.';
          },
        });
    } else {
      this.errorModal = 'Por favor, completa todos los campos requeridos.';
    }
  }

  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal
    this.listarRolPermisoEditado.emit(); // Emitir el evento para listar categorías
  }

  manejarError() {
    this.errorModal = '';
  }
}
