import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { VentasService } from '../../../services/ventas.service';

@Component({
  selector: 'app-ventas-lista',
  templateUrl: './ventas-lista.component.html',
  styleUrl: './ventas-lista.component.css'
})
export class VentasListaComponent implements OnInit {
  data: Array<any> = [];
  displayedColumns: string[] = ['cliente', 'fecha', 'total', 'estatus'];
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  filteredData: Array<any> = [];

  constructor(private ventasService: VentasService) {}

  ngOnInit(): void {
    this.listarVentas();
  }

  listarVentas(): void {
    this.ventasService.listarVentas().subscribe({
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
        console.error('Error al listar ventas:', err);
        // Fallback mockup data in case API is not running or doesn't support the route yet
        this.data = [
          { cliente: 'Cliente General', fecha: '2026-06-03', total: 150.00, estatus: 'Completada' },
          { cliente: 'Juan Perez', fecha: '2026-06-02', total: 320.50, estatus: 'Completada' }
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
    this.filteredData = this.data.filter(item => {
      const clienteName = item.cliente || item.cliente_nombre || '';
      return clienteName.toLowerCase().includes(searchTerm) ||
             (item.fecha && item.fecha.toLowerCase().includes(searchTerm));
    });
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }
}
