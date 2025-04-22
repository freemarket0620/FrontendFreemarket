import { Component, ViewChild } from '@angular/core';
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

  scannedResult: string = '';
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
  zoomValue: number = 1; // Valor de zoom inicial (el zoom podría no ser directamente controlable)

  constructor() {}

  activarCamara() {
    this.camaraActivada = true;
  }

  onCodeResult(resultString: string) {
    this.scannedResult = resultString;
    console.log('Código escaneado (cámara):', resultString);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    if (this.availableDevices.length > 0 && !this.currentDevice) {
      this.currentDevice = this.availableDevices[0];
    }
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
    console.log('Permiso de cámara:', has); // Para depuración
  }

  captureAndScan() {
    if (this.scanner) {
      if (this.scanner) {
        this.scanner.scanSuccess.subscribe((result: string) => {
          this.scannedResult = result;
          console.log('Código escaneado (captura):', this.scannedResult);
        });
      }
    }
  }

  setZoom(zoom: number): void {
    this.zoomValue = zoom;
    // La propiedad 'zoom' podría no existir directamente en el componente.
    // La manipulación del zoom a menudo se realiza a través de estilos CSS
    // aplicados al elemento de video del escáner.
    if (this.scanner && this.scanner.previewElemRef) {
      if (this.scanner.previewElemRef?.nativeElement) {
        this.scanner.previewElemRef.nativeElement.style.transform = `scale(${zoom})`;
      }
      // O podrías intentar ajustar el tamaño del video container
      // this.scanner.previewElem.style.width = `${100 * zoom}%`;
      // this.scanner.previewElem.style.height = `${100 * zoom}%`;
      // this.scanner.previewElem.style.objectFit = 'contain'; // Asegurar que la imagen se ajuste
    }
  }

  cargarImagen(event: any) {
    this.imagenSeleccionada = event.target.files[0];
  }

  escanearImagen() {
    if (this.imagenSeleccionada) {
      const imageUrl = URL.createObjectURL(this.imagenSeleccionada);
      this.lectorMultiFormato.decodeFromImageUrl(imageUrl)
        .then(result => {
          this.scannedResult = result.getText();
          console.log('Código escaneado (imagen):', this.scannedResult);
          URL.revokeObjectURL(imageUrl);
        })
        .catch(error => {
          console.error('Error al escanear la imagen:', error);
          this.scannedResult = 'No se pudo leer el código de barras.';
          URL.revokeObjectURL(imageUrl);
        });
    } else {
      this.scannedResult = 'Por favor, selecciona una imagen.';
    }
  }
}