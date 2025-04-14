import { Component } from '@angular/core';
import {
  Categoria,
  DetalleVenta,
  Producto,
  Usuario,
  Venta,
} from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-listar-productos-empleado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './listar-productos-empleado.component.html',
  styleUrl: './listar-productos-empleado.component.css',
})
export class ListarProductosEmpleadoComponent {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  ventas: Venta[] = [];
  usuarios: Usuario[] = []; // Lista de usuarios recuperados de la base de datos
  detalleVentas: DetalleVenta[] = [];
  searchNombreProducto: string = '';
  searchCategoria: string = '';
  searchPrecio: string = '';
  searchCodigoProducto: string = '';
  modalVisible: boolean = false;
  imageToShow: string = '';

  page: number = 1;
  pageSize: number = 6;
  detalleVenta: DetalleVenta[] = [];
  totalVenta: number = 0;
  cantidadPorProducto: { [key: number]: number } = {};
  ventaForm: FormGroup;
  detalleVentaForm: any;

  idVentaActual: number | null = null;

  /* RECUPEAR EL NOMBRE Y EL USUARIO id */
  usuario_id: number = 0; // Agregar propiedad para el ID del usuario
  nombre_usuario: string = '';
  apellido: string = '';
  mostrarPrecioMayor: boolean = true; // Inicializa en true
  /* variables para los camboios  */
  montoPagado: string = '';
  cambio: number = 0;
  constructor(
    private productoService: ServicesService,
    private fb: FormBuilder
  ) {
    this.ventaForm = this.fb.group({
      usuario: ['', Validators.required],
      estado: ['Completada', Validators.required],
      total: [{ value: 0, disabled: true }],
    });
    // Inicialización del formulario para el detalle de venta
    this.detalleVentaForm = this.fb.group({
      producto: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      precio_unitario: ['', [Validators.required, Validators.min(0)]],
      precio_mayor: ['', [Validators.required, Validators.min(0)]],
      tipo_venta: ['mayor'],
    });
  }

  ngOnInit(): void {
    this.getUsuarios(); // Asegúrate de que esto se llame primero
    this.getProductos();
    this.getCategorias();
    this.getVentas();
    this.recuperarUsuario(); // Llama a este método después de cargar los usuarios
  }
  recuperarUsuario() {
    const usuario = this.getUsuarioLocalStorage();
    if (usuario) {
      this.nombre_usuario = usuario.nombre_usuario || '';
      this.apellido = usuario.apellido || '';
      this.usuario_id = usuario.usuario_id || 0;
      const roles = this.productoService.getRolesFromLocalStorage();
      this.mostrarPrecioMayor = !this.tieneRolOcultarPrecio(roles);

      // Verificar si el usuario existe en la base de datos
      this.productoService
        .verificarUsuario(this.usuario_id)
        .subscribe((usuarioExistente) => {
          if (usuarioExistente) {
            const usuarioSeleccionado = this.usuarios.find(
              (u) => u.id === this.usuario_id
            );
            if (usuarioSeleccionado) {
              this.ventaForm.patchValue({ usuario: usuarioSeleccionado });
            }
          }
        });
    }
  }
  // Método para verificar si el usuario tiene un rol que debe ocultar el precio mayor
  tieneRolOcultarPrecio(roles: string[]): boolean {
    const rolesOcultarPrecio = ['Empleado', 'Cajero', 'JefeDeEmpleado'];
    return roles.some((rol) => rolesOcultarPrecio.includes(rol));
  }
  private getUsuarioLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        const usuario = localStorage.getItem('usuario');
        return usuario ? JSON.parse(usuario) : null;
      } catch (error) {
        console.error('Error al recuperar usuario de localStorage', error);
        return null;
      }
    }
    return null;
  }

  getVentas() {
    this.productoService.getVentas().subscribe((data) => {
      this.ventas = data;
    });
  }
  getProductos() {
    this.productoService.getProductos().subscribe((data) => {
      this.productos = data;
    });
  }
  getCategorias() {
    this.productoService.getCategorias().subscribe((data) => {
      this.categorias = data;
    });
  }
  getUsuarios() {
    this.productoService.getUsuarios().subscribe((data) => {
      this.usuarios = data; // Asigna los datos a la propiedad usuarios
    });
  }
  // Modificación en el método agregarAlCarrito
  aagregarAlCarrito(producto: Producto, cantidad: number, tipoPrecio: string) {
    if (cantidad <= 0 || cantidad > producto.stock) {
      alert(
        'Cantidad inválida. No puede ser mayor al stock disponible ni menor a 1.'
      );
      return;
    }

    // Verificar si el producto ya está en el detalle de venta
    const existingDetail = this.detalleVenta.find(
      (d) => d.producto.id === producto.id
    );

    let precioUnitario =
      tipoPrecio === 'mayor' ? producto.precio_mayor : producto.precio_unitario;

    if (existingDetail) {
      // Si ya existe, actualizar la cantidad y el subtotal
      existingDetail.cantidad = cantidad; // Actualizar la cantidad existente
      existingDetail.subtotal = cantidad * precioUnitario; // Actualizar el subtotal
      existingDetail.tipo_venta = tipoPrecio;
    } else {
      // Si no existe, agregar un nuevo detalle
      const detalle: DetalleVenta = {
        id: this.detalleVenta.length + 1, // Asignar un ID temporal o manejarlo según tu lógica
        venta: { id: 0 } as Venta, // Asignar un objeto de tipo Venta con un ID temporal
        producto: producto,
        cantidad: cantidad,
        precio: precioUnitario,
        subtotal: cantidad * precioUnitario,
        tipo_venta: tipoPrecio,
      };

      this.detalleVenta.push(detalle);
    }
    this.actualizarTotalVenta();
    this.cantidadPorProducto[producto.id]; // Reiniciar la cantidad después de agregar
  }
  actualizarCantidad(
    item: DetalleVenta | undefined,
    nuevaCantidad: number,
    tipoPrecio: string
  ) {
    if (!item) {
      console.error('No se encontró el detalle de venta.');
      return; // Salir si el item es undefined
    }

    // Verificar que la nueva cantidad sea válida
    if (nuevaCantidad < 1) {
      alert('La cantidad no puede ser menor a 1.');
      return;
    }

    if (nuevaCantidad > item.producto.stock) {
      alert('La cantidad no puede ser mayor al stock disponible.');
      return;
    }

    // Determinar el precio unitario según el tipo de precio
    let precioUnitario =
      tipoPrecio === 'mayor'
        ? item.producto.precio_mayor
        : item.producto.precio_unitario;

    // Actualizar la cantidad y el subtotal
    item.cantidad = nuevaCantidad;
    item.subtotal = nuevaCantidad * precioUnitario; // Actualizar el subtotal

    this.actualizarTotalVenta(); // Actualizar el total de la venta
  }
  getDetalleVenta(productoId: number): DetalleVenta | undefined {
    return this.detalleVenta.find((d) => d.producto.id === productoId);
  }

  agregarDetalle() {
    if (this.detalleVentaForm.valid) {
      const nuevoDetalle: DetalleVenta = {
        ...this.detalleVentaForm.value,
        subtotal:
          this.detalleVentaForm.value.cantidad *
          this.detalleVentaForm.value.precio_unitario,
      };

      // Verificar si el producto ya está en el detalle de venta
      const existingDetail = this.detalleVenta.find(
        (d) => d.producto.id === nuevoDetalle.producto.id
      );

      if (existingDetail) {
        // Si ya existe, actualizar la cantidad y el subtotal
        existingDetail.cantidad = nuevoDetalle.cantidad;
        existingDetail.subtotal = nuevoDetalle.subtotal;
      } else {
        // Si no existe, agregar un nuevo detalle
        this.detalleVenta.push(nuevoDetalle);
      }

      this.detalleVentaForm.reset();
      this.actualizarTotalVenta(); // Asegúrate de actualizar el total después de agregar o modificar
    }
  }
  actualizarTotalVenta() {
    this.totalVenta = this.detalleVenta.reduce(
      (total, item) => total + item.subtotal,
      0
    );
  }

  eliminarProducto(item: DetalleVenta) {
    this.detalleVenta = this.detalleVenta.filter((d) => d !== item);
    this.actualizarTotalVenta();
  }

  verificarCantidad(item: any) {
    if (item.cantidad > item.producto.stock) {
      item.cantidad = item.producto.stock; // Restablece la cantidad al máximo disponible en stock
    }
  }

  // Método para registrar la venta
  registrarVenta() {
    if (this.ventaForm.valid && this.detalleVenta.length > 0) {
      const { usuario, estado } = this.ventaForm.value; // Desestructuración para obtener usuario y estado

      const nuevaVenta: Venta = {
        id: 0, // Asignar un ID temporal o manejarlo según tu lógica
        usuario: { ...usuario }, // Usar el operador de propagación para incluir todas las propiedades del usuario
        estado,
        total: this.totalVenta,
        fecha_venta: new Date(),
      };

      // Registrar la venta
      this.productoService.crearVenta(nuevaVenta).subscribe(
        (response) => {
          console.log('Venta registrada:', response);
          this.idVentaActual = response.id; // Almacenar el ID de la venta registrada
          this.registrarDetallesVenta(); // Llama a registrar detalles con el ID de la venta
        },
        (error) => {
          console.error('Error al registrar la venta:', error);
        }
      );
    }
  }

  // Método para registrar los detalles de la venta
  registrarDetallesVenta() {
    if (this.detalleVenta.length === 0) {
      alert('No hay detalles de venta para registrar.');
      return;
    }
    if (this.idVentaActual === null) {
      alert('No se ha registrado ninguna venta.'); // Asegúrate de que haya un ID de venta
      return;
    }
    const detalles: DetalleVenta[] = this.detalleVenta.map((item) => ({
      id: 0, // Puedes asignar un ID temporal o manejarlo según tu lógica
      venta: { id: this.idVentaActual } as Venta, // Asegúrate de que esto sea un objeto de tipo Venta
      producto: item.producto,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal,
      tipo_venta: item.tipo_venta,
    }));
    // Registrar cada detalle de la venta
    const stockUpdatePromises = detalles.map((detalle) => {
      return this.productoService.crearDetalleVenta(detalle).toPromise();
    });
    // Esperar a que todas las actualizaciones de stock se completen
    Promise.all(stockUpdatePromises).then(() => {
      // Una vez que se actualiza el stock, obtener la lista de productos nuevamente
      this.getProductos(); // Esto actualizará la lista de productos en la interfaz
      // Limpiar el carrito después de registrar
      this.detalleVenta = [];
      this.totalVenta = 0;
      this.idVentaActual = null; // Reiniciar el ID de la venta actual
      alert('Venta registrada correctamente.');
    });
  }
  // Método para obtener la lista de productos
  calcularTotal() {
    this.totalVenta = this.detalleVenta.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );
    this.ventaForm.patchValue({ total: this.totalVenta });
  }

  calcularCambio() {
    // Convierte montoPagado a número antes de realizar la resta
    const montoPagadoNum = parseFloat(this.montoPagado) || 0; // Si no es un número, usa 0
    this.cambio = montoPagadoNum - this.totalVenta;
  }
  formatNumber(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  isCantidadValida(productoId: number, tipoPrecio: string): boolean {
    const cantidad = this.cantidadPorProducto[productoId];
    const producto = this.productos.find((p) => p.id === productoId);

    if (
      tipoPrecio === 'mayor' &&
      producto?.categoria.nombre_categoria === 'Targetas Entel Tigo Viva'
    ) {
      return cantidad >= 10; // La cantidad debe ser mayor o igual a 10
    }

    return (
      !isNaN(cantidad) &&
      cantidad !== null &&
      cantidad !== undefined &&
      cantidad > 0
    ); // Validación general
  }
  isCategoriaConBotonUnidad(producto: Producto): boolean {
    return producto.categoria.nombre_categoria === 'Targetas Entel Tigo Viva';
  }

  clearQuantities() {
    this.cantidadPorProducto = {}; // Reset the quantities to an empty object
    this.searchCategoria = '';
    this.searchNombreProducto = '';
    this.searchCodigoProducto = '';
    this.searchPrecio = '';
  }
  /* *********************************** */
  /* *********************************** */
  /*     seccion de menos importancia    */
  /* *********************************** */
  /* *********************************** */

  filteredProductos(): Producto[] {
    let filtered = this.productos;
    if (this.searchCategoria) {
      filtered = filtered.filter((producto) =>
        producto.categoria.nombre_categoria
          .toLowerCase()
          .includes(this.searchCategoria.toLowerCase())
      );
    }
    if (this.searchNombreProducto) {
      filtered = filtered.filter((producto) =>
        producto.nombre_producto
          .toLowerCase()
          .includes(this.searchNombreProducto.toLowerCase())
      );
    }
    // Filtrar por código de producto
    if (this.searchCodigoProducto) {
      filtered = filtered.filter((producto) =>
        producto.codigo_producto
          .toLowerCase()
          .includes(this.searchCodigoProducto.toLowerCase())
      );
    }

    return filtered.slice(
      (this.page - 1) * this.pageSize,
      this.page * this.pageSize
    );
  }
  nextPage() {
    this.page++;
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
    }
  }

  openModal(imageUrl: string) {
    this.imageToShow = imageUrl;
    this.modalVisible = true;
  }
  closeModal() {
    this.modalVisible = false;
  }


  numeroTelefono: string = ''; // Agrega esta propiedad en tu clase

  generarMensaje(): string {
    let mensaje = '📝 *Detalles de la Venta:* 🗒\n\n';
    
    this.detalleVenta.forEach(item => {
      mensaje += `🔷 Producto: ${item.producto.nombre_producto}\n`;
      mensaje += `🔷 Cantidad: ${item.cantidad}\n`;
      mensaje += `🔷 Precio Unitario: Bs ${item.precio.toFixed(2)}\n`; // Formatear el precio
      mensaje += `🔷 Subtotal: Bs ${item.subtotal.toFixed(2)}\n\n`; // Formatear el subtotal
    });

    mensaje += `💵 *Total:* Bs ${this.totalVenta.toFixed(2)}\n`; // Formatear el total
    mensaje += `\n✅ ¡Gracias por tu compra! 😊`;

    return mensaje;
  }
  enviarPorWhatsApp() {
    if (!this.numeroTelefono) {
      alert('Por favor ingresa un número de teléfono.');
      return; 
    }
    const mensaje = this.generarMensaje();
    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/${this.numeroTelefono}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  }
}
