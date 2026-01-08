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
import { ActivatedRoute, Router } from '@angular/router';

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

  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private servicesService: ServicesService,private router: Router,    private route: ActivatedRoute,) {}

  ngOnInit(): void {
    this.editarForm = new FormGroup({
      nombre_permiso: new FormControl('', Validators.required),
      descripcion: new FormControl('', Validators.required),
      estado_Permiso: new FormControl(true),
    });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadPermisoData(id);
    }
  }

  loadPermisoData(id: number) {
    this.servicesService.getPermisosById(id).subscribe({
      next: (data) => {
        this.permiso = data;
         this.editarForm.patchValue({
          nombre_permiso: data.nombre_permiso,
          estado_Permiso: data.estado_Permiso,
          descripcion: data.descripcion
        });
        
      },
      error: (error) => {
        console.error('Error al cargar los datos del permiso:', error);
        this.errorModal = 'No se pudo cargar el permiso. Intente nuevamente.';
      },
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
  volver(): void {
    this.router.navigate(['panel-control/listar-permisos']);
  }

  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal de éxito
    this.router.navigate(['panel-control/listar-permisos']);
  }

  manejarError() {
    this.errorModal = ''; // Cerrar el modal de error
  }
}
