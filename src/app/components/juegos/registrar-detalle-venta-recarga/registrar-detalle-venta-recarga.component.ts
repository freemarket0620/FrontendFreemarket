import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DetalleVentaRecarga, RecargaProducto, Venta } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';

@Component({
  selector: 'app-registrar-detalle-venta-recarga',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registrar-detalle-venta-recarga.component.html',
  styleUrls: ['./registrar-detalle-venta-recarga.component.css']
})
export class RegistrarDetalleVentaRecargaComponent implements OnInit {
  detalleForm: FormGroup;
  productos: RecargaProducto[] = [];
  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private fb: FormBuilder, private service: ServicesService, private router: Router) {
    this.detalleForm = this.fb.group({
      recarga: ['', Validators.required],
      usuario_juego_id: ['', Validators.required],
      nombre_jugador: [''],
      password_jugador: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio: [{ value: 0, disabled: true }, Validators.required],
      subtotal: [{ value: 0, disabled: true }, Validators.required],
      estado: ['PENDIENTE', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProductos();

    this.detalleForm.get('recarga')?.valueChanges.subscribe(recargaId => {
      const recarga = this.productos.find(r => r.id === +recargaId);
      if (recarga) {
        this.detalleForm.get('precio')?.setValue(recarga.precio_venta);
        this.calcularSubtotal();
      } else {
        this.detalleForm.get('precio')?.setValue(0);
        this.detalleForm.get('subtotal')?.setValue(0);
      }
    });

    this.detalleForm.get('cantidad')?.valueChanges.subscribe(() => this.calcularSubtotal());
  }

  loadProductos() {
    this.service.getRecargaProductos().subscribe(data => this.productos = data);
  }

  calcularSubtotal() {
    const cantidad = this.detalleForm.get('cantidad')?.value || 0;
    const precio = this.detalleForm.get('precio')?.value || 0;
    this.detalleForm.get('subtotal')?.setValue(cantidad * precio);
  }

  registrarDetalleVenta() {
  if (!this.detalleForm.valid) {
    this.errorModal = 'Complete todos los campos obligatorios';
    return;
  }

  const recargaId = +this.detalleForm.get('recarga')!.value;
  const recarga = this.productos.find(r => r.id === recargaId);
  if (!recarga) {
    this.errorModal = 'Recarga no válida';
    return;
  }

  const detalleData = {
    recarga: recargaId, // solo el ID
    usuario_juego_id: this.detalleForm.get('usuario_juego_id')!.value,
    nombre_jugador: this.detalleForm.get('nombre_jugador')!.value,
    password_jugador: this.detalleForm.get('password_jugador')!.value,
    cantidad: this.detalleForm.get('cantidad')!.value,
    estado: this.detalleForm.get('estado')!.value
  };

  // Llamada al servicio con subscribe válido
  this.service.crearDetalleVentaRecarga(detalleData).subscribe({
    next: (res) => {
      this.mensajeModal = 'Detalle de venta registrado con éxito';
      this.detalleForm.reset({ cantidad: 1, subtotal: 0, estado: 'PENDIENTE' });
    },
    error: (err) => {
      console.error('Error registrando detalle:', err);
      this.errorModal = 'Error al registrar detalle de venta';
    }
  });
}


  volver() { this.router.navigate(['panel-control/listar-DetalleVentaRecarga']); }
  manejarOk() { this.mensajeModal = ''; this.router.navigate(['panel-control/listar-DetalleVentaRecarga']); }
  manejarError() { this.errorModal = ''; }
}