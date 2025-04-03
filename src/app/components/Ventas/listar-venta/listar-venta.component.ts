import { Component, OnInit } from '@angular/core';
import { ServicesService } from '../../../Services/services.service'; // Importa el servicio correspondiente
import { Venta } from '../../../Models/models'; // Asegúrate de tener el modelo de Venta
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-listar-venta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './listar-venta.component.html',
  styleUrls: ['./listar-venta.component.css'],
})
export class ListarVentaComponent implements OnInit {
  ventas: Venta[] = []; // Array para almacenar las ventas
  searchID: string = ''; // Campo de búsqueda para el ID
  searchFecha: string = ''; // Campo de búsqueda para la fecha
  searchUsuario: string = ''; // Campo de búsqueda para el usuario
  searchTotal: string = ''; // Campo de búsqueda para el total
  searchEstado: string = ''; // Campo de búsqueda para el estado
  page: number = 1; // Página actual
  pageSize: number = 5; // Tamaño de la página

  constructor(private servicesService: ServicesService) {}

  ngOnInit(): void {
    this.getVentas(); // Obtener las ventas al inicializar el componente
  }

  getVentas() {
    this.servicesService.getVentas().subscribe((data) => {
      this.ventas = data.sort((a, b) => {
        // Ordenar por fecha_venta en orden descendente
        return (
          new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime()
        );
      });
    });
  }

  filteredVentas(): Venta[] {
    let filtered = this.ventas;

    if (this.searchID) {
      filtered = filtered.filter((venta) =>
        venta.id.toString().includes(this.searchID)
      );
    }

    if (this.searchFecha) {
      const searchDate = new Date(this.searchFecha).toLocaleDateString();
      filtered = filtered.filter((venta) =>
        new Date(venta.fecha_venta).toLocaleDateString().includes(searchDate)
      );
    }

    if (this.searchUsuario) {
      filtered = filtered.filter((venta) =>
        (venta.usuario.nombre_usuario + ' ' + venta.usuario.apellido)
          .toLowerCase()
          .includes(this.searchUsuario.toLowerCase())
      );
    }

    if (this.searchTotal) {
      filtered = filtered.filter((venta) =>
        venta.total.toString().includes(this.searchTotal)
      );
    }

    if (this.searchEstado) {
      filtered = filtered.filter((venta) =>
        venta.estado.toLowerCase().includes(this.searchEstado.toLowerCase())
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    ); // Mostrar solo la página actual
  }

  nextPage() {
    this.page++;
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }
}
