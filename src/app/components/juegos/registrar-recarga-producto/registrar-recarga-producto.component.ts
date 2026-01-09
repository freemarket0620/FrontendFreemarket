import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Categoria, RecargaProducto } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-registrar-recarga-producto',
  standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      FormsModule,
    ],
  templateUrl: './registrar-recarga-producto.component.html',
  styleUrl: './registrar-recarga-producto.component.css'
})
export class RegistrarRecargaProductoComponent implements OnInit {
  recargaForm: FormGroup;
  categorias: Categoria[] = [];
  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private fb: FormBuilder, private service: ServicesService, private router: Router) {
    this.recargaForm = this.fb.group({
      nombre: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      precio_compra: ['', [Validators.required, Validators.min(0)]],
      precio_venta: ['', [Validators.required, Validators.min(0)]],
      categoria: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias() {
    this.service.getCategorias().subscribe((data) => {
      this.categorias = data;
    });
  }

  registrarRecarga() {
    if (this.recargaForm.valid) {
      const recarga: RecargaProducto = this.recargaForm.value;
      this.service.crearRecargaProducto(recarga).subscribe({
        next: () => {
          this.mensajeModal = 'Recarga registrada con éxito';
          this.recargaForm.reset();
        },
        error: () => {
          this.errorModal = 'Error al registrar la recarga';
        },
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