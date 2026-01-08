import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { Categoria } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registrar-categoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './registrar-categoria.component.html',
  styleUrls: ['./registrar-categoria.component.css'],
})
export class RegistrarCategoriaComponent {
  categoriasForm: FormGroup;
  @Output() listarCategorias = new EventEmitter<void>();
  errorModal: string = '';
  manejarModal: boolean = false;
  mensajeModal: string = '';

  constructor(private fb: FormBuilder, private userService: ServicesService, private router: Router) {
    this.categoriasForm = this.fb.group({
      nombreCategoria: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  register() {
    if (this.categoriasForm.get('nombreCategoria')?.invalid) {
      this.errorModal = 'El campo de nombre de la categoría es obligatorio';
      return; 
    }

    if (this.categoriasForm.valid) {
      const newCategoria: Categoria = {
        id: 0, // El backend generará el ID
        nombre_categoria: this.categoriasForm.value.nombreCategoria,
        descripcion: this.categoriasForm.value.descripcion,
        estado_categoria: true,
      };
      this.userService.crearCategoria(newCategoria).subscribe(
        (response) => {
          this.mensajeModal = 'Categoría registrada con éxito.';
          this.categoriasForm.reset(); // Reiniciar el formulario
        },
        (error) => {
          this.errorModal =
            'Error al registrar la categoría no pueden duplicarse los nombres de la categoria';
        }
      );
    } else {
      this.errorModal = 'Formulario no válido';
    }
  }

  manejarOk(): void {
    this.mensajeModal = '';
    this.router.navigate(['panel-control/listar-categorias']);
  }
  volver(): void {
    this.router.navigate(['panel-control/listar-categorias']);
  }
  manejarError() {
    this.errorModal = ''; // Ocultar el modal de error
  }
}
