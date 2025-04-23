import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { BrowserMultiFormatReader } from '@zxing/browser';

@Component({
  selector: 'app-ej-barra',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule],
  templateUrl: './ej-barra.component.html',
  styleUrls: ['./ej-barra.component.css']
})
export class EjBarraComponent {
  @ViewChild('scanner') scanner?: ZXingScannerComponent;
  @Output() codigoEscaneado = new EventEmitter<string>(); // Evento hacia el padre
  scannedResult: string = '';
  scannedResults: string[] = []; // Arreglo para múltiples resultados
  camaraActivada: boolean = false;
  imagenSeleccionada: File | null = null;
  lectorMultiFormato = new BrowserMultiFormatReader();
  hasDevices: boolean = false;
  hasPermission: boolean = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    // Puedes agregar más formatos de código de barras si es necesario
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

      // Configuraciones adicionales para la cámara
      if (videoElement) {
        videoElement.addEventListener('loadedmetadata', () => {
          videoElement.play();
        });
      }

    } catch (error) {
      console.error('Error accessing the camera: ', error);
    }
  }
}