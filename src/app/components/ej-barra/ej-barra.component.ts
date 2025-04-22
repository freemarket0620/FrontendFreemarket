import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

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

  constructor() {}

  activarCamara() {
    this.camaraActivada = true; // Activa la cámara
  }

  onCodeResult(resultString: string) {
    this.scannedResult = resultString; // Guarda el código escaneado
    console.log('Código escaneado:', resultString); // Muestra el código en la consola
  }
}