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
        this.listarCompras();
      }

      listarCompras(): void {
        this.comprasService.listarCompras().subscribe({
          next: (res: any) => {
            if (res && res.success) {
              this.data = res.data;
            } else if (Array.isArray(res)) {
              this.data = res;
            } else {
              this.data = [];
            }
            this.filteredData = [...this.data];
            this.dataSource.data = this.filteredData;
            this.dataSource.paginator = this.paginator;
            this.totalItems = this.filteredData.length;
          },
          error: (err) => {
            console.error('Error al listar compras:', err);
            // Fallback mockup data
            this.data = [
              { proveedor: 'Proveedor Alfa', fecha: '2026-06-03', total: 1200.00, estatus: 'Completada' },
              { proveedor: 'Proveedor Beta', fecha: '2026-06-01', total: 4500.00, estatus: 'Completada' }
            ];
            this.filteredData = [...this.data];
            this.dataSource.data = this.filteredData;
            this.dataSource.paginator = this.paginator;
            this.totalItems = this.filteredData.length;
          }
        });
      }

      onSearch(event: Event): void {
        const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
        this.filteredData = this.data.filter(item => 
          item.proveedor && item.proveedor.toLowerCase().includes(searchTerm)
        );
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.totalItems = this.filteredData.length;
      }

      setEditar(comp: any){
      }

}
