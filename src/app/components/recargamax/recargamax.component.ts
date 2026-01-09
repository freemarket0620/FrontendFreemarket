import { Component, OnInit } from '@angular/core';
import { RecargaMax } from '../../Models/models';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ServicesService } from '../../Services/services.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-recargamax',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './recargamax.component.html',
  styleUrls: ['./recargamax.component.css']
})
export class RecargamaxComponent implements OnInit {

  recargas: RecargaMax[] = [];
  recargasFiltradas: RecargaMax[] = [];

  selectedRecarga: RecargaMax | null = null;

  saldoForm: FormGroup;
  cargaForm: FormGroup;
  newRecargaForm: FormGroup;

  // 🔍 búsqueda
  searchText: string = '';

  // 🧮 calculadora 50%
  cantidad: number = 0;
  resultado50: number = 0;

  constructor(private services: ServicesService, private fb: FormBuilder) {

    this.saldoForm = this.fb.group({
      saldo_total: [0, [Validators.required, Validators.min(0)]]
    });

    this.cargaForm = this.fb.group({
      numero_destino: ['', Validators.required],
      monto_carga: [0, [Validators.required, Validators.min(0)]]
    });

    this.newRecargaForm = this.fb.group({
      numero_origen: ['', Validators.required],
      saldo_total: [0, [Validators.required, Validators.min(0)]],
      numero_destino: [''],
      monto_carga: [0, [Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.loadRecargas();
  }

  loadRecargas() {
    this.services.getRecargaMax().subscribe(res => {
      this.recargas = res;
      this.recargasFiltradas = res;
    });
  }

  // ======================
  // 🔍 FILTRO DINÁMICO
  // ======================
  filtrar() {
    const texto = this.searchText.toLowerCase();

    this.recargasFiltradas = this.recargas.filter(r =>
      r.numero_origen.toLowerCase().includes(texto) ||
      r.numero_destino.toLowerCase().includes(texto)
    );
  }

  // ======================
  // 🧮 CALCULADORA 50%
  // ======================
  calcular50() {
    const valor = Number(this.cantidad) || 0;
    this.resultado50 = valor + (valor * 0.5);
  }

  // ======================
  // REGISTRAR
  // ======================
  registrarRecarga() {
    if (this.newRecargaForm.invalid) return;

    const recarga: Partial<RecargaMax> = {
      numero_origen: this.newRecargaForm.value.numero_origen,
      saldo_total: this.newRecargaForm.value.saldo_total,
      numero_destino: this.newRecargaForm.value.numero_destino || '',
      monto_carga: this.newRecargaForm.value.monto_carga || 0,
      estado: 'PENDIENTE'
    };

    this.services.crearRecargaMax(recarga as RecargaMax).subscribe(() => {
      this.loadRecargas();
      this.newRecargaForm.reset();
      bootstrap.Modal.getInstance(document.getElementById('modalRegistrar'))?.hide();
    });
  }

  // ======================
  // EDITAR SALDO
  // ======================
  openSaldoModal(recarga: RecargaMax) {
    this.selectedRecarga = recarga;
    this.saldoForm.setValue({ saldo_total: recarga.saldo_total });
    new bootstrap.Modal(document.getElementById('modalSaldo')).show();
  }

  saveSaldo() {
    if (!this.selectedRecarga || this.saldoForm.invalid) return;

    this.services.actualizarRecargaMax(
      this.selectedRecarga.id,
      { ...this.selectedRecarga, ...this.saldoForm.value }
    ).subscribe(() => {
      this.loadRecargas();
      this.selectedRecarga = null;
      bootstrap.Modal.getInstance(document.getElementById('modalSaldo'))?.hide();
    });
  }

  // ======================
  // EDITAR CARGA
  // ======================
  openCargaModal(recarga: RecargaMax) {
    this.selectedRecarga = recarga;
    this.cargaForm.setValue({
      numero_destino: recarga.numero_destino,
      monto_carga: recarga.monto_carga
    });
    new bootstrap.Modal(document.getElementById('modalCarga')).show();
  }

  saveCarga() {
    if (!this.selectedRecarga || this.cargaForm.invalid) return;

    const { numero_destino, monto_carga } = this.cargaForm.value;

    if (monto_carga > this.selectedRecarga.saldo_total) {
      alert('El monto de carga no puede ser mayor al saldo disponible.');
      return;
    }

    const updated: Partial<RecargaMax> = {
      numero_destino,
      monto_carga,
      saldo_total: this.selectedRecarga.saldo_total - monto_carga,
      estado: 'COMPLETADO'
    };

    this.services.actualizarRecargaMax(
      this.selectedRecarga.id,
      { ...this.selectedRecarga, ...updated }
    ).subscribe(() => {
      this.loadRecargas();
      this.selectedRecarga = null;
      bootstrap.Modal.getInstance(document.getElementById('modalCarga'))?.hide();
    });
  }
}
