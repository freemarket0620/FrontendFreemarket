import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';
import { ServicesService } from '../../../../Services/services.service';

@Component({
  selector: 'app-turnos-crear',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './turnos-crear.component.html',
  styleUrl: './turnos-crear.component.css',
})
export class TurnosCrearComponent {
  form!: FormGroup;
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private fb: FormBuilder,
    private servicio: ServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      id: [null],
      manana_tarde: [null, [Validators.required]],
      hora_inicio: [null, [Validators.required]],
      hora_fin: [null, [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.servicio.crearTurno(this.form.value).subscribe({
        next: () => {
          this.mensajeExito = 'Turno registrado con éxito';
        },
        error: (err) => {
          this.mensajeError = 'Error al registrar turno';
          console.error(err);
        },
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  volver(): void {
    this.router.navigate(['panel-control/listar-turnos']);
  }

  limpiarFormulario(): void {
    this.form.reset({
      id: null,
      manana_tarde: null,
      hora_inicio: null,
      hora_fin: null,
    });
  }

  manejarOk(): void {
    this.mensajeExito = '';
    this.router.navigate(['panel-control/listar-turnos']);
  }

  manejarError(): void {
    this.mensajeError = '';
  }
}
