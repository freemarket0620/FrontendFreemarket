import { Component, EventEmitter, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ServicesService } from '../../../Services/services.service';
import { Usuario } from '../../../Models/models';
import { CommonModule } from '@angular/common';
import { OkComponent } from "../../Mensajes/ok/ok.component";
import { ErrorComponent } from "../../Mensajes/error/error.component";

@Component({
  selector: 'app-registrar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, OkComponent, ErrorComponent],
  templateUrl: './registrar-usuario.component.html',
  styleUrl: './registrar-usuario.component.css',
})
export class RegistrarUsuarioComponent {
  usuarioForm: FormGroup; // Formulario reactivo para registrar un usuario

  mensajeNombre: string = '';
  exitoNombre: boolean = false;

  mensajeApellido: string = '';
  exitoApellido: boolean = false;

  mensajeFechaNacimiento: string = '';
  exitoFechaNacimiento: boolean = false;

  mensajeTelefono: string = '';
  exitoTelefono: boolean = false;

  mensajeCorreo: string = '';
  exitoCorreo: boolean = false;

  mensajePassword: string = '';
  exitoContrasenia: boolean = false;
  isPasswordVisible = false;

  mensajeCI: string = '';
  exitoCI: boolean = false;

  mensajeDepaCI: string = '';
  exitoDepaCI: boolean = false;

  mensajeImagen: string = '';
  errorMensaje: string | null = null; // Mensaje de error
  isFileInvalid: boolean = false;
  imagenPreview: string | ArrayBuffer | null = null; // Variable para almacenar la vista previa de la imagen seleccionada

  mensajeModal: string = ''; // Mensaje para el modal
  errorModal: string = '';

  @Output() listarUsuario = new EventEmitter<void>();

  constructor(private fb: FormBuilder, private userService: ServicesService) {
    this.usuarioForm = this.fb.group({
      nombre_usuario: ['', Validators.required],
      apellido: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      telefono: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      ci: ['', Validators.required],
      ci_departamento: ['', Validators.required],
      imagen_url: [''],
    });
  }
  // Método para registrar un nuevo usuario
  async registrarUsuario() {
    const fechaValida = this.validarFechaNacimiento();
    const nombreValido = this.validarNombre();
    const apellidoValido = this.validarApellido();
    const telefonoValido = this.validarTelefono();
    const correoValido = await this.validarCorreo();
    const civalido = await this.validarCI(); // Cambié a await para manejar la validación asíncrona
    // Validar el campo de contraseña
    const password = this.usuarioForm.get('password')?.value;
    if (!password) {
      this.mensajePassword = 'El campo de contraseña es obligatorio'; // Mensaje de error
      this.exitoContrasenia = false; // Indica que hay un error
      this.usuarioForm.get('password')?.setErrors({ required: true }); // Establecer error de requerido
      return; // Detener la ejecución si la contraseña está vacía
    }
    // Verificar si alguna validación falló
    if (
      !fechaValida ||
      !nombreValido ||
      !apellidoValido ||
      !telefonoValido ||
      !correoValido ||
      !civalido
    ) {
      this.errorModal = 'Error: Al registrar Usuario.';
      return;
    }

    if (this.usuarioForm.valid) {
      const formData = this.buildFormData();
      this.userService
        .registrarUsuario(formData as unknown as Usuario)
        .subscribe(
          () => {
            this.mensajeModal = 'Usuario registrado con éxito';
            this.usuarioForm.reset();
            this.imagenPreview = null;
          },
          () => {
            this.errorModal = 'Error al registrar el usuario';
          }
        );
    } else {
      this.errorModal = 'Formulario no válido';
    }
  }
  // Método privado para construir el FormData a partir de los controles del formulario
  private buildFormData(): FormData {
    const formData = new FormData();
    Object.keys(this.usuarioForm.controls).forEach((key) => {
      formData.append(key, this.usuarioForm.get(key)?.value);
    });
    return formData;
  }
  manejarOk() {
    this.mensajeModal = '';
    this.listarUsuario.emit();
  }
  manejarError() {
    this.errorModal = '';
  }
  // Método para validar el nombre
  validarNombre(event: FocusEvent | KeyboardEvent | null = null): boolean {
    let inputElement: HTMLInputElement | null = null;

    // Obtener el elemento si se proporcionó un evento, de lo contrario buscar el elemento directamente
    if (event) {
      inputElement = event.target as HTMLInputElement;
    } else {
      inputElement = document.getElementById(
        'nombre_usuario'
      ) as HTMLInputElement;
    }

    const nombre = inputElement.value.trim();

    // Validar si el campo está vacío
    if (event instanceof FocusEvent && !nombre) {
      this.mensajeNombre = 'Ingresa su nombre, por favor'; // Mensaje de error
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
      this.exitoNombre = false; // Indica que hay un error
      return false;
    }

    // Validar si el nombre contiene números
    if (event instanceof KeyboardEvent) {
      const inputChar = String.fromCharCode(event.keyCode);
      if (!/^[a-zA-Z ]$/.test(inputChar)) {
        event.preventDefault(); // Evitar la entrada de caracteres no válidos
        this.mensajeNombre = 'No se puede ingresar datos numéricos'; // Mensaje de error
        inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
        this.exitoNombre = false; // Indica que hay un error
        return false;
      }
    }

    // Si el nombre es válido
    if (nombre) {
      this.mensajeNombre = 'Datos correctos'; // Mensaje de éxito
      this.exitoNombre = true; // Indica que el nombre es correcto
      inputElement.classList.remove('is-invalid'); // Quitar clase de error
      inputElement.classList.add('is-valid'); // Clase de Bootstrap para marcar éxito
      setTimeout(() => {
        this.mensajeNombre = ''; // Limpiar mensaje después de 2 segundos
      }, 2000);
    } else {
      // Mensaje de error si el campo está vacío
      this.mensajeNombre = 'Ingresa su nombre, por favor'; // Mensaje de error
      this.exitoNombre = false; // Indica que hay un error
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
    }

    return true; // El nombre es válido
  }
  // Método para validar el Apellido
  validarApellido(event: FocusEvent | KeyboardEvent | null = null): boolean {
    let inputElementApellido: HTMLInputElement | null = null;

    // Obtener el elemento si se proporcionó un evento, de lo contrario buscar el elemento directamente
    if (event) {
      inputElementApellido = event.target as HTMLInputElement;
    } else {
      inputElementApellido = document.getElementById(
        'apellido'
      ) as HTMLInputElement;
    }

    const apellido = inputElementApellido.value.trim();

    // Validar si el campo está vacío al perder el enfoque
    if (event instanceof FocusEvent && !apellido) {
      this.mensajeApellido = 'Ingresa su apellido, por favor'; // Mensaje de error
      inputElementApellido.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
      this.exitoApellido = false; // Indica que hay un error
      return false;
    }

    // Validar si el apellido contiene números (evento de teclado)
    if (event instanceof KeyboardEvent) {
      const inputChar = String.fromCharCode(event.keyCode);
      if (!/^[a-zA-Z ]$/.test(inputChar)) {
        event.preventDefault(); // Evitar la entrada de caracteres no válidos
        this.mensajeApellido = 'No se puede ingresar datos numéricos'; // Mensaje de error
        inputElementApellido.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
        this.exitoApellido = false; // Indica que hay un error
        return false;
      }
    }

    // Si el apellido es válido
    if (apellido) {
      this.mensajeApellido = 'Datos correctos'; // Mensaje de éxito
      this.exitoApellido = true; // Indica que el apellido es correcto
      inputElementApellido.classList.remove('is-invalid'); // Quitar clase de error
      inputElementApellido.classList.add('is-valid'); // Clase de Bootstrap para marcar éxito
      setTimeout(() => {
        this.mensajeApellido = ''; // Limpiar mensaje después de 2 segundos
      }, 2000);
    } else {
      // Mensaje de error si el campo está vacío
      this.mensajeApellido = 'Ingresa su nombre, por favor'; // Mensaje de error
      this.exitoApellido = false; // Indica que hay un error
      inputElementApellido.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
    }

    return true; // El apellido es válido
  }

  // Método para validar la fecha de nacimiento
  validarFechaNacimiento(
    event: FocusEvent | KeyboardEvent | null = null
  ): boolean {
    let inputElement: HTMLInputElement | null = null;

    // Obtener el elemento si se proporcionó un evento, de lo contrario buscar el elemento directamente
    if (event) {
      inputElement = event.target as HTMLInputElement;
    } else {
      inputElement = document.getElementById(
        'fecha_nacimiento'
      ) as HTMLInputElement;
    }

    const fechaNacimiento = new Date(inputElement.value);
    const hoy = new Date();

    // Validar si el campo está vacío
    if (!inputElement.value) {
      this.mensajeFechaNacimiento = 'El campo es obligatorio'; // Mensaje de error
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
      inputElement.classList.remove('is-valid'); // Asegurarse de quitar la clase de éxito si existe
      return false;
    }

    // Calcular edad exacta
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    const dia = hoy.getDate() - fechaNacimiento.getDate();

    // Ajustar la edad si el mes o día actual es menor que el de la fecha de nacimiento
    if (mes < 0 || (mes === 0 && dia < 0)) {
      edad--;
    }

    // Validar si el usuario es mayor de 18 años
    if (edad < 18) {
      this.mensajeFechaNacimiento =
        'Debe ser mayor a 18 años. Intente de nuevo'; // Mensaje de error
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
      inputElement.classList.remove('is-valid'); // Asegurarse de quitar la clase de éxito si existe
      return false;
    } else {
      // Si todo es válido
      this.mensajeFechaNacimiento = 'Datos Correctos'; // Mensaje de éxito
      this.exitoFechaNacimiento = true; // Indicar que la fecha es correcta
      inputElement.classList.remove('is-invalid'); // Quitar la clase de error si existe
      inputElement.classList.add('is-valid'); // Clase de Bootstrap para marcar éxito

      // Limpiar el mensaje después de 2 segundos
      setTimeout(() => {
        this.mensajeFechaNacimiento = '';
      }, 2000);

      return true;
    }
  }
  // Metodo para validar el telefono
  validarTelefono(event: FocusEvent | KeyboardEvent | null = null): boolean {
    let inputElement: HTMLInputElement | null = null;

    // Obtener el elemento si se proporcionó un evento, de lo contrario buscar el elemento directamente
    if (event) {
      inputElement = event.target as HTMLInputElement;
    } else {
      inputElement = document.getElementById('telefono') as HTMLInputElement;
    }

    const telefono = inputElement.value.trim();
    const inputChar =
      event instanceof KeyboardEvent
        ? String.fromCharCode(event.keyCode)
        : null;

    // Validar si el campo está vacío al perder el enfoque
    if (event instanceof FocusEvent && !telefono) {
      this.mensajeTelefono = 'El campo no puede estar vacío...';
      inputElement.classList.add('is-invalid');
      inputElement.classList.remove('is-valid');
      this.exitoTelefono = false;
      return false;
    }

    // Validar si el carácter ingresado es un número y evitar caracteres no numéricos
    if (
      event instanceof KeyboardEvent &&
      inputChar &&
      !/^[0-9]$/.test(inputChar)
    ) {
      event.preventDefault();
      this.mensajeTelefono = 'Solo se permiten números';
      inputElement.classList.add('is-invalid');
      this.exitoTelefono = false;
      return false;
    }

    // Limitar a 8 dígitos en tiempo real
    if (event instanceof KeyboardEvent && telefono.length >= 8) {
      event.preventDefault();
      this.mensajeTelefono = 'El número no puede tener más de 8 dígitos';
      inputElement.classList.add('is-invalid');
      this.exitoTelefono = false;
      return false;
    }

    // Validar que el primer dígito sea 6 o 7
    if (telefono.length === 0 && inputChar && !/^[67]$/.test(inputChar)) {
      event?.preventDefault();
      this.mensajeTelefono = 'El primer dígito debe ser 6 o 7';
      inputElement.classList.add('is-invalid');
      this.exitoTelefono = false;
      return false;
    }

    // Validar que el número tenga exactamente 8 dígitos al perder el enfoque
    if (event instanceof FocusEvent && telefono.length !== 8) {
      this.mensajeTelefono = 'El número debe tener exactamente 8 dígitos';
      inputElement.classList.add('is-invalid');
      inputElement.classList.remove('is-valid');
      this.exitoTelefono = false;
      return false;
    }

    // Si tiene exactamente 8 dígitos, verificar si ya está registrado
    if (telefono.length === 8) {
      this.userService.getUsuarios().subscribe((usuarios: Usuario[]) => {
        const telefonoExistente = usuarios.some(
          (user) => user.telefono === telefono
        );

        if (telefonoExistente) {
          this.mensajeTelefono = 'El teléfono ya está registrado';
          inputElement.classList.add('is-invalid');
          inputElement.classList.remove('is-valid');
          this.exitoTelefono = false;
        } else {
          this.mensajeTelefono = 'Teléfono correcto';
          inputElement.classList.add('is-valid');
          inputElement.classList.remove('is-invalid');
          this.exitoTelefono = true;

          // Desaparecer el mensaje de éxito después de 2 segundos
          setTimeout(() => {
            this.mensajeTelefono = '';
          }, 2000);
        }
      });
    }

    return true;
  }

  // Metodo para validar el correo
  validarCorreo(
    event: KeyboardEvent | FocusEvent | null = null
  ): Promise<boolean> {
    const inputElement = event
      ? (event.target as HTMLInputElement)
      : (document.getElementById('correo') as HTMLInputElement);
    const currentEmail = inputElement.value.trim();
    const inputChar =
      event instanceof KeyboardEvent ? String.fromCharCode(event.keyCode) : '';
    const emailParaValidar = currentEmail + inputChar; // Concatenar el nuevo carácter

    return new Promise((resolve) => {
      // Validar que el campo no esté vacío (al dejar el campo)
      if (event instanceof FocusEvent && currentEmail.length === 0) {
        this.mensajeCorreo = 'El campo de correo no puede estar vacío'; // Mensaje de error
        this.exitoCorreo = false;
        inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
        resolve(false);
        return;
      }

      // Prevenir caracteres inválidos para un correo
      if (inputChar && !/^[a-zA-Z0-9@._-]$/.test(inputChar)) {
        (event as KeyboardEvent).preventDefault(); // Evitar caracteres inválidos
        this.mensajeCorreo = 'Carácter no permitido en el correo'; // Mensaje de error
        this.exitoCorreo = false;
        inputElement.classList.add('is-invalid');
        resolve(false);
        return;
      }

      // Validar el formato completo del correo
      if (
        emailParaValidar.length > 0 &&
        !this.validateEmail(emailParaValidar)
      ) {
        this.mensajeCorreo =
          'Formato de correo incorrecto o dominio no permitido'; // Mensaje de error
        this.exitoCorreo = false;
        inputElement.classList.add('is-invalid');
        resolve(false);
        return;
      }

      // Verificar si el correo está registrado en la base de datos
      if (emailParaValidar.length > 0) {
        this.userService.getUsuarios().subscribe((usuarios: Usuario[]) => {
          const correoExistente = usuarios.some(
            (user) => user.correo === emailParaValidar
          );
          if (correoExistente) {
            this.mensajeCorreo = 'El correo ya está registrado'; // Mensaje de error
            this.exitoCorreo = false;
            inputElement.classList.add('is-invalid');
            resolve(false);
          } else {
            this.mensajeCorreo = 'Correo válido'; // Mensaje de éxito
            this.exitoCorreo = true; // Indica que el correo es correcto
            inputElement.classList.remove('is-invalid'); // Quitar clase de error
            inputElement.classList.add('is-valid'); // Clase de Bootstrap para marcar éxito
            // Desaparecer el mensaje de éxito después de 2 segundos
            setTimeout(() => {
              this.mensajeCorreo = '';
            }, 2000);
            resolve(true);
          }
        });
      } else {
        // Este bloque se ejecuta si el correo está vacío
        this.mensajeCorreo = 'El campo de correo no puede estar vacío'; // Limpiar mensaje si el correo está vacío
        inputElement.classList.add('is-invalid');
        this.exitoCorreo = false;
        resolve(false);
      }
    });
  }
  // Método para validar el formato del correo electrónico y el dominio permitido
  validateEmail(correo: string): boolean {
    const re = /^[a-zA-Z0-9._-]+@(gmail\.com|hotmail\.com|outlook\.com)$/;
    return re.test(correo);
  }
  // Metodo para validar el formato del password
  validarContrasena(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const password = inputElement.value;
    // Iniciar el array de errores
    const errores: string[] = [];
    // Validar si el evento es FocusEvent y si el campo está vacío
    if (event instanceof FocusEvent && password.length === 0) {
      errores.push('El campo de contraseña no puede estar vacío');
    }
    // Validación de longitud mínima
    if (password.length < 8) {
      errores.push('Debe tener al menos 8 caracteres');
    }
    // Validación de letra mayúscula
    if (!/[A-Z]/.test(password)) {
      errores.push('Debe contener al menos una letra mayúscula');
    }
    // Validación de letra minúscula
    if (!/[a-z]/.test(password)) {
      errores.push('Debe contener al menos una letra minúscula');
    }
    // Validación de número
    if (!/\d/.test(password)) {
      errores.push('Debe contener al menos un número');
    }
    // Validación de carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errores.push('Debe contener al menos un carácter especial');
    }
    // Mostrar errores si existen
    if (errores.length > 0) {
      this.mensajePassword = errores.join(', ');
      this.exitoContrasenia = false;
      inputElement.classList.add('is-invalid'); // Clase de Bootstrap para marcar error
    } else {
      this.mensajePassword = 'Contraseña válida'; // Mensaje de éxito
      this.exitoContrasenia = true;
      inputElement.classList.remove('is-invalid'); // Eliminar clase de error
      inputElement.classList.add('is-valid'); // Clase de Bootstrap para marcar éxito
      // Desaparecer el mensaje de éxito después de 2 segundos
      setTimeout(() => {
        this.mensajePassword = '';
      }, 2000);
    }
  }
  // Método para generar una contraseña aleatoria que cumpla con las validaciones
  generarContrasenaAutomatica() {
    const longitud = 8; // Longitud mínima
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiales = '!@#$%^&*()_+[]{};:,.<>/?';
    // Almacena al menos un carácter de cada tipo requerido
    let contrasena = '';
    contrasena += mayusculas.charAt(
      Math.floor(Math.random() * mayusculas.length)
    );
    contrasena += minusculas.charAt(
      Math.floor(Math.random() * minusculas.length)
    );
    contrasena += numeros.charAt(Math.floor(Math.random() * numeros.length));
    contrasena += especiales.charAt(
      Math.floor(Math.random() * especiales.length)
    );
    // Completar la contraseña hasta la longitud mínima
    const caracteresPermitidos = mayusculas + minusculas + numeros + especiales;
    for (let i = contrasena.length; i < longitud; i++) {
      contrasena += caracteresPermitidos.charAt(
        Math.floor(Math.random() * caracteresPermitidos.length)
      );
    }
    // Mezclar los caracteres para que no sigan un patrón predecible
    contrasena = this.shuffleString(contrasena);
    // Asignar la contraseña generada al campo de formulario
    this.usuarioForm.get('password')?.setValue(contrasena);
    // Validar la contraseña generada
    this.validarContrasena(new Event('input'));
    this.mensajePassword = 'Contraseña generada automáticamente';
  }
  // Método auxiliar para mezclar los caracteres de una cadena
  shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }
  // Metodo para validar el C.I.
  async validarCI(
    event: FocusEvent | KeyboardEvent | null = null
  ): Promise<boolean> {
    let inputElement: HTMLInputElement | null = null;

    // Obtener el elemento si se proporcionó un evento, de lo contrario buscar el elemento directamente
    if (event) {
      inputElement = event.target as HTMLInputElement;
    } else {
      inputElement = document.getElementById('ci') as HTMLInputElement;
    }

    const ci = inputElement.value.trim();
    const inputChar =
      event instanceof KeyboardEvent
        ? String.fromCharCode(event.keyCode)
        : null;

    // Validar si el campo está vacío al perder el enfoque
    if (event instanceof FocusEvent && !ci) {
      this.mensajeCI = 'El campo de C.I. no puede estar vacío';
      inputElement.classList.add('is-invalid');
      this.exitoCI = false;
      return false;
    }

    // Prevenir caracteres inválidos y limitar el ingreso a 8 dígitos
    if (event instanceof KeyboardEvent) {
      if (inputChar && !/^[0-9]$/.test(inputChar)) {
        event.preventDefault();
        this.mensajeCI = 'Solo se permiten números';
        inputElement.classList.add('is-invalid');
        this.exitoCI = false;
        return false;
      } else if (ci.length >= 8) {
        event.preventDefault();
        this.mensajeCI = 'El C.I. no puede tener más de 8 dígitos';
        inputElement.classList.add('is-invalid');
        this.exitoCI = false;
        return false;
      }
    }

    // Validar longitud mínima de 7 y máxima de 8 dígitos al perder el enfoque
    if (event instanceof FocusEvent) {
      if (ci.length < 7 || ci.length > 8) {
        this.mensajeCI = 'La C.I. debe tener 7 u 8 dígitos';
        inputElement.classList.add('is-invalid');
        this.exitoCI = false;
        return false;
      }
    }

    // Validar si el C.I. ya está registrado en la base de datos
    try {
      const usuarios = await this.userService.getUsuarios().toPromise();

      if (!usuarios) {
        this.mensajeCI = 'Error al obtener la lista de usuarios';
        inputElement.classList.add('is-invalid');
        this.exitoCI = false;
        return false;
      }

      const ciExistente = usuarios.some((user) => user.ci === ci);

      if (ciExistente) {
        this.mensajeCI = 'El C.I. ya está registrado';
        inputElement.classList.add('is-invalid');
        this.exitoCI = false;
        return false;
      } else {
        this.mensajeCI = 'C.I. válida';
        this.exitoCI = true;
        inputElement.classList.remove('is-invalid');
        inputElement.classList.add('is-valid');

        setTimeout(() => {
          this.mensajeCI = '';
        }, 2000);

        return true;
      }
    } catch (error) {
      this.mensajeCI = 'Error al verificar el C.I.';
      inputElement.classList.add('is-invalid');
      this.exitoCI = false;
      return false;
    }
  }

  // Método para validar el DepartamentoCI
  onSelectChange() {
    const selectedDepartment = this.usuarioForm.get('ci_departamento')?.value;
    const validDepartments = [
      'LP',
      'CB',
      'SC',
      'BN',
      'PD',
      'TJ',
      'CH',
      'OR',
      'PT',
    ];
    if (!selectedDepartment) {
      this.mensajeDepaCI = 'Por favor, seleccione un departamento';
      this.exitoDepaCI = false; // Indica que hay un error
      // Aquí puedes agregar una clase para marcar el select como inválido
    } else if (validDepartments.includes(selectedDepartment)) {
      this.mensajeDepaCI = 'Departamento correcto'; // Mensaje de éxito
      this.exitoDepaCI = true; // Indica que la selección es correcta
      this.usuarioForm.get('ci_departamento')?.setErrors(null); // Limpiar errores
      // Aquí puedes agregar una clase para marcar el select como válido
    } else {
      this.mensajeDepaCI = 'Departamento no válido'; // Mensaje de error si no está en la lista
      this.exitoDepaCI = false; // Indica que hay un error
    }
    // Limpiar mensaje de éxito después de 2 segundos
    setTimeout(() => {
      this.mensajeDepaCI = '';
    }, 2000);
  }
  // Método para manejar la selección de archivo
  onFileChange(event: any): void {
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
      this.usuarioForm.patchValue({
        imagen_url: file,
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
