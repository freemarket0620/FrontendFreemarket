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

  constructor() {}

  activarCamara() {
    this.camaraActivada = true;
    this.configurarCamaraAvanzada();
  }

  onCodeResult(resultString: string) {
    if (!this.scannedResults.includes(resultString)) {
      this.scannedResults.push(resultString);
    }
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
    console.log('Permiso de cámara:', has);
  }

  captureAndScan() {
    if (this.scanner) {
      this.scanner.scanSuccess.subscribe((result: string) => {
        if (!this.scannedResults.includes(result)) {
          this.scannedResults.push(result);
        }
        this.scannedResult = result;
        console.log('Código escaneado (captura):', this.scannedResult);
      });
    }
  }

  setZoom(zoom: number): void {
    this.zoomValue = zoom;
    if (this.scanner && this.scanner.previewElemRef?.nativeElement) {
      this.scanner.previewElemRef.nativeElement.style.transform = `scale(${zoom})`;
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
          if (!this.scannedResults.includes(result.getText())) {
            this.scannedResults.push(result.getText());
          }
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

  escanearDurante5Segundos() {
    this.scannedResults = []; // Limpiar resultados anteriores
    this.activarCamara();

    const sub = this.scanner?.scanSuccess.subscribe(result => {
      if (!this.scannedResults.includes(result)) {
        this.scannedResults.push(result);
      }
    });

    setTimeout(() => {
      sub?.unsubscribe();
      this.camaraActivada = false;
      console.log('Escaneo detenido después de 5 segundos');
    }, 5000);
  }

  async configurarCamaraAvanzada() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      console.log('📸 Capacidades de cámara:', capabilities);

      // ⚠️ Solo mostrar valores disponibles, sin aplicar focusMode o zoom si no existen
      if ('focusMode' in capabilities && (capabilities as any).focusMode?.includes('continuous')) {
        await videoTrack.applyConstraints({
          advanced: [{ ...(capabilities as any).focusMode && { focusMode: 'continuous' } }]
        });
      }

      if ('zoom' in capabilities) {
        const optimalZoom = (capabilities as any).zoom.max / 2;
        await videoTrack.applyConstraints({
          advanced: [{ zoom: optimalZoom } as any]
        });
      }
    } catch (error) {
      console.error('Error al configurar la cámara:', error);
    }
  }
}
