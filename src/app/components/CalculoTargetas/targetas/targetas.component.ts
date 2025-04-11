import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-targetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './targetas.component.html',
  styleUrls: ['./targetas.component.css'],
})
export class TargetasComponent {
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
    return this.preciosPorCantidad[nombre as keyof typeof this.preciosPorCantidad] || [];
  }

  calcularResultado(index: number) {
    const tarjeta = this.tarjetas[index];
    tarjeta.resultado = (tarjeta.precio != null && tarjeta.cantidad != null)
      ? parseFloat((tarjeta.precio * tarjeta.cantidad).toFixed(2))
      : 0;
  }

  calcularTotal() {
    return this.tarjetas.reduce((total, tarjeta) => total + tarjeta.resultado, 0).toFixed(2);
  }

  resetFormulario() {
    this.tarjetas.forEach(t => {
      t.precio = null;
      t.cantidad = null;
      t.resultado = 0;
    });
    this.busquedaCliente = '';
    this.numeroManual = '';
    this.clienteDetectado = null;
    this.clientesFiltrados = [...this.clientes];
  }

  enviarPorWhatsApp() {
    if (!this.numeroManual) {
      alert('Por favor selecciona un cliente.');
      return;
    }
    const mensaje = this.generarMensaje();
    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/${this.numeroManual}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  }

  generarMensaje(): string {
    let mensaje = '📝 *Detalle de tu pedido de tarjetas:*🗒\n\n';
    this.tarjetas.forEach(t => {
      if (t.cantidad && t.precio) {
        mensaje += `🔷${t.nombre}: ${t.cantidad} ❌ ${t.precio} Bs 🟰 ${t.resultado.toFixed(2)} Bs\n`;
      }
    });
    mensaje += `\n💵 *Total:* ${this.calcularTotal()} Bs\n`;
    mensaje += '\n✅ ¡Gracias por tu compra! 😊';
    return mensaje;
  }

  filtrarClientes() {
    const busqueda = this.busquedaCliente.toLowerCase().trim();
    this.clientesFiltrados = busqueda === ''
      ? [...this.clientes]
      : this.clientes.filter(cliente => 
          cliente.nombre.toLowerCase().includes(busqueda) || 
          cliente.numero.slice(3).includes(busqueda)
        );

    if (this.clientesFiltrados.length === 1) {
      this.numeroManual = this.clientesFiltrados[0].numero;
    } else if (/^\d{7,8}$/.test(busqueda) && !busqueda.startsWith('591')) {
      this.numeroManual = '591' + busqueda;
    }

    this.buscarClientePorNumero();
  }

  buscarClientePorNumero() {
    let numero = this.numeroManual.trim();
    if (!numero.startsWith('591')) {
      numero = '591' + numero;
    }
    const coincidencia = this.clientes.find(c => c.numero === numero);
    this.numeroManual = coincidencia ? coincidencia.numero : numero;
    this.clienteDetectado = coincidencia || null;
  }

  confirmarYEnviar() {
    if (!this.numeroManual) {
      alert('Por favor ingresa un número de cliente.');
      return;
    }
    this.buscarClientePorNumero();
    this.enviarPorWhatsApp();
  }
}
