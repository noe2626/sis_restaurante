import { Component } from '@angular/core';
import { ProductosService } from '../../../services/productos.service';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SucursalesService } from '../../../services/sucursales.service';

@Component({
  selector: 'app-inventarios',
  templateUrl: './inventarios.component.html',
  styleUrl: './inventarios.component.css'
})
export class InventariosComponent {
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;

  originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 

  filteredData = [...this.data];

  constructor(private productoService: ProductosService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sucursalesService: SucursalesService){

    }

  ngOnInit(): void { 
    if (isPlatformBrowser(this.platformId)) { 
      this.idSucursal = localStorage.getItem('idSucursal');
    }
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.sucursales=data.data
        }
      },
      error: () => { alert("Error al actualizar") },
    });
    this.listarProductos();
     
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item => 
      item.producto.toLowerCase().includes(searchTerm) || (item.codigo !== null && item.codigo.toString().includes(searchTerm))
    );
  }

  guardar(): void {
    const changedData = this.data.filter((item, index) => { 
      return JSON.stringify(item) !== JSON.stringify(this.originalData[index]); 
    }); 

    this.productoService.modificarInventario(changedData, this.idSucursal).subscribe({
      next: (data:any) => {
        if (data.success) {
          this.listarProductos();
        }else{
          console.log(data);
        }
      },
      error: (err) => { 
        console.log(err);
       },
    });
  }

  listarProductos(){
    this.productoService.listarInventario(this.idSucursal).subscribe({
      next: (data:any) => {
        if (data.success) {
          this.data=data.data;
          this.originalData = JSON.parse(JSON.stringify(this.data));
          this.filteredData = [...this.data];
        }else{
          console.log(data);
        }
      },
      error: (err) => { 
        console.log(err);
       },
    });
  }
}

