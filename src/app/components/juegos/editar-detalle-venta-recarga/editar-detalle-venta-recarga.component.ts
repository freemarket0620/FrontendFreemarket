import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { DetalleVentaRecarga, RecargaProducto, Venta } from '../../../Models/models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editar-detalle-venta-recarga',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './editar-detalle-venta-recarga.component.html',
  styleUrl: './editar-detalle-venta-recarga.component.css'
})
export class EditarDetalleVentaRecargaComponent implements OnInit {
  detalle!: DetalleVentaRecarga;
  form!: FormGroup;
  productos: RecargaProducto[] = [];
  ventas: Venta[] = [];
  mensajeModal: string = '';
  errorModal: string = '';

  constructor(private service: ServicesService, private route: ActivatedRoute, private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadDetalle(id);
      this.loadProductos();
      this.loadVentas();
    }
  }

  loadDetalle(id: number) {
    this.service.getDetalleVentaRecargaById(id).subscribe({
      next: (data) => {
        this.detalle = data;
        this.initializeForm();
      },
      error: (err) => console.error('Error cargando detalle:', err)
    });
  }

  loadProductos() {
    this.service.getRecargaProductos().subscribe(data => this.productos = data);
  }

  loadVentas() {
    this.service.getVentas().subscribe(data => this.ventas = data);
  }

  initializeForm() {
    this.form = this.fb.group({
      recarga: [this.detalle.recarga.id, Validators.required],
      usuario_juego_id: [this.detalle.usuario_juego_id, Validators.required],
      nombre_jugador: [this.detalle.nombre_jugador],
      password_jugador: [this.detalle.password_jugador],
      cantidad: [this.detalle.cantidad, [Validators.required, Validators.min(1)]],
      precio: [this.detalle.precio, [Validators.required, Validators.min(0)]],
      subtotal: [this.detalle.subtotal, Validators.required],
      estado: [this.detalle.estado, Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const data: DetalleVentaRecarga = this.form.value;
      this.service.actualizarDetalleVentaRecarga(this.detalle.id, data).subscribe({
        next: () => this.mensajeModal = 'Detalle de venta actualizado con éxito',
        error: (err) => { console.error('Error actualizando detalle:', err); this.errorModal = 'Error al actualizar detalle'; }
      });
    }
  }

  volver() { this.router.navigate(['panel-control/listar-DetalleVentaRecarga']); }
  manejarOk() { this.mensajeModal = ''; this.router.navigate(['panel-control/listar-DetalleVentaRecarga']); }
  manejarError() { this.errorModal = ''; }
}