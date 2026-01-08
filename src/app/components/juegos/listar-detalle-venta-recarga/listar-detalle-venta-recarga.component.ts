import { Component, OnInit } from '@angular/core';
import { DetalleVenta, DetalleVentaRecarga } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-listar-detalle-venta-recarga',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './listar-detalle-venta-recarga.component.html',
  styleUrl: './listar-detalle-venta-recarga.component.css'
})
export class ListarDetalleVentaRecargaComponent implements OnInit {
  detalles: DetalleVentaRecarga[] = [];
  searchUsuario: string = '';
  searchJugador: string = '';
  page: number = 1;
  pageSize: number = 6;

  constructor(private service: ServicesService, private router: Router) {}

  ngOnInit(): void {
    this.getDetalles();
  }

  getDetalles() {
    this.service.getDetalleVentasRecarga().subscribe(data => this.detalles = data);
  }

  filteredDetalles(): DetalleVentaRecarga[] {
    let filtered = this.detalles;

    if (this.searchUsuario) {
      filtered = filtered.filter(d =>
        d.usuario_juego_id.toLowerCase().includes(this.searchUsuario.toLowerCase())
      );
    }

    if (this.searchJugador) {
      filtered = filtered.filter(d =>
        d.nombre_jugador?.toLowerCase().includes(this.searchJugador.toLowerCase())
      );
    }

    return filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  nextPage() { this.page++; }
  previousPage() { if (this.page > 1) this.page--; }

  editarDetalleVenta(id: number) {
    this.router.navigate(['panel-control/editar-DetalleVentaRecarga', id]);
  }

  registrarDetalleVenta() {
    this.router.navigate(['panel-control/registrar-DetalleVentaRecarga']);
  }
}