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
  mostrarClientes = false;
  clienteSeleccionado: string | null = null;

  numeroManual: string = '';
  clienteDetectado: { nombre: string; numero: string } | null = null;

  tarjetas = [
    { nombre: '10', precio: null, cantidad: null, resultado: 0 },
    { nombre: '15', precio: null, cantidad: null, resultado: 0 },
    { nombre: '30', precio: null, cantidad: null, resultado: 0 },
    { nombre: '50', precio: null, cantidad: null, resultado: 0 },
    { nombre: '100', precio: null, cantidad: null, resultado: 0 },
    { nombre: 'Chips', precio: null, cantidad: null, resultado: 0 },
  ];
  clientes = [
    { nombre: 'Tienda Cris', numero: '59178788897' },
    { nombre: 'Tienda Paola', numero: '59179592175' },
    { nombre: 'Tienda Tejada', numero: '59171294007' },
    { nombre: 'Tienda Cruzet', numero: '59178761850' },
    { nombre: 'Tienda Lurdes', numero: '59172595038' },
    { nombre: 'Tienda Andres', numero: '59172937437' },
  ];
  busquedaCliente: string = '';
  clientesFiltrados: { nombre: string; numero: string }[] = [...this.clientes];

  preciosPorCantidad: Record<'10' | '15' | '30' | '50' | '100', { minimo: number; precio: number }[]> = {
    '10': [
      { minimo: 5, precio: 9.4 },
      { minimo: 50, precio: 9.35 },
      { minimo: 100, precio: 9.3 },
    ],
    '15': [
      { minimo: 5, precio: 14.2 },
      { minimo: 50, precio: 14.1 },
      { minimo: 100, precio: 14.0 },
    ],
    '30': [
      { minimo: 5, precio: 27.5 },
      { minimo: 50, precio: 27.30 },
      { minimo: 100, precio: 27.20 },
    ],
    '50': [
      { minimo: 5, precio: 46.5 },
      { minimo: 50, precio: 45.5 },
      { minimo: 100, precio: 45.3 },
    ],
    '100': [
      { minimo: 5, precio: 94.0 },
      { minimo: 50, precio: 90.5 },
      { minimo: 100, precio: 90.0 },
    ],
  };

  getPrecios(nombre: string): { minimo: number; precio: number }[] {
    if (nombre in this.preciosPorCantidad) {
      return this.preciosPorCantidad[nombre as keyof typeof this.preciosPorCantidad];
    }
    return [];
  }

  calcularResultado(index: number) {
    const tarjeta = this.tarjetas[index];

    if (tarjeta.precio != null && tarjeta.cantidad != null) {
      tarjeta.resultado = parseFloat((tarjeta.precio * tarjeta.cantidad).toFixed(2));
    } else {
      tarjeta.resultado = 0;
    }
  }

  calcularTotal() {
    const total = this.tarjetas.reduce((total, tarjeta) => total + tarjeta.resultado, 0);
    return total.toFixed(2);
  }

  resetFormulario() {
    this.tarjetas.forEach(t => {
      t.precio = null;
      t.cantidad = null;
      t.resultado = 0;
    });
  }

  enviarPorWhatsApp() {
    if (!this.clienteSeleccionado) {
      alert('Por favor selecciona un cliente.');
      return;
    }

    const mensaje = this.generarMensaje();
    // Codificar solo el mensaje, pero sin los emojis
    const mensajeCodificado = encodeURIComponent(mensaje.replace(/([^\x00-\x7F])/g, ''));
    const url = `https://wa.me/${this.clienteSeleccionado}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  }

  generarMensaje(): string {
    let mensaje = '📦 *Detalle de tu pedido de tarjetas:*\n\n';

    this.tarjetas.forEach(t => {
      if (t.cantidad && t.precio) {
        mensaje += `🔹 ${t.nombre}: ${t.cantidad} x ${t.precio} Bs = ${t.resultado.toFixed(2)} Bs\n`;
      }
    });

    mensaje += `\n💰 *Total:* ${this.calcularTotal()} Bs\n`;
    mensaje += '\n✅ ¡Gracias por tu compra! 😊';

    return mensaje;
  }


  filtrarClientes() {
    const busqueda = this.busquedaCliente.toLowerCase().trim();

    if (busqueda === '') {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente => {
      const nombre = cliente.nombre.toLowerCase();
      const numeroSinCodigo = cliente.numero.slice(3); // Quita el 591
      return nombre.includes(busqueda) || numeroSinCodigo.includes(busqueda);
    });

    // Si hay un solo cliente filtrado, asignar el número automáticamente
    if (this.clientesFiltrados.length === 1) {
      this.numeroManual = this.clientesFiltrados[0].numero;
      this.buscarClientePorNumero(); // Asegurarse de actualizar la detección del cliente
    }
  }

  // Método que se ejecuta cada vez que el número cambia
  buscarClientePorNumero() {
    const coincidencia = this.clientes.find(c => c.numero === this.numeroManual);
    if (coincidencia) {
      // Si encuentra una coincidencia, selecciona el cliente automáticamente
      this.clienteSeleccionado = coincidencia.numero;
      this.clienteDetectado = coincidencia;
    } else {
      // Si no se encuentra coincidencia, lo reseteará
      this.clienteSeleccionado = this.numeroManual;
      this.clienteDetectado = null;
    }
  }

  confirmarYEnviar() {
    if (!this.numeroManual) {
      alert('Por favor ingresa un número de cliente.');
      return;
    }
    this.enviarPorWhatsApp();
  }
}
