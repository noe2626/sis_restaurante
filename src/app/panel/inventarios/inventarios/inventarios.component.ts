import { Component, ViewChild, OnInit } from '@angular/core';
import { ProductosService } from '../../../services/productos.service';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SucursalesService } from '../../../services/sucursales.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Data } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventarios',
  templateUrl: './inventarios.component.html',
  styleUrl: './inventarios.component.css'
})
export class InventariosComponent implements OnInit {
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;
  displayedColumns: string[] = ['producto','codigo','cantidad','unidad_medida','stock_minimo','precio']; 
  displayedColumnsFilters: string[] = ['filter-producto', 'filter-codigo', 'filter-cantidad', 'filter-unidad_medida', 'filter-stock_minimo', 'filter-precio'];
  filterValues: any = { producto: '', codigo: '', cantidad: '', unidad_medida: '', stock_minimo: '', precio: '' };
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort | null = null;

  originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 

  filteredData = [...this.data];

  constructor(private productoService: ProductosService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sucursalesService: SucursalesService){

    }

  ngOnInit(): void { 
    this.idSucursal = localStorage.getItem('idSucursal');
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.sucursales=data.data
        }
      },
      error: () => { alert("Error al actualizar") },
    });
    this.listarProductos();
    this.setupFilterPredicate();
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const productoMatch = !searchTerms.producto || (data.producto || '').toLowerCase().includes(searchTerms.producto.toLowerCase());
      const codigoMatch = !searchTerms.codigo || (data.codigo || '').toLowerCase().includes(searchTerms.codigo.toLowerCase());
      
      let cantidadMatch = true;
      if (searchTerms.cantidad) {
        if (!data.inventariar) {
          cantidadMatch = 'no inventariable'.includes(searchTerms.cantidad.toLowerCase());
        } else {
          cantidadMatch = (data.cantidad || 0).toString().includes(searchTerms.cantidad);
        }
      }

      let stockMinimoMatch = true;
      if (searchTerms.stock_minimo) {
        if (!data.inventariar) {
          stockMinimoMatch = 'no inventariable'.includes(searchTerms.stock_minimo.toLowerCase());
        } else {
          stockMinimoMatch = (data.stock_minimo || 0).toString().includes(searchTerms.stock_minimo);
        }
      }

      const precioMatch = !searchTerms.precio || (data.precio || 0).toString().includes(searchTerms.precio);

      return productoMatch && codigoMatch && cantidadMatch && stockMinimoMatch && precioMatch;
    };
  }

  applyColumnFilter(column: string, value: string): void {
    this.filterValues[column] = value.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item => 
      item.producto.toLowerCase().includes(searchTerm) || (item.codigo !== null && item.codigo.toString().toLowerCase().includes(searchTerm))
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
          this.dataSource.sort = this.sort;
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

