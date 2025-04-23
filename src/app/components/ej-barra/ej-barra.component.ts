import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';

// Extensión de MediaTrackConstraintSet
interface MediaTrackConstraintSet {
    focusMode?: string[]; // Agrega la propiedad focusMode
    zoom?: { max: number; min: number; current: number }; // Agrega la propiedad zoom
    torch?: boolean; // Agrega la propiedad torch si la necesitas
}

@Component({
  selector: 'app-ej-barra',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule],
  templateUrl: './ej-barra.component.html',
  styleUrls: ['./ej-barra.component.css']
})
export class EjBarraComponent {
  @ViewChild('scanner') scanner?: ZXingScannerComponent;

   @Output() codigoEscaneado = new EventEmitter<string>(); // 👉 evento hacia el padre
  scannedResult: string = '';
  scannedResults: string[] = []; // ✅ arreglo para múltiples resultados
  camaraActivada: boolean = false;
  imagenSeleccionada: File | null = null;
  lectorMultiFormato = new BrowserMultiFormatReader();
  hasDevices: boolean = false;
  hasPermission: boolean = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];
  zoomValue: number = 1;
  linternaActiva: boolean = false;
  videoTrack: MediaStreamTrack | null = null;

  constructor() {}

  activarCamara() {
    this.camaraActivada = true;

    setTimeout(() => {
      this.configurarCamaraAvanzada();
    }, 500); // Esperar un poco para que se renderice el <zxing-scanner>
  }

  onCodeResult(resultString: string) {
    if (!this.scannedResults.includes(resultString)) {
      this.scannedResults.push(resultString);
    }
    this.scannedResult = resultString;
    console.log('Código escaneado (cámara):', resultString);
    this.codigoEscaneado.emit(resultString); 
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    if (this.availableDevices.length > 0 && !this.currentDevice) {
      this.currentDevice = this.availableDevices[0];
      console.log('Dispositivo actual asignado:', this.currentDevice);
    }
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
    console.log('Permiso de cámara:', has);
  }

  cargarImagen(event: any) {
    this.imagenSeleccionada = event.target.files[0];
    if (this.imagenSeleccionada) {
      this.escanearImagen(); // Llama a escanearImagen automáticamente
    }
  }

  escanearImagen() {
    if (this.imagenSeleccionada) {
      const imageUrl = URL.createObjectURL(this.imagenSeleccionada);
      this.lectorMultiFormato.decodeFromImageUrl(imageUrl)
        .then(result => {
          if (!this.scannedResults.includes(result.getText())) {
            this.scannedResults.push(result.getText());
          }
          this.scannedResult = result.getText();
          console.log('Código escaneado (imagen):', this.scannedResult);
          this.codigoEscaneado.emit(this.scannedResult); 
        })
        .catch(error => {
          console.error('Error al escanear la imagen:', error);
          this.scannedResult = 'No se pudo leer el código de barras. Asegúrate de que la imagen sea clara y contenga un código de barras válido.';
        })
        .finally(() => {
          URL.revokeObjectURL(imageUrl);
        });
    } else {
      this.scannedResult = 'Por favor, selecciona una imagen.';
    }
  }

  async configurarCamaraAvanzada() {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 }, // Ajusta la resolución
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      } else {
        console.error('No se encontró el elemento de video.');
      }

      // Additional configurations for the camera
      if (videoElement) {
        videoElement.addEventListener('loadedmetadata', () => {
          videoElement.play();
        });
      }

      // Handle errors
    } catch (error) {
      console.error('Error accessing the camera: ', error);
    }
  }
  }
  