import { Component, OnInit } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SucursalesService } from '../../../services/sucursales.service';
import { PreciosService } from '../../../services/precios.service';

@Component({
  selector: 'app-precios',
  templateUrl: './precios.component.html',
  styleUrls: ['./precios.component.css']
})
export class PreciosComponent implements OnInit {
  data: Array<any> = [];
  idSucursal: any;
  sucursales: any = null;
  originalData: any[] = []; 
  filteredData: any[] = [];

  constructor(private precioService: PreciosService,
              @Inject(PLATFORM_ID) private platformId: Object,
              private sucursalesService: SucursalesService) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.idSucursal = localStorage.getItem('idSucursal');
    }
    this.getSucursales();
    this.listarPrecios();
  }

  getSucursales(): void {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data: any) => {
        if (data.success) {
          this.sucursales = data.data;
        }
      },
      error: () => { 
        alert("Error al actualizar"); 
      },
    });
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item =>
      item.producto.toLowerCase().includes(searchTerm) || 
      (item.codigo !== null && item.codigo.toString().includes(searchTerm))
    );
  }

  guardar(): void {
    const changedData = this.data.filter((item, index) => {
      return JSON.stringify(item) !== JSON.stringify(this.originalData[index]);
    });

    this.precioService.modificarPrecio(changedData, this.idSucursal).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.listarPrecios();
        } else {
          console.log(data);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  listarPrecios(): void {
    this.precioService.listarPrecios(this.idSucursal).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.data = data.data;
          this.originalData = JSON.parse(JSON.stringify(this.data));
          this.filteredData = [...this.data];
        } else {
          console.log(data);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
