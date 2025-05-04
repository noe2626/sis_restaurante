import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SucursalesService } from '../../../services/sucursales.service';
import { ComprasService } from '../../../services/compras.service';
import { ProductosService } from '../../../services/productos.service';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.css'
})
export class ComprasComponent implements OnInit{
  data: Array<any> = [];
    idSucursal:any;
    sucursales: any = null;
    displayedColumns: string[] = ['proveedor','fecha','total','estatus']; 
    dataSource = new MatTableDataSource<any>([]);
    totalItems = 0;
    @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
    
  
    originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 
  
    filteredData = [...this.data];

    constructor(private sucursalesService: SucursalesService,
        private comprasService: ComprasService,
        private fb: FormBuilder,
      private productoService: ProductosService){
          
      }

      ngOnInit(): void {
        
      }

      onSearch(event: Event): void {
        const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
        this.filteredData = this.data.filter(item => 
          item.proveedor.toLowerCase().includes(searchTerm)
        );
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.totalItems = this.filteredData.length;
      }

      setEditar(comp: any){
      }

}
