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

  scannedResults: string[] = []; // lista de códigos escaneados
  camaraActivada: boolean = false;
  imagenSeleccionada: File | null = null;
  lectorMultiFormato = new BrowserMultiFormatReader();
  hasDevices: boolean = false;
  hasPermission: boolean = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  zoomValue: number = 1;

  formatsEnabled: BarcodeFormat[] = [
    BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13,
    BarcodeFormat.QR_CODE,
  ];

  activarCamara() {
    this.camaraActivada = true;
  }

  onCodeResult(resultString: string) {
    // Evitar duplicados
    if (!this.scannedResults.includes(resultString)) {
      this.scannedResults.push(resultString);
      console.log('Código escaneado (cámara):', resultString);
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = devices && devices.length > 0;
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
          console.log('Código escaneado (captura):', result);
        }
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
          const texto = result.getText();
          if (!this.scannedResults.includes(texto)) {
            this.scannedResults.push(texto);
          }
          console.log('Código escaneado (imagen):', texto);
          URL.revokeObjectURL(imageUrl);
        })
        .catch(error => {
          console.error('Error al escanear la imagen:', error);
          URL.revokeObjectURL(imageUrl);
        });
    }
  }

  escanearDurante5Segundos() {
    this.scannedResults = []; // limpiar resultados previos
    this.activarCamara();

    const suscripcion = this.scanner?.scanSuccess.subscribe((result: string) => {
      if (!this.scannedResults.includes(result)) {
        this.scannedResults.push(result);
      }
    });

    setTimeout(() => {
      this.camaraActivada = false;

      if (this.scannedResults.length > 0) {
        alert('✅ Se pudo escanear al menos un código.');
      } else {
        alert('⚠️ No se pudo escanear ningún código.');
      }

      suscripcion?.unsubscribe();
    }, 5000);
  }
}
