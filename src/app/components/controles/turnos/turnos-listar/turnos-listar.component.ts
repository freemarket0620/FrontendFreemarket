import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Turno } from '../../../../Models/models';
import { ServicesService } from '../../../../Services/services.service';

@Component({
  selector: 'app-turnos-listar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './turnos-listar.component.html',
  styleUrl: './turnos-listar.component.css',
})
export class TurnosListarComponent {
  turnos: Turno[] = [];

  turnosFiltrados: Turno[] = [];
  turnosMostrados: Turno[] = [];

  busqueda = '';
  limite = 10;

  constructor(private turnoService: ServicesService, private router: Router) {}

  ngOnInit(): void {
    this.turnoService.getTurnos().subscribe((data) => {
      this.turnos = data;
      this.filtrar();
    });
  }

  actualizarTurnosMostrados(): void {
    this.turnosMostrados = this.turnosFiltrados.slice(0, this.limite);
  }

  onScroll(event: Event): void {
    const div = event.target as HTMLElement;
    const alFinal = div.scrollTop + div.clientHeight >= div.scrollHeight - 5;
    if (alFinal) {
      this.limite += 10;
      this.actualizarTurnosMostrados();
    }
  }

  filtrar(): void {
    const texto = this.busqueda.trim().toLowerCase();
    this.turnosFiltrados = this.turnos.filter((turno) =>
      turno.manana_tarde.toLowerCase().includes(texto)
    );
    this.limite = 10;
    this.actualizarTurnosMostrados();
  }

  irAEditar(id: number): void {
    this.router.navigate(['panel-control/editar-turnos', id]);
  }

  irARegistrar(): void {
    this.router.navigate(['panel-control/registrar-turnos']);
  }
}
