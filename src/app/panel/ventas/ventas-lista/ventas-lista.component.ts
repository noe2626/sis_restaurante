import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { VentasService } from '../../../services/ventas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ventas-lista',
  templateUrl: './ventas-lista.component.html',
  styleUrl: './ventas-lista.component.css'
})
export class VentasListaComponent implements OnInit {
  data: Array<any> = [];
  displayedColumns: string[] = ['folio', 'cliente', 'fecha', 'total', 'estatus', 'detalle'];
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  filteredData: Array<any> = [];
  ventaSeleccionada: any = null;

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

  verDetalle(id: number): void {
    this.ventasService.obtenerDetalleVenta(id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.ventaSeleccionada = res.data;
          // Iniciar el modal usando bootstrap
          const modalElement = document.getElementById('detalleVentaModal');
          if (modalElement) {
            const bootstrap = (window as any).bootstrap;
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        } else {
          Swal.fire('Error', 'No se pudo obtener el detalle de la venta.', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la venta:', err);
        Swal.fire('Error', 'Hubo un error al comunicarse con el servidor.', 'error');
      }
    });
  }

  cancelarVenta(id: number): void {
    Swal.fire({
      title: '¿Está seguro de cancelar esta venta?',
      text: 'Esta acción revertirá el inventario de todos los productos y componentes de la venta. El saldo de caja no se modificará.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar venta',
      cancelButtonText: 'No, conservar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ventasService.cancelarVenta(id).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({
                icon: 'success',
                title: 'Venta Cancelada',
                text: 'La venta ha sido cancelada e inventarios revertidos con éxito.',
                showConfirmButton: false,
                timer: 1500
              });
              // Cerrar modal de detalle si estaba abierto
              const closeBtn = document.getElementById('closeDetalleVentaModalBtn');
              closeBtn?.click();
              // Recargar listado
              this.listarVentas();
            } else {
              Swal.fire('Error', res.message || 'No se pudo cancelar la venta.', 'error');
            }
          },
          error: (err) => {
            console.error('Error al cancelar la venta:', err);
            const errMsg = err.error?.message || 'Hubo un error del servidor.';
            Swal.fire('Error', errMsg, 'error');
          }
        });
      }
    });
  }
}
