import { Role, Permiso } from './../../../Models/models';
import { Component, EventEmitter, Output } from '@angular/core';
import { ServicesService } from '../../../Services/services.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-rol-permiso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './registrar-rol-permiso.component.html',
  styleUrls: ['./registrar-rol-permiso.component.css'],
})
export class RegistrarRolPermisoComponent {
  rolPermisoForm: FormGroup;
  roles: Role[] = [];
  permisos: Permiso[] = [];
  errorModal: string = '';
  mensajeModal: string = '';

  constructor(
    private fb: FormBuilder,
    private servicesService: ServicesService
    , private router: Router
  ) {
    this.rolPermisoForm = this.fb.group({
      rol: ['', Validators.required],
      permiso: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermisos();
  }

  loadRoles() {
    this.servicesService.getRoles().subscribe((data) => {
      this.roles = data;
    });
  }

  loadPermisos() {
    this.servicesService.getPermisos().subscribe((data) => {
      this.permisos = data;
    });
  }

  registrarRolePermiso() {
    if (this.rolPermisoForm.valid) {
      this.servicesService
        .registrarRolePermiso(this.rolPermisoForm.value)
        .subscribe({
          next: () => {
            this.mensajeModal = 'Rol Permiso Registrado con éxito';
            this.rolPermisoForm.reset();
          },
          error: (error) => {
            if (error.error && error.error.error) {
              this.errorModal = error.error.error.join('<br>');
            } else {
              this.errorModal = 'Error al registrar el rol permiso.';
            }
          },
        });
    }
  }

  volver(): void {
    this.router.navigate(['panel-control/listar-roles-permisos']);
  }
  manejarOk() {
    this.mensajeModal = '';
    this.router.navigate(['panel-control/listar-roles-permisos']);
  }

  manejarError() {
    this.errorModal = ''; // Cerrar el modal en caso de error
  }
}
