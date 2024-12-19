import { Component, ViewChild } from '@angular/core';
import { ProductosService } from '../../../services/productos.service';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SucursalesService } from '../../../services/sucursales.service';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Data } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventarios',
  templateUrl: './inventarios.component.html',
  styleUrl: './inventarios.component.css'
})
export class InventariosComponent {
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;
  displayedColumns: string[] = ['producto','codigo','cantidad','precio']; 
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

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
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }

  guardar(): void {
    const changedData = this.data.filter((item, index) => { 
      return JSON.stringify(item) !== JSON.stringify(this.originalData[index]); 
    }); 

    this.productoService.modificarInventario(changedData).subscribe({
      next: (data:any) => {
        if (data.success) {
          this.listarProductos();
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
        }else{
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => { 
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }

  listarProductos(){
    this.productoService.listarInventario().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.data=data.data;
          this.originalData = JSON.parse(JSON.stringify(this.data));
          this.filteredData = [...this.data];
          this.dataSource.data = this.filteredData;
          this.dataSource.paginator = this.paginator;
          this.totalItems = this.filteredData.length;
        }else{
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => { 
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }
}

