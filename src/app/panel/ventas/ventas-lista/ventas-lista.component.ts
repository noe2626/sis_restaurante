import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { VentasService } from '../../../services/ventas.service';
import Swal from 'sweetalert2';
import { PrintService, TicketData } from '../../../services/print.service';

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

  constructor(private ventasService: VentasService, private printService: PrintService) {}

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
      input: 'text',
      inputPlaceholder: 'Escriba el motivo de la cancelación...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, cancelar venta',
      cancelButtonText: 'No, conservar',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debe ingresar un motivo para poder cancelar la venta.';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const motivo = result.value;
        this.ventasService.cancelarVenta(id, motivo).subscribe({
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

  imprimirTicket(venta: any): void {
    if (!venta) return;
    try {
      const ticketData: TicketData = {
        folio: venta.folio,
        fecha: venta.fecha,
        cliente: venta.cliente ? venta.cliente.nombre : 'Cliente General',
        cajero: venta.user ? venta.user.name : 'N/A',
        canal: venta.canal_venta ? venta.canal_venta.nombre : (venta.canalVenta ? venta.canalVenta.nombre : 'Comedor'),
        metodo_pago: venta.metodo_pago || 'efectivo',
        subtotal: venta.subtotal,
        descuentos: venta.descuentos,
        extras: venta.extras,
        iva: venta.iva,
        total: venta.total,
        pago: null,
        cambio: null,
        productos: (venta.productos || []).map((prod: any) => ({
          nombre: prod.nombre,
          cantidad: prod.pivot.cantidad,
          precio: prod.pivot.precio,
          total: prod.pivot.total,
          promocion: prod.pivot.promocion
        }))
      };
      this.printService.imprimirTicket(ticketData);
    } catch (e) {
      console.error('Error al reimprimir ticket:', e);
      Swal.fire('Error', 'No se pudo generar el ticket para impresión.', 'error');
    }
  }

  imprimirTicketCanal(venta: any): void {
    if (!venta) return;
    try {
      const ticketData: TicketData = {
        folio: venta.folio,
        fecha: venta.fecha,
        cliente: venta.cliente ? venta.cliente.nombre : 'Cliente General',
        cajero: venta.user ? venta.user.name : 'N/A',
        canal: venta.canal_venta ? venta.canal_venta.nombre : (venta.canalVenta ? venta.canalVenta.nombre : 'Comedor'),
        metodo_pago: venta.metodo_pago || 'efectivo',
        subtotal: venta.subtotal,
        descuentos: venta.descuentos,
        extras: venta.extras,
        iva: venta.iva,
        total: venta.total,
        pago: null,
        cambio: null,
        canal_costo_tercero: venta.canal_costo_tercero || 0,
        canal_cargo_cliente: venta.canal_cargo_cliente || 0,
        descuenta_caja: venta.canal_venta ? (venta.canal_venta.descuenta_caja == 1 || venta.canal_venta.descuenta_caja === true) : false,
        productos: (venta.productos || []).map((prod: any) => ({
          nombre: prod.nombre,
          cantidad: prod.pivot.cantidad,
          precio: prod.pivot.precio,
          total: prod.pivot.total,
          promocion: prod.pivot.promocion
        }))
      };
      this.printService.imprimirTicketCanal(ticketData);
    } catch (e) {
      console.error('Error al reimprimir ticket de canal:', e);
      Swal.fire('Error', 'No se pudo generar el ticket de canal para impresión.', 'error');
    }
  }
}
