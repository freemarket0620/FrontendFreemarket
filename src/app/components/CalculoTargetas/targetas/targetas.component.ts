import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';

@Component({
  selector: 'app-targetas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './targetas.component.html',
  styleUrls: ['./targetas.component.css'],
})
export class TargetasComponent implements OnInit {
  numeroManual: string = '';
  clienteDetectado: { nombre: string; numero: string } | null = null;
  isAdmin: boolean = false;
  isAdministracionYucumo: boolean = false; // Nueva propiedad para verificar el rol

  tarjetas = [
    { nombre: '10', precio: null, cantidad: null, resultado: 0 },
    { nombre: '15', precio: null, cantidad: null, resultado: 0 },
    { nombre: '30', precio: null, cantidad: null, resultado: 0 },
    { nombre: '50', precio: null, cantidad: null, resultado: 0 },
    { nombre: '100', precio: null, cantidad: null, resultado: 0 },
    { nombre: 'Chips', precio: null, cantidad: null, resultado: 0 },
  ];

  clientes = [
    { nombre: 'Cris', numero: '59178788897' },
    { nombre: 'Paola', numero: '59179592175' },
    { nombre: 'Tejada', numero: '59171294007' },
    { nombre: 'Cruzet', numero: '59178761850' },
    { nombre: 'Lurdes', numero: '59172595038' },
  ];

  busquedaCliente: string = '';
  clientesFiltrados: { nombre: string; numero: string }[] = [...this.clientes];

  preciosPorCantidad: Record<'10' | '15' | '30' | '50' | '100', { minimo: number; precio: number }[]> = {
    '10': [
      { minimo: 0, precio: 9.07 }, // Solo visible para el rol del administrador
      { minimo: 5, precio: 9.5 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 50, precio: 9.4 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 100, precio: 9.3 }, // Solo para AdministraciónYucumo y administrador
    ],
    '15': [
      { minimo: 0, precio: 13.50 }, // Solo visible para el rol del administrador
      { minimo: 5, precio: 14.2 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 50, precio: 14.1 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 100, precio: 14.0 }, // Solo para AdministraciónYucumo y administrador
    ],
    '30': [
      { minimo: 0, precio: 26.58 }, // Solo visible para el rol del administrador
      { minimo: 5, precio: 27.5 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 50, precio: 27.30 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 100, precio: 27.20 }, // Solo para AdministraciónYucumo y administrador
    ],
    '50': [
      { minimo: 0, precio: 44.28 }, // Solo visible para el rol del administrador
      { minimo: 5, precio: 46.5 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 50, precio: 45.5 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 100, precio: 45.3 }, // Solo para AdministraciónYucumo y administrador
    ],
    '100': [
      { minimo: 0, precio: 88.56 }, // Solo visible para el rol del administrador
      { minimo: 5, precio: 94.0 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 50, precio: 90.5 }, // Solo para AdministraciónYucumo y administrador
      { minimo: 100, precio: 90.0 }, // Solo para AdministraciónYucumo y administrador
    ],
  };

   constructor(private productoService: ServicesService) {}

  ngOnInit(): void {
    this.isAdmin = this.productoService.isAdmin(); // Verifica si el usuario es admin
    this.isAdministracionYucumo = this.productoService.isAdministracionYucumo(); // Verifica si el usuario es de AdministraciónYucumo
  }

  getPrecios(nombre: string): { minimo: number; precio: number }[] {
    // Devuelve los precios según el nombre de la tarjeta
    return this.preciosPorCantidad[nombre as keyof typeof this.preciosPorCantidad] || [];
  }

  calcularResultado(index: number) {
    const tarjeta = this.tarjetas[index];
    tarjeta.resultado = (tarjeta.precio != null && tarjeta.cantidad != null)
      ? parseFloat((tarjeta.precio * tarjeta.cantidad).toFixed(2))
      : 0;
  }

  calcularTotal() {
    // Calcula el total de todos los resultados
    return this.tarjetas.reduce((total, tarjeta) => total + tarjeta.resultado, 0).toFixed(2);
  }

  resetFormulario() {
    // Reinicia el formulario
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
    let mensaje = '📝 *Pedido de tarjetas:*🗒\n\n';
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
  getPreciosFiltrados(nombre: string): { minimo: number; precio: number }[] {
    const precios = this.getPrecios(nombre);
    if (this.isAdmin) {
      return precios; // Los administradores ven todos los precios
    } else if (this.isAdministracionYucumo) {
      return precios.filter(precio => precio.minimo > 0); // AdministraciónYucumo solo ve precios con mínimo > 0
    }
    return []; // Si no es ninguno, no ve precios
  }
}