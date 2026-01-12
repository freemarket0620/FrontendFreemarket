import { Component, OnInit } from '@angular/core';
import { Efectivo } from '../../Models/models';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicesService } from '../../Services/services.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type EfectivoKeys =
  | 'B200Bs' | 'B100Bs' | 'B50Bs' | 'B20Bs' | 'B10Bs'
  | 'M5Bs' | 'M2Bs' | 'M1' | 'M0_50Bs' | 'M0_20Bs' | 'M0_10Bs';

@Component({
  selector: 'app-efectivo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './efectivo.component.html',
  styleUrls: ['./efectivo.component.css']
})
export class EfectivoComponent implements OnInit {

  listaEfectivos: Efectivo[] = [];
  modalOpen: boolean = false;
  modalTitle: string = 'Nuevo Efectivo';
  formEfectivo: FormGroup;
  editingId: number | null = null;

  subtotales: { [key in EfectivoKeys]: number } = {} as any;
  total: number = 0;

  bills: EfectivoKeys[] = ['B200Bs','B100Bs','B50Bs','B20Bs','B10Bs'];
  coins: EfectivoKeys[] = ['M5Bs','M2Bs','M1','M0_50Bs','M0_20Bs','M0_10Bs'];
mensaje: string = '';
tipoMensaje: 'success' | 'danger' | '' = '';

  constructor(
    private services: ServicesService,
    private fb: FormBuilder
  ) {
    this.formEfectivo = this.fb.group({
      B200Bs: [0, [Validators.required, Validators.min(0)]],
      B100Bs: [0, [Validators.required, Validators.min(0)]],
      B50Bs: [0, [Validators.required, Validators.min(0)]],
      B20Bs: [0, [Validators.required, Validators.min(0)]],
      B10Bs: [0, [Validators.required, Validators.min(0)]],
      M5Bs: [0, [Validators.required, Validators.min(0)]],
      M2Bs: [0, [Validators.required, Validators.min(0)]],
      M1: [0, [Validators.required, Validators.min(0)]],
      M0_50Bs: [0, [Validators.required, Validators.min(0)]],
      M0_20Bs: [0, [Validators.required, Validators.min(0)]],
      M0_10Bs: [0, [Validators.required, Validators.min(0)]],
    });

    // Recalcular subtotales automáticamente al cambiar cantidades
    this.formEfectivo.valueChanges.subscribe(() => {
      [...this.bills, ...this.coins].forEach(key => this.calcularSubtotal(key));
    });
  }

  ngOnInit(): void {
    this.cargarEfectivos();
  }

  cargarEfectivos() {
    this.services.getEfectivos().subscribe(res => this.listaEfectivos = res);
  }

  abrirModal(efectivo?: Efectivo) {
    this.total = 0;
    this.subtotales = {} as any;

    if (efectivo) {
      this.editarEfectivo(efectivo);
    } else {
      this.modalTitle = 'Nuevo Efectivo';
      this.editingId = null;

      this.formEfectivo.reset({
        B200Bs:0,B100Bs:0,B50Bs:0,B20Bs:0,B10Bs:0,
        M5Bs:0,M2Bs:0,M1:0,M0_50Bs:0,M0_20Bs:0,M0_10Bs:0
      });

      [...this.bills, ...this.coins].forEach(key => this.subtotales[key] = 0);
    }

    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
  }

  // -------------------- MÉTODO DE EDICIÓN --------------------
editarEfectivo(efectivo: Efectivo) {
  this.modalTitle = 'Editar Efectivo';
  this.editingId = efectivo.id;

  [...this.bills, ...this.coins].forEach(key => {
    const subtotal = Number(efectivo[key]) || 0;
    this.subtotales[key] = subtotal;

    const denom = this.getDenomination(key);

    // 🔒 SOLUCIÓN: redondear a entero
    const cantidad = denom > 0
      ? Math.round(subtotal / denom)
      : 0;

    this.formEfectivo.get(key)?.setValue(cantidad, { emitEvent: false });
  });

  this.total = Math.round(
    Object.values(this.subtotales).reduce((a, b) => a + b, 0) * 100
  ) / 100;
}

calcularSubtotal(fieldKey: EfectivoKeys) {
  const cantidad = Number(this.formEfectivo.get(fieldKey)?.value) || 0;
  const denominacion = this.getDenomination(fieldKey);
  this.subtotales[fieldKey] = Math.round((cantidad * denominacion) * 100) / 100;
  this.total = Math.round(Object.values(this.subtotales).reduce((a, b) => a + b, 0) * 100) / 100;
}
  getDenomination(fieldKey: EfectivoKeys): number {
    switch(fieldKey) {
      case 'B200Bs': return 200;
      case 'B100Bs': return 100;
      case 'B50Bs': return 50;
      case 'B20Bs': return 20;
      case 'B10Bs': return 10;
      case 'M5Bs': return 5;
      case 'M2Bs': return 2;
      case 'M1': return 1;
      case 'M0_50Bs': return 0.5;
      case 'M0_20Bs': return 0.2;
      case 'M0_10Bs': return 0.1;
      default: return 0;
    }
  }


guardar() {
  if (this.formEfectivo.invalid) return;

  const data: any = {};
  [...this.bills, ...this.coins].forEach(key => {
    data[key] = this.subtotales[key].toFixed(2);
  });
  data.total = this.total.toFixed(2);

  if (this.editingId) {
    // ✏️ EDITAR
    this.services.actualizarEfectivo(this.editingId, data).subscribe({
      next: () => {
        this.cargarEfectivos();
        this.cerrarModal();
        this.mostrarMensaje('Efectivo actualizado correctamente ✔️', 'success');
      },
      error: () => {
        this.mostrarMensaje('Error al actualizar el efectivo ❌', 'danger');
      }
    });
  } else {
    // ✅ REGISTRAR
    this.services.crearEfectivo(data).subscribe({
      next: () => {
        this.cargarEfectivos();
        this.cerrarModal();
        this.mostrarMensaje('Efectivo registrado correctamente ✔️', 'success');
      },
      error: () => {
        this.mostrarMensaje('Error al registrar el efectivo ❌', 'danger');
      }
    });
  }
}

mostrarMensaje(mensaje: string, tipo: 'success' | 'danger') {
  this.mensaje = mensaje;
  this.tipoMensaje = tipo;

  // Ocultar mensaje después de 3 segundos
  setTimeout(() => {
    this.mensaje = '';
    this.tipoMensaje = '';
  }, 3000);
}

}
