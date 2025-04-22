import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library'; // Importa BarcodeFormat
import { BrowserMultiFormatReader } from '@zxing/browser'; // Importa BrowserMultiFormatReader

@Component({
  selector: 'app-ej-barra',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule],
  templateUrl: './ej-barra.component.html',
  styleUrls: ['./ej-barra.component.css']
})
export class EjBarraComponent {
  scannedResult: string = '';
  camaraActivada: boolean = false;
  imagenSeleccionada: File | null = null;
  lectorMultiFormato = new BrowserMultiFormatReader(); // Inicializa el lector

  constructor() {}

  activarCamara() {
    this.camaraActivada = true;
  }

  onCodeResult(resultString: string) {
    this.scannedResult = resultString;
    console.log('Código escaneado (cámara):', resultString);
  }

  cargarImagen(event: any) {
    this.imagenSeleccionada = event.target.files[0];
  }

  escanearImagen() {
    if (this.imagenSeleccionada) {
      const imageUrl = URL.createObjectURL(this.imagenSeleccionada);
      this.lectorMultiFormato.decodeFromImage(imageUrl)
        .then(result => {
          this.scannedResult = result.getText();
          console.log('Código escaneado (imagen):', this.scannedResult);
          URL.revokeObjectURL(imageUrl); // Limpia la URL del objeto
        })
        .catch(error => {
          console.error('Error al escanear la imagen:', error);
          this.scannedResult = 'No se pudo leer el código de barras.';
          URL.revokeObjectURL(imageUrl); // Limpia la URL del objeto incluso en caso de error
        });
    } else {
      this.scannedResult = 'Por favor, selecciona una imagen.';
    }
  }
}