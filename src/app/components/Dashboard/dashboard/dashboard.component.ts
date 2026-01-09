import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxChartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  
})
export class DashboardComponent {
  
  // 🔹 Colección de imágenes (solo rutas)
  images = [
    { src: 'https://res.cloudinary.com/dz45dhxii/image/upload/v1767918463/BCP_rchxxv.jpg', category: 'bancos', alt: 'BCP' },
    { src: 'https://res.cloudinary.com/dz45dhxii/image/upload/v1767918463/CUENTA_UNION_1_svdgdo.jpg', category: 'bancos', alt: 'Cuenta Unión 0' },
    { src: 'https://res.cloudinary.com/dz45dhxii/image/upload/v1767918464/CUENTA_UNION_0_kih6zp.jpg', category: 'bancos', alt: 'Cuenta Unión 1' },
    { src: 'https://res.cloudinary.com/dz45dhxii/image/upload/v1767918464/YAPE_shmdtn.jpg', category: 'bancos', alt: 'Yape' },
    { src: 'https://res.cloudinary.com/dz45dhxii/image/upload/v1767919557/WhatsApp_Image_2026-01-08_at_20.30.31_nddphn.jpg', category: 'bancos', alt: 'Yape' },
    { src: 'https://res.cloudinary.com/dz45dhxii/image/upload/v1767919783/yasta_g63rgq.jpg', category: 'bancos', alt: 'Yape' },


  ];

  selectedCategory = '';
  filteredImages = [...this.images];

  currentIndex = 0;
  showModal = false;

  // 🔹 Filtro dinámico
  filterImages() {
    this.filteredImages = this.selectedCategory
      ? this.images.filter(img => img.category === this.selectedCategory)
      : [...this.images];

    this.currentIndex = 0;
  }

  // 🔹 Modal
  openModal(index: number) {
    this.currentIndex = index;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  prevImage() {
    this.currentIndex =
      (this.currentIndex - 1 + this.filteredImages.length) %
      this.filteredImages.length;
  }

  nextImage() {
    this.currentIndex =
      (this.currentIndex + 1) %
      this.filteredImages.length;
  }
}