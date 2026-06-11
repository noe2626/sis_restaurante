import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SucursalesService } from '../../../services/sucursales.service';
import { ComprasService } from '../../../services/compras.service';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.css'
})
export class ComprasComponent implements OnInit{
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;
  displayedColumns: string[] = ['folio', 'folioProveedor', 'proveedor','fecha','total','estatus', 'detalle']; 
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  
  originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 
  
  filteredData = [...this.data];
  compraSeleccionada: any = null;

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
          || item.folio_proveedor && item.folio_proveedor.toLowerCase().includes(searchTerm)
          || item.folio && item.folio.toLowerCase().includes(searchTerm)
        );
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.totalItems = this.filteredData.length;
      }

  verDetalle(id: number): void {
    this.comprasService.obtenerDetalleCompra(id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.compraSeleccionada = res.data;
          // Iniciar el modal usando bootstrap
          const modalElement = document.getElementById('detalleCompraModal');
          if (modalElement) {
            const bootstrap = (window as any).bootstrap;
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        } else {
          Swal.fire('Error', 'No se pudo obtener el detalle de la compra.', 'error');
        }
      },
      error: (err) => {
        console.error('Error al obtener el detalle de la compra:', err);
        Swal.fire('Error', 'Hubo un error al comunicarse con el servidor.', 'error');
      }
    });
  }

  cancelarCompra(id: number): void {
    Swal.fire({
      title: '¿Está seguro de cancelar esta compra?',
      text: 'Esta acción restará el inventario de todos los productos ingresados en esta compra.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar compra',
      cancelButtonText: 'No, conservar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.comprasService.cancelarCompra(id).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              Swal.fire({
                icon: 'success',
                title: 'Compra Cancelada',
                text: 'La compra ha sido cancelada e inventarios revertidos con éxito.',
                showConfirmButton: false,
                timer: 1500
              });
              // Cerrar modal de detalle si estaba abierto
              const closeBtn = document.getElementById('closeDetalleCompraModalBtn');
              closeBtn?.click();
              // Recargar listado
              this.listarCompras();
            } else {
              Swal.fire('Error', res.message || 'No se pudo cancelar la compra.', 'error');
            }
          },
          error: (err) => {
            console.error('Error al cancelar la compra:', err);
            const errMsg = err.error?.message || 'Hubo un error del servidor.';
            Swal.fire('Error', errMsg, 'error');
          }
        });
      }
    });
  }

}
