import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../../Services/services.service'; // Asegúrate de que el servicio esté correctamente importado
import { Categoria } from '../../../Models/models';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component'; // Importa el modelo adecuado para Categoria

@Component({
  selector: 'app-editar-categoria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OkComponent, ErrorComponent],
  templateUrl: './editar-categoria.component.html',
  styleUrls: ['./editar-categoria.component.css'],
})
export class EditarCategoriaComponent implements OnInit {
  categoria!: Categoria;
  editarForm!: FormGroup;

  @Input() set categoriaId(id: number | null) {
    if (id) {
      this.loadCategoriaData(id);
    }
  }
  @Output() listarCategoriaEditada = new EventEmitter<void>();

  manejarModal: boolean = false;
  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.editarForm = new FormGroup({
      nombre_categoria: new FormControl('', Validators.required),
      descripcion: new FormControl('', Validators.required),
    });
  }

  loadCategoriaData(id: number) {
    this.servicesService.getCategoriaById(id).subscribe({
      next: (data) => {
        this.categoria = data;
        this.initializeForm(); // Asegúrate de inicializar el formulario aquí
      },
      error: (error) => {
        console.error('Error al cargar los datos de la categoría:', error);
      },
    });
  }

  initializeForm() {
    this.editarForm.setValue({
      nombre_categoria: this.categoria.nombre_categoria,
      descripcion: this.categoria.descripcion,
    });
  }

  onSubmit(): void {
    if (!this.editarForm.valid) {
      this.errorModal = 'Por favor, complete todos los campos requeridos.';
      return; // Salir si el formulario no es válido
    }

    const updatedCategoria = { ...this.categoria, ...this.editarForm.value };
    this.servicesService
      .actualizarCategoria(this.categoria.id, updatedCategoria)
      .subscribe({
        next: (data) => {
          console.log(data);
          this.mensajeModal = 'Categoría actualizada con éxito';
        },
        error: (error) => {
          if (error.message.includes('ya existe')) {
            this.errorModal = 'Error al editar: \n' + error.message; // Mensaje de duplicado
          } else {
            this.errorModal = 'Error al actualizar la categoría';
          }
        },
      });
  }

  manejarOk() {
    this.mensajeModal = ''; // Cerrar el modal
    this.listarCategoriaEditada.emit(); // Emitir el evento para listar categorías
  }

  manejarError() {
    this.errorModal = '';
  }
}
