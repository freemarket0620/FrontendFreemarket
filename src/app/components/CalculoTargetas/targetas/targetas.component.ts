import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-targetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './targetas.component.html',
  styleUrl: './targetas.component.css',
})
export class TargetasComponent {
  // Arreglo para almacenar los datos de las tarjetas
  tarjetas = [
    { nombre: 'hola 10', precio: 0, cantidad: 0, resultado: 0 },
    { nombre: 'hola 15', precio: 0, cantidad: 0, resultado: 0 },
    { nombre: 'hola 30', precio: 0, cantidad: 0, resultado: 0 },
    { nombre: 'hola 50', precio: 0, cantidad: 0, resultado: 0 },
    { nombre: 'hola 100', precio: 0, cantidad: 0, resultado: 0 },
    { nombre: 'Chips', precio: 0, cantidad: 0, resultado: 0 },
  ];

  // Método para calcular el resultado de cada tarjeta
  calcularResultado(index: number) {
    const tarjeta = this.tarjetas[index];
    tarjeta.resultado = parseFloat(
      (tarjeta.precio * tarjeta.cantidad).toFixed(2)
    );
  }

  // Método para calcular el total de todos los resultados
  calcularTotal() {
    const total = this.tarjetas.reduce(
      (total, tarjeta) => total + tarjeta.resultado,
      0
    );
    return total.toFixed(2); // Redondear el total a 2 decimales
  }
}
 