import { Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CanalesVentaService } from '../../services/canales-venta.service';
import { SucursalesService } from '../../services/sucursales.service';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-canales-venta',
  templateUrl: './canales-venta.component.html',
  styleUrl: './canales-venta.component.css'
})
export class CanalesVentaComponent implements OnInit {
  data: Array<any> = [];
  displayedColumns: string[] = ['nombre', 'sucursal', 'costo_fijo', 'porcentaje_comision', 'cargo_cliente', 'minimo_envio_gratis', 'descuenta_caja', 'activo', 'modificar', 'eliminar'];
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  formCanal: FormGroup;
  filteredData = [...this.data];

  roleId: number = 0;
  sucursales: any[] = [];

  constructor(
    private canalesVentaService: CanalesVentaService,
    private sucursalesService: SucursalesService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.formCanal = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      idSucursal: [0],
      costo_fijo: [0, [Validators.required, Validators.min(0)]],
      porcentaje_comision: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      cargo_cliente: [0, [Validators.required, Validators.min(0)]],
      minimo_envio_gratis: [0, [Validators.required, Validators.min(0)]],
      descuenta_caja: [false, Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const encryptedIdTipo = localStorage.getItem('idTipo') || '';
      if (encryptedIdTipo) {
        try {
          this.roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
        } catch (e) {
          console.error('Error decrypting role in canales venta:', e);
        }
      }
    }

    this.listarCanalesVenta();
    this.cargarSucursales();
  }

  cargarSucursales() {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data: any) => {
        this.sucursales = data.data || data || [];
      },
      error: (err: any) => {
        console.error('Error al cargar sucursales:', err);
      }
    });
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item =>
      item.nombre && item.nombre.toLowerCase().includes(searchTerm)
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }

  listarCanalesVenta() {
    this.canalesVentaService.listarCanalesVenta().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.data = data;
        } else {
          this.data = [];
        }
        this.filteredData = [...this.data];
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.totalItems = this.filteredData.length;
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar los canales de venta.'
        });
      }
    });
  }

  nuevoCanalVenta() {
    this.formCanal.reset({
      id: null,
      nombre: '',
      idSucursal: 0,
      costo_fijo: 0,
      porcentaje_comision: 0,
      cargo_cliente: 0,
      minimo_envio_gratis: 0,
      descuenta_caja: false,
      activo: true
    });
  }

  setEditar(canal: any) {
    this.formCanal.reset({
      id: canal.id,
      nombre: canal.nombre,
      idSucursal: canal.idSucursal === null || canal.idSucursal === undefined ? 0 : canal.idSucursal,
      costo_fijo: canal.costo_fijo,
      porcentaje_comision: canal.porcentaje_comision,
      cargo_cliente: canal.cargo_cliente,
      minimo_envio_gratis: canal.minimo_envio_gratis,
      descuenta_caja: canal.descuenta_caja === 1 || canal.descuenta_caja === true,
      activo: canal.activo === 1 || canal.activo === true
    });
  }

  guardar(): void {
    if (this.formCanal.invalid) {
      this.formCanal.markAllAsTouched();
      return;
    }

    const canalData = this.formCanal.getRawValue();
    if (canalData.idSucursal === 0 || canalData.idSucursal === '0') {
      canalData.idSucursal = null;
    }
    canalData.activo = canalData.activo ? 1 : 0;
    canalData.descuenta_caja = canalData.descuenta_caja ? 1 : 0;

    this.canalesVentaService.guardarCanalVenta(canalData).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.listarCanalesVenta();
          Swal.fire({
            icon: "success",
            title: "Canal de venta guardado",
            showConfirmButton: false,
            timer: 1500
          });
          const closeBtn = document.getElementById('closeModalBtn');
          closeBtn?.click();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            text: data.message || "Verifique los datos."
          });
        }
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          text: "Hubo un error del servidor."
        });
      }
    });
  }

  eliminar(id: number) {
    if (id === 1 || id === 2) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción prohibida',
        text: 'No se pueden eliminar los canales predeterminados del sistema.'
      });
      return;
    }

    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea eliminar este canal de venta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.canalesVentaService.eliminarCanalVenta(id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.listarCanalesVenta();
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El canal de venta ha sido eliminado.',
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo eliminar el canal de venta.'
              });
            }
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al eliminar el canal de venta.'
            });
          }
        });
      }
    });
  }
}
