import { Component, OnInit } from '@angular/core';
import { Categoria, Producto } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-listar-productos-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './listar-productos-usuario.component.html',
  styleUrls: ['./listar-productos-usuario.component.css'],
})
export class ListarProductosUsuarioComponent implements OnInit {
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  carrito: { producto: Producto; cantidad: number }[] = [];
  searchNombreProducto: string = '';
  searchCategoria: string = '';
  searchPrecio: string = '';
  searchCodigoProducto: string = '';
  modalVisible: boolean = false;
  imageToShow: string = '';
  page: number = 1;
  pageSize: number = 6;
  totalVenta: number = 0;
  cantidadPorProducto: { [key: number]: number } = {};

  // Definición de categoriasExcluidas como propiedad de la clase
  private categoriasExcluidas = ['targetas entel tigo viva'];
  constructor(
    private productoService: ServicesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getProductos();
    this.getCategorias();
  }

  getProductos() {
    this.productoService.getProductos().subscribe((data) => {
      this.productos = data.filter(
        (producto) =>
          !this.categoriasExcluidas.includes(
            producto.categoria.nombre_categoria.trim().toLowerCase()
          )
      );
    });
  }
  getCategorias() {
    this.productoService.getCategorias().subscribe((data) => {
      this.categorias = data.filter(
        (categoria) =>
          !this.categoriasExcluidas.includes(
            categoria.nombre_categoria.trim().toLowerCase()
          )
      );
    });
  }

  agregarAlCarrito(producto: Producto, cantidad: number) {
    if (cantidad <= 0 || cantidad > producto.stock) {
      alert('Cantidad inválida. No puede ser mayor al stock disponible.');
      return;
    }

    const existingItem = this.carrito.find(
      (item) => item.producto.id === producto.id
    );

    if (existingItem) {
      existingItem.cantidad = cantidad; // Actualiza la cantidad en el carrito
    } else {
      this.carrito.push({ producto, cantidad });
    }

    this.actualizarTotalVenta();
  }

  actualizarCantidad(producto: Producto, cantidad: number) {
    const existingItem = this.carrito.find(
      (item) => item.producto.id === producto.id
    );
    if (existingItem) {
      if (cantidad <= 0 || cantidad > producto.stock) {
        alert('Cantidad inválida. No puede ser mayor al stock disponible.');
        return;
      }
      existingItem.cantidad = cantidad; // Actualiza la cantidad en el carrito
      this.actualizarTotalVenta(); // Actualiza el total
    }
  }

  actualizarTotalVenta() {
    this.totalVenta = this.carrito.reduce(
      (acc, item) => acc + item.producto.precio_unitario * item.cantidad,
      0
    );
  }

  eliminarProducto(producto: Producto) {
    this.carrito = this.carrito.filter(
      (item) => item.producto.id !== producto.id
    );
    this.actualizarTotalVenta();
  }

  filteredProductos(): Producto[] {
    let filtered = this.productos;

    // Filtrar por nombre de producto
    if (this.searchNombreProducto) {
      filtered = filtered.filter((producto) =>
        producto.nombre_producto
          .toLowerCase()
          .includes(this.searchNombreProducto.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (this.searchCategoria) {
      filtered = filtered.filter((producto) =>
        producto.categoria.nombre_categoria
          .toLowerCase()
          .includes(this.searchCategoria.toLowerCase())
      );
    }

    // Filtrar por precio
    if (this.searchPrecio) {
      filtered = filtered.filter((producto) =>
        producto.precio_unitario.toString().includes(this.searchPrecio)
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

  generarPDF(accion: string) {
    const data = document.getElementById('detalles-venta');

    if (data) {
      const actionColumns = data.querySelectorAll('.accion');
      const pdfButtons = document.querySelectorAll(
        '#btn-generar-pdf, #btn-ver-pdf, #btn-whatsapp'
      ); // Selecciona ambos botones

      // Ocultar columnas de acción y botones
      actionColumns.forEach(
        (col) => ((col as HTMLElement).style.display = 'none')
      );
      pdfButtons.forEach(
        (btn) => ((btn as HTMLElement).style.display = 'none')
      ); // Oculta ambos botones

      // Generar el PDF
      html2canvas(data, { useCORS: true, scale: 2 })
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png'); // Convertir a base64
          const pdf = new jsPDF('p', 'mm', 'a4'); // Crear un nuevo PDF
          const imgWidth = 190; // Ancho de la imagen en el PDF
          const pageHeight = pdf.internal.pageSize.height;
          const imgHeight = (canvas.height * imgWidth) / canvas.width; // Calcular altura proporcional
          let heightLeft = imgHeight;
          let position = 10; // Margen superior

          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight); // Añadir imagen al PDF
          heightLeft -= pageHeight;

          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage(); // Añadir una nueva página
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          // Restaurar la visibilidad de las columnas de acción y botones
          actionColumns.forEach(
            (col) => ((col as HTMLElement).style.display = '')
          );
          pdfButtons.forEach(
            (btn) => ((btn as HTMLElement).style.display = '')
          ); // Restaurar ambos botones

          // Realizar la acción (descargar o ver PDF)
          if (accion === 'descargar') {
            pdf.save('detalles_venta.pdf'); // Descargar PDF
          } else if (accion === 'ver') {
            const pdfBlob = pdf.output('blob'); // Crear Blob del PDF
            const pdfUrl = URL.createObjectURL(pdfBlob); // Crear URL para el Blob
            window.open(pdfUrl); // Abrir el PDF en una nueva pestaña
          }
        })
        .catch((error) => {
          console.error('Error al generar el PDF:', error);
          alert('Ocurrió un error al generar el PDF.');
        })
        .catch((error) => {
          console.error('Error al generar el PDF:', error);
          alert('Ocurrió un error al generar el PDF.');
        });
    } else {
      alert('No se encontró el elemento "detalles-venta".');
    }
  }

  clearQuantities() {
    this.cantidadPorProducto = {};
    this.searchCategoria = '';
    this.searchNombreProducto = '';
    this.searchCodigoProducto = '';
    this.searchPrecio = '';
  }
  navigateToHome(): void {
    this.router.navigate(['/index']); // Cambia la ruta según tu configuración
  }
}
