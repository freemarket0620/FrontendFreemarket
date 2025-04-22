import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner'; // Asegúrate de importar ZXingScannerModule

@Component({
  selector: 'app-ej-barra',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ZXingScannerModule], // Asegúrate de incluir ZXingScannerModule
  templateUrl: './ej-barra.component.html',
  styleUrls: ['./ej-barra.component.css'] // Corrige 'styleUrl' a 'styleUrls'
})
export class EjBarraComponent {
  scannedResult: string = '';
  camaraActivada: boolean = false; // Variable para controlar la activación de la cámara

  constructor() {}

  activarCamara() {
    this.camaraActivada = true; // Activa la cámara
  }

  onCodeResult(resultString: string) {
    this.scannedResult = resultString; // Guarda el código escaneado
    console.log('Código escaneado:', resultString); // Muestra el código en la consola
  }
}