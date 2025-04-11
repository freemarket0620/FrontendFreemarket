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
    // Resetear los valores de las tarjetas
    this.tarjetas.forEach(t => {
      t.precio = null;
      t.cantidad = null;
      t.resultado = 0;
    });

    // Limpiar campos de cliente
    this.busquedaCliente = '';
    this.numeroManual = '';
    this.clienteSeleccionado = null;
    this.clienteDetectado = null;

    // Restaurar la lista de clientes filtrados
    this.clientesFiltrados = [...this.clientes];
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
    let mensaje = '\u{1F4E6} *Detalle de tu pedido de tarjetas:*\n\n';

    this.tarjetas.forEach(t => {
      if (t.cantidad && t.precio) {
        mensaje += `\u{1F539} ${t.nombre}: ${t.cantidad} x ${t.precio} Bs = ${t.resultado.toFixed(2)} Bs\n`;
      }
    });

    mensaje += `\n\u{1F4B0} *Total:* ${this.calcularTotal()} Bs\n`;
    mensaje += '\n\u2705 ¡Gracias por tu compra! \u{1F60A}';

    return mensaje;
  }



  filtrarClientes() {
    const busqueda = this.busquedaCliente.toLowerCase().trim();

    if (busqueda === '') {
      this.clientesFiltrados = [...this.clientes];
      this.numeroManual = '';
      this.clienteSeleccionado = null;
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente => {
      const nombre = cliente.nombre.toLowerCase();
      const numeroSinCodigo = cliente.numero.slice(3);
      return nombre.includes(busqueda) || numeroSinCodigo.includes(busqueda);
    });

    if (this.clientesFiltrados.length === 1) {
      this.numeroManual = this.clientesFiltrados[0].numero;
    } else if (/^\d{7,8}$/.test(busqueda)) {
      // Si ingresaron directamente un número (sin código 591)
      this.numeroManual = '591' + busqueda;
    }

    this.buscarClientePorNumero(); // Siempre actualiza detección
  }


  // Método que se ejecuta cada vez que el número cambia
  buscarClientePorNumero() {
    let numero = this.numeroManual.trim();

    // Si ya empieza con 591, lo dejamos; si no, lo agregamos
    if (!numero.startsWith('591')) {
      numero = '591' + numero;
    }

    const coincidencia = this.clientes.find(c => c.numero === numero);

    if (coincidencia) {
      this.clienteSeleccionado = coincidencia.numero;
      this.clienteDetectado = coincidencia;
    } else {
      this.clienteSeleccionado = numero;
      this.clienteDetectado = null;
    }
  }


  confirmarYEnviar() {
    if (!this.numeroManual) {
      alert('Por favor ingresa un número de cliente.');
      return;
    }

    this.buscarClientePorNumero();  // Asegura que se haya formateado correctamente
    this.enviarPorWhatsApp();
  }

}
