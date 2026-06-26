import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ReportesService } from '../../../../services/reportes.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reporte-inventario',
  templateUrl: './reporte-inventario.component.html',
  styleUrls: []
})
export class ReporteInventarioComponent implements OnChanges {
  @Input() idSucursal!: number;
  @Input() roleId!: number;

  loading = false;
  inventarioData: any[] = [];
  inventarioSummary: any = null;
  filtroEstatus: string = 'todos';
  searchTextInventario: string = '';

  inventarioDataSource = new MatTableDataSource<any>([]);
  totalItemsInventario = 0;
  filterValuesInventario: any = { producto: '', codigo: '', sucursal: '', inventariar: '', stock_minimo: '', cantidad: '', estado: '' };

  private inventarioPaginator: MatPaginator | null = null;
  private inventarioSort: MatSort | null = null;

  @ViewChild('inventarioPaginator') set invPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.inventarioPaginator = paginator;
      this.inventarioDataSource.paginator = paginator;
    }
  }

  @ViewChild('inventarioSort') set invSort(sort: MatSort) {
    if (sort) {
      this.inventarioSort = sort;
      this.inventarioDataSource.sort = sort;
    }
  }

  constructor(private reportesService: ReportesService) {
    this.setupFilterPredicate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idSucursal']) {
      this.cargarReporte();
    }
  }

  get displayedColumnsInventario(): string[] {
    if (this.idSucursal === 0) {
      return ['producto', 'codigo', 'sucursal', 'inventariar', 'stock_minimo', 'cantidad', 'estado'];
    } else {
      return ['producto', 'codigo', 'inventariar', 'stock_minimo', 'cantidad', 'estado'];
    }
  }

  get displayedColumnsFiltersInventario(): string[] {
    if (this.idSucursal === 0) {
      return ['filter-producto', 'filter-codigo', 'filter-sucursal', 'filter-inventariar', 'filter-stock_minimo', 'filter-cantidad', 'filter-estado'];
    } else {
      return ['filter-producto', 'filter-codigo', 'filter-inventariar', 'filter-stock_minimo', 'filter-cantidad', 'filter-estado'];
    }
  }

  cargarReporte(): void {
    this.loading = true;
    const filterSucursal = this.idSucursal !== 0 ? this.idSucursal : undefined;

    this.reportesService.obtenerReporteInventario(filterSucursal).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.success) {
          this.inventarioData = response.data || [];
          this.inventarioSummary = response.summary || null;
          this.actualizarInventarioDataSource();
        } else {
          this.inventarioData = [];
          this.inventarioSummary = null;
          this.actualizarInventarioDataSource();
          Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'No se pudieron obtener los datos.' });
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error al cargar reporte de inventario:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error de Servidor',
          text: 'Ocurrió un error al cargar el inventario.'
        });
      }
    });
  }

  setupFilterPredicate(): void {
    this.inventarioDataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const productoMatch = !searchTerms.producto || (data.producto || '').toLowerCase().includes(searchTerms.producto.toLowerCase());
      const codigoMatch = !searchTerms.codigo || (data.codigo || '').toLowerCase().includes(searchTerms.codigo.toLowerCase());
      const sucursalMatch = !searchTerms.sucursal || (data.sucursal || '').toLowerCase().includes(searchTerms.sucursal.toLowerCase());
      
      let inventariableMatch = true;
      if (searchTerms.inventariar) {
        const val = searchTerms.inventariar.toLowerCase();
        const text = data.inventariar ? 'sí' : 'no';
        inventariableMatch = text.includes(val);
      }

      let stockMinimoMatch = true;
      if (searchTerms.stock_minimo) {
        if (!data.inventariar) {
          stockMinimoMatch = false;
        } else {
          stockMinimoMatch = (data.stock_minimo || 0).toString().includes(searchTerms.stock_minimo);
        }
      }

      let cantidadMatch = true;
      if (searchTerms.cantidad) {
        cantidadMatch = (data.cantidad || 0).toString().includes(searchTerms.cantidad);
      }
      
      let estadoMatch = true;
      if (searchTerms.estado) {
        const val = searchTerms.estado.toLowerCase();
        let estStr = 'saludable';
        if (data.inventariar && data.cantidad <= 0) estStr = 'agotado';
        else if (data.inventariar && data.cantidad > 0 && data.cantidad < data.stock_minimo) estStr = 'stock bajo';
        estadoMatch = estStr.includes(val);
      }

      return productoMatch && codigoMatch && sucursalMatch && inventariableMatch && stockMinimoMatch && cantidadMatch && estadoMatch;
    };
  }

  applyColumnFilter(column: string, value: string): void {
    this.filterValuesInventario[column] = value.trim().toLowerCase();
    this.inventarioDataSource.filter = JSON.stringify(this.filterValuesInventario);
    if (this.inventarioDataSource.paginator) {
      this.inventarioDataSource.paginator.firstPage();
    }
  }

  actualizarInventarioDataSource(): void {
    let result = this.inventarioData || [];

    if (this.filtroEstatus !== 'todos') {
      result = result.filter(item => {
        if (this.filtroEstatus === 'critico') {
          return item.inventariar && item.cantidad <= 0;
        } else if (this.filtroEstatus === 'bajo') {
          return item.inventariar && item.cantidad > 0 && item.cantidad < item.stock_minimo;
        } else if (this.filtroEstatus === 'ok') {
          return !item.inventariar || item.cantidad >= item.stock_minimo;
        }
        return true;
      });
    }

    if (this.searchTextInventario && this.searchTextInventario.trim()) {
      const text = this.searchTextInventario.toLowerCase().trim();
      result = result.filter(item => 
        (item.producto && item.producto.toLowerCase().includes(text)) ||
        (item.codigo && item.codigo.toLowerCase().includes(text)) ||
        (item.sucursal && item.sucursal.toLowerCase().includes(text))
      );
    }

    this.inventarioDataSource.data = result;
    this.totalItemsInventario = result.length;
  }

  cambiarFiltroEstatus(estatus: string): void {
    this.filtroEstatus = estatus;
    this.actualizarInventarioDataSource();
  }

  imprimirReporte(): void {
    window.print();
  }
}
