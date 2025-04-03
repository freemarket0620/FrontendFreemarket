import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Producto, Categoria } from '../../../Models/models';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OkComponent, ErrorComponent],
  templateUrl: './editar-producto.component.html',
  styleUrls: ['./editar-producto.component.css'],
})
export class EditarProductoComponent implements OnInit {
  producto!: Producto;
  categorias: Categoria[] = [];
  form!: FormGroup;
  mensajeModal: string = '';
  errorModal: string = '';
  imagenPreview: string | ArrayBuffer | null = null;
  imagenFile: File | null = null;

  @Input() productoId: number | null = null;
  @Output() listarProductoEditado = new EventEmitter<void>();

  constructor(private productosService: ServicesService) {}

  ngOnInit(): void {
    if (this.productoId !== null) {
      this.loadProductoData(this.productoId);
      this.loadCategorias();
    }
  }

  loadProductoData(id: number) {
    this.productosService.getProductoById(id).subscribe({
      next: (data) => {
        this.producto = data;
        this.initializeForm();
        // Asegurar que la URL de la imagen sea correcta
        this.imagenPreview = this.fixImageUrl(this.producto.imagen_productos);
      },
      error: (err) => {
        console.error('Error cargando producto:', err);
      },
    });
  }

  fixImageUrl(url: string): string {
    if (!url) return '';
    // Corregir URLs mal formadas
    if (url.includes('image/upload/http://')) {
      return url.replace('image/upload/http://', 'http://');
    }
    if (url.includes('image/upload/https://')) {
      return url.replace('image/upload/https://', 'https://');
    }
    return url;
  }

  loadCategorias() {
    this.productosService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
      },
    });
  }

  initializeForm() {
    this.form = new FormGroup({
      nombre_producto: new FormControl(
        this.producto.nombre_producto,
        Validators.required
      ),
      descripcion: new FormControl(this.producto.descripcion),
      precio_compra: new FormControl(this.producto.precio_compra, [
        Validators.required,
        Validators.min(0),
      ]),
      precio_unitario: new FormControl(this.producto.precio_unitario, [
        Validators.required,
        Validators.min(0),
      ]),
      precio_mayor: new FormControl(this.producto.precio_mayor, [
        Validators.required,
        Validators.min(0),
      ]),
      stock: new FormControl(this.producto.stock, [
        Validators.required,
        Validators.min(0),
      ]),
      codigo_producto: new FormControl(
        this.producto.codigo_producto,
        Validators.required
      ),
      categoria: new FormControl(
        this.producto.categoria.id,
        Validators.required
      ),
      imagen_productos: new FormControl(null),
    });
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imagenFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result;
      };
      reader.readAsDataURL(this.imagenFile);
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      const formData = new FormData();

      // Agregar todos los campos del formulario
      formData.append('nombre_producto', this.form.value.nombre_producto);
      formData.append('descripcion', this.form.value.descripcion || '');
      formData.append(
        'precio_compra',
        this.form.value.precio_compra.toString()
      );
      formData.append(
        'precio_unitario',
        this.form.value.precio_unitario.toString()
      );
      formData.append('precio_mayor', this.form.value.precio_mayor.toString());
      formData.append('stock', this.form.value.stock.toString());
      formData.append('codigo_producto', this.form.value.codigo_producto);
      formData.append('categoria', this.form.value.categoria);

      // Agregar la imagen solo si se seleccionó una nueva
      if (this.imagenFile) {
        formData.append('imagen_productos', this.imagenFile);
      }

      this.productosService
        .actualizarProducto(this.producto.id, formData)
        .subscribe({
          next: () => {
            this.mensajeModal = 'Producto actualizado con éxito';
          },
          error: (err) => {
            console.error('Error actualizando producto:', err);
            this.errorModal = 'Error al actualizar el producto';
          },
        });
    }
  }

  manejarOk() {
    this.mensajeModal = '';
    this.listarProductoEditado.emit();
  }

  manejarError() {
    this.errorModal = '';
  }
}
