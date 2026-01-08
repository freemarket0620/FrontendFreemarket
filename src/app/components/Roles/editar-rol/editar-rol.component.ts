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
import { ActivatedRoute, Router } from '@angular/router';

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

  mensajeModal: string = '';
  errorModal: string = '';

  constructor(
    private servicesService: ServicesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.editarForm = new FormGroup({
      nombre_rol: new FormControl('', Validators.required),
      estado_Rol: new FormControl(true),
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarRol(id);
    }
  }

  cargarRol(id: number): void {
    this.servicesService.getRolesById(id).subscribe({
      next: (data) => {
        this.role = data;
        this.editarForm.patchValue({
          nombre_rol: data.nombre_rol,
          estado_Rol: data.estado_Rol,
        });
      },
      error: (error) => {
        console.error('Error al cargar rol:', error);
        this.errorModal = 'No se pudo cargar el rol';
      },
    });
  }

  onSubmit(): void {
    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      return;
    }

    const rolActualizado: Role = {
      ...this.role,
      ...this.editarForm.value,
    };

    this.servicesService.editarRoles(this.role.id, rolActualizado).subscribe({
      next: () => {
        this.mensajeModal = 'Rol actualizado con éxito';
      },
      error: () => {
        this.errorModal = 'Error al actualizar el rol';
      },
    });
  }

  manejarOk(): void {
    this.mensajeModal = '';
    this.router.navigate(['panel-control/listar-roles']);
  }
  volver(): void {
    this.router.navigate(['panel-control/listar-roles']);
  }


  manejarError(): void {
    this.errorModal = '';
  }
}