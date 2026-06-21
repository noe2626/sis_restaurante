import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { VentasService } from '../../../services/ventas.service';
import Swal from 'sweetalert2';
import { PrintService, TicketData } from '../../../services/print.service';
import CryptoJS from 'crypto-js';
import { environment } from '../../../../environments/environment';

declare var bootstrap: any;

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

  // Entrega de Órdenes
  ventaAEntregar: any = null;
  estatusEntrega: number = 1;
  metodoPagoEntrega: string = 'efectivo';

  // Registrar abonos desde listado
  ventaAbonar: any = null;
  abonosHistorial: any[] = [];
  montoAbonoLista: number = 0;
  metodoPagoAbonoLista: string = 'efectivo';

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
          const modalElement = document.getElementById('detalleVentaModal');
          if (modalElement) {
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
              const closeBtn = document.getElementById('closeDetalleVentaModalBtn');
              closeBtn?.click();
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

  abrirEntregarModal(venta: any): void {
    this.ventaAEntregar = venta;
    this.estatusEntrega = 1;
    this.metodoPagoEntrega = 'efectivo';
    
    const modalElement = document.getElementById('entregarOrdenModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  alCambiarEstatusEntrega(): void {
    if (this.estatusEntrega === 3) {
      this.metodoPagoEntrega = 'credito';
    } else {
      if (this.metodoPagoEntrega === 'credito') {
        this.metodoPagoEntrega = 'efectivo';
      }
    }
  }

  procesarEntrega(): void {
    if (!this.ventaAEntregar) return;

    const decryptedIdCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);

    const payload = {
      estatus: this.estatusEntrega,
      metodo_pago: this.metodoPagoEntrega,
      idCaja: decryptedIdCaja ? parseInt(decryptedIdCaja) : null
    };

    this.ventasService.entregarOrden(this.ventaAEntregar.id, payload).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', 'La orden ha sido entregada y procesada correctamente.', 'success');
        const modalElement = document.getElementById('entregarOrdenModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal?.hide();
        }
        this.listarVentas();
        this.ventaAEntregar = null;
      },
      error: (err) => {
        console.error('Error al entregar orden:', err);
        Swal.fire('Error', err.error?.message || 'Error al procesar la entrega de la orden.', 'error');
      }
    });
  }

  abrirAbonoModal(venta: any): void {
    this.ventasService.obtenerDetalleVenta(venta.id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.ventaAbonar = res.data;
          this.abonosHistorial = res.data.abonos || [];
          const totalAbonado = this.abonosHistorial.reduce((sum, a) => sum + parseFloat(a.monto), 0);
          this.ventaAbonar.saldo_restante = Math.max(0, this.ventaAbonar.total - totalAbonado);
          this.montoAbonoLista = this.ventaAbonar.saldo_restante;
          this.metodoPagoAbonoLista = 'efectivo';

          const modalElement = document.getElementById('abonoVentaListaModal');
          if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar detalle para abono:', err);
        Swal.fire('Error', 'No se pudieron cargar los datos de la venta.', 'error');
      }
    });
  }

  procesarAbonoLista(): void {
    if (!this.ventaAbonar) return;
    if (this.montoAbonoLista <= 0) {
      Swal.fire('Atención', 'El monto a abonar debe ser mayor a 0.', 'warning');
      return;
    }
    if (this.montoAbonoLista > this.ventaAbonar.saldo_restante) {
      Swal.fire('Atención', 'El monto supera el saldo pendiente.', 'warning');
      return;
    }

    const decryptedIdCaja = CryptoJS.AES.decrypt(localStorage.getItem('idCaja') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);
    const idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario') || '', environment.secretKey).toString(CryptoJS.enc.Utf8);
    
    const payload = {
      monto: this.montoAbonoLista,
      metodo_pago: this.metodoPagoAbonoLista,
      idUser: parseInt(idUsuario),
      idCaja: decryptedIdCaja ? parseInt(decryptedIdCaja) : null
    };

    this.ventasService.registrarAbono(this.ventaAbonar.id, payload).subscribe({
      next: (res: any) => {
        Swal.fire('Éxito', 'Abono registrado correctamente.', 'success');
        const modalElement = document.getElementById('abonoVentaListaModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal?.hide();
        }
        this.listarVentas();
        this.ventaAbonar = null;
        this.montoAbonoLista = 0;
      },
      error: (err) => {
        console.error('Error al registrar abono:', err);
        Swal.fire('Error', err.error?.message || 'Error al registrar el abono.', 'error');
      }
    });
  }

  getMontoAbonado(abonos: any[]): number {
    if (!abonos) return 0;
    return abonos.reduce((sum, a) => sum + parseFloat(a.monto), 0);
  }
}
