import { Component, ViewChild } from '@angular/core';
import { ServicesService } from '../../Services/services.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  @ViewChild('loginModal') loginModal: any;
  showPassword: boolean = false;
  correo: string = '';
  password: string = '';
  mensaje: string = '';
  error: string = '';
  isLoading: boolean = false;

  constructor(
    private servicesService: ServicesService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.isLoading = true; // Iniciar el estado de carga
    this.servicesService.login(this.correo, this.password).subscribe(
      (response) => {
        this.isLoading = false; // Detener el estado de carga
        const token = response.access_token;
        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('roles', JSON.stringify(response.roles)); // Almacenar roles
          localStorage.setItem('permisos', JSON.stringify(response.permisos)); // Almacenar permisos
          this.mensaje = 'Inicio de sesión exitoso. ¡Bienvenido!';
          this.error = ''; // Limpiar errores anteriores // Mostrar alerta de éxito
        }
      },
      (err: HttpErrorResponse) => {
        this.isLoading = false; // Detener el estado de carga
        // Manejo de errores
        if (err.status === 403) {
          // Si el error es 403, significa que el usuario no tiene roles o permisos
          this.error =
            'No tienes roles ni permisos asignados. Comunícate con el administrador.';
        } else if (err.status === 404) {
          // Usuario no encontrado
          this.error = 'Usuario no encontrado. Verifica tus credenciales.';
        } else {
          // Otros errores
          this.error =
            err.error?.error ||
            'Error en el servidor. Intenta nuevamente más tarde.';
        }

        this.mensaje = ''; // Limpiar mensaje en caso de error
      }
    );
  }
  closeMessage(): void {
    if (this.mensaje) {
      this.router.navigate(['/panel-control']); // Redirigir al panel de control
    }
    this.mensaje = '';
    this.error = '';
  }
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFormValid(): boolean {
    return (
      this.isEmailValid(this.correo) && this.isPasswordValid(this.password)
    );
  }

  isEmailValid(email: string): boolean {
    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|hotmail\.com)$/;
    return emailPattern.test(email);
  }

  isPasswordValid(password: string): boolean {
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;
    return passwordPattern.test(password);
  }
  navigateToHome(): void {
    this.router.navigate(['/index']); // Cambia la ruta según tu configuración
  }
}
