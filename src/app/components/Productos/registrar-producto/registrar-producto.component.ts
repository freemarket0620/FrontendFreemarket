import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Producto, Categoria } from './../../../Models/models';
import { Component, EventEmitter, Output } from '@angular/core';
import { ServicesService } from '../../../Services/services.service';
import { CommonModule } from '@angular/common';
import { OkComponent } from '../../Mensajes/ok/ok.component';
import { ErrorComponent } from '../../Mensajes/error/error.component';

@Component({
  selector: 'app-registrar-producto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    OkComponent,
    ErrorComponent,
  ],
  templateUrl: './registrar-producto.component.html',
  styleUrl: './registrar-producto.component.css',
})
export class RegistrarProductoComponent {
  productoForm: FormGroup;
  categoria: Categoria[] = [];

  imagenPreview: string | ArrayBuffer | null = null; // Variable para almacenar la vista previa de la imagen seleccionada
  isFileInvalid: boolean = false;
  errorMensaje: string | null = null; // Mensaje de error

  mensajeModal: string = ''; // Mensaje para el modal
  errorModal: string = '';

  @Output() listarProductos = new EventEmitter<void>();
  constructor(
    private fb: FormBuilder,
    private productosService: ServicesService
  ) {
    this.productoForm = fb.group({
      nombre_producto: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio_compra: ['', [Validators.required, Validators.min(0)]],
      precio_unitario: ['', [Validators.required, Validators.min(0)]],
      precio_mayor: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      codigo_producto: ['', Validators.required],
      categoria: ['', Validators.required],
      imagen_productos: [''],
    });
  }
  ngOnInit(): void {
    this.loadCategorias();
  }
  loadCategorias() {
    this.productosService.getCategorias().subscribe((data) => {
      this.categoria = data;
    });
  }
  registrarProductos() {
    if (this.productoForm.valid) {
      const formData = new FormData();
      formData.append(
        'nombre_producto',
        this.productoForm.get('nombre_producto')?.value
      );
      formData.append(
        'descripcion',
        this.productoForm.get('descripcion')?.value
      );
      formData.append(
        'precio_compra',
        this.productoForm.get('precio_compra')?.value
      );
      formData.append(
        'precio_unitario',
        this.productoForm.get('precio_unitario')?.value
      );
      formData.append(
        'precio_mayor',
        this.productoForm.get('precio_mayor')?.value
      );

      formData.append('stock', this.productoForm.get('stock')?.value);
      formData.append(
        'codigo_producto',
        this.productoForm.get('codigo_producto')?.value
      );

      formData.append('categoria', this.productoForm.get('categoria')?.value);
      formData.append(
        'imagen_productos',
        this.productoForm.get('imagen_productos')?.value
      );

      this.productosService
        .crearProducto(formData as unknown as Producto)
        .subscribe(
          (response) => {
            this.mensajeModal = 'Producto registrado con éxito';
            this.productoForm.reset(); // Restablece el formulario después del éxito
            this.imagenPreview = null; // Limpia la vista previa de la imagen
          },
          (error) => {
            this.errorModal = 'Error al registrar el producto';
          }
        );
    }
  }
  manejarOk() {
    this.mensajeModal = '';
    this.listarProductos.emit();
  }
  manejarError() {
    this.errorModal = '';
  }

  onFileChange(event: any): void {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.files && inputElement.files.length > 0) {
      const inputElement = event.target as HTMLInputElement;

      // Verificar si files no es null y tiene al menos un archivo
      if (inputElement.files && inputElement.files.length > 0) {
        const file = inputElement.files[0];
        const fileName = file.name;

        // Validar la extensión del archivo
        const validExtensions = ['image/png', 'image/jpeg'];
        if (!validExtensions.includes(file.type)) {
          this.errorMensaje =
            'Formato de archivo incorrecto. Solo se permiten PNG y JPG.'; // Mensaje de error
          this.isFileInvalid = true; // Establecer el estado de error
          inputElement.classList.add('is-invalid'); // Agregar clase de error
          inputElement.classList.remove('is-valid'); // Quitar clase de éxito
          this.imagenPreview = null; // Limpiar la vista previa
          return;
        }

        // Si es válido, actualizar el formulario y el label
        this.productoForm.patchValue({
          imagen_productos: file,
        });
        const label = inputElement.nextElementSibling as HTMLLabelElement;
        label.innerText = fileName; // Actualizar el texto del label con el nombre del archivo

        const reader = new FileReader();
        reader.onload = () => {
          this.imagenPreview = reader.result;
          inputElement.classList.add('is-valid'); // Agregar clase de éxito
          inputElement.classList.remove('is-invalid'); // Quitar clase de error
          this.errorMensaje = null; // Limpiar mensaje de error
          this.isFileInvalid = false; // Restablecer el estado de error
        };
        reader.readAsDataURL(file);
      } else {
        this.errorMensaje = 'Por favor, selecciona un archivo.'; // Mensaje de error si no hay archivo
        this.isFileInvalid = true; // Establecer el estado de error
        inputElement.classList.add('is-invalid'); // Agregar clase de error
        inputElement.classList.remove('is-valid'); // Quitar clase de éxito
      }
    }
  }
}
