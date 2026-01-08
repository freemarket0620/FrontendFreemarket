import { Component, OnInit } from '@angular/core';
import { Categoria, RecargaProducto } from '../../../Models/models';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-editar-recarga-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OkComponent, ErrorComponent],
  templateUrl: './editar-recarga-producto.component.html',
  styleUrl: './editar-recarga-producto.component.css'
})
export class EditarRecargaProductoComponent implements OnInit {
  recarga!: RecargaProducto;
  categorias: Categoria[] = [];
  form!: FormGroup;
  mensajeModal: string = '';
  errorModal: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ServicesService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadRecarga(id);
      this.loadCategorias();
    }
  }

  loadRecarga(id: number) {
    this.service.getRecargaProductoById(id).subscribe({
      next: (data) => {
        this.recarga = data;
        this.initializeForm();
      },
      error: (err) => console.error('Error cargando recarga:', err),
    });
  }

  loadCategorias() {
    this.service.getCategorias().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('Error cargando categorías:', err),
    });
  }

  initializeForm() {
    this.form = this.fb.group({
      nombre: [this.recarga.nombre, Validators.required],
      cantidad: [this.recarga.cantidad, [Validators.required, Validators.min(1)]],
      precio_compra: [this.recarga.precio_compra, [Validators.required, Validators.min(0)]],
      precio_venta: [this.recarga.precio_venta, [Validators.required, Validators.min(0)]],
      categoria: [this.recarga.categoria.id, Validators.required],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const updatedRecarga: RecargaProducto = this.form.value;
      this.service.actualizarRecargaProducto(this.recarga.id, updatedRecarga).subscribe({
        next: () => (this.mensajeModal = 'Recarga actualizada con éxito'),
        error: () => (this.errorModal = 'Error al actualizar la recarga'),
      });
    }
  }

  manejarOk() {
    this.mensajeModal = '';
    this.router.navigate(['panel-control/listar-RecargaProducto']);
  }

  manejarError() {
    this.errorModal = '';
  }

  volver() {
    this.router.navigate(['panel-control/listar-RecargaProducto']);
  }
}