import { Component, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PreciosClienteService } from '../../services/precios-cliente.service';
import { ClientesService } from '../../services/clientes.service';
import { ProductosService } from '../../services/productos.service';
import { SucursalesService } from '../../services/sucursales.service';
import { isPlatformBrowser } from '@angular/common';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-precios-cliente',
  templateUrl: './precios-cliente.component.html',
  styleUrl: './precios-cliente.component.css'
})
export class PreciosClienteComponent implements OnInit {
  data: Array<any> = [];
  displayedColumns: string[] = ['cliente', 'producto', 'sucursal', 'tipo_ajuste', 'valor_ajuste', 'precio_especial', 'activo', 'modificar', 'eliminar'];
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  formPrecio: FormGroup;

  clientes: Array<any> = [];
  productos: Array<any> = [];
  sucursales: Array<any> = [];
  filteredData = [...this.data];

  roleId: number = 0;
  idSucursal: number = 0;

  constructor(
    private preciosClienteService: PreciosClienteService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private sucursalesService: SucursalesService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.formPrecio = this.fb.group({
      id: [null],
      idCliente: [null, Validators.required],
      idProducto: [null, Validators.required],
      idSucursal: [0],
      tipo_ajuste: ['fijo', Validators.required],
      valor_ajuste: [0, [Validators.required, Validators.min(0)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.idSucursal = parseInt(localStorage.getItem('idSucursal') || '0');
      const encryptedIdTipo = localStorage.getItem('idTipo') || '';
      if (encryptedIdTipo) {
        try {
          this.roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
        } catch (e) {
          console.error('Error decrypting role in precios cliente:', e);
        }
      }
    }

    this.listarPreciosCliente();
    this.listarClientes();
    this.listarProductos();
    this.listarSucursales();
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item =>
      (item.cliente && item.cliente.nombre && item.cliente.nombre.toLowerCase().includes(searchTerm)) ||
      (item.producto && item.producto.nombre && item.producto.nombre.toLowerCase().includes(searchTerm))
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase();
    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    return nombreMatch || codigoMatch;
  }

  listarPreciosCliente() {
    const filterBranchId = this.roleId === 2 ? this.idSucursal : undefined;
    this.preciosClienteService.listarPreciosCliente(filterBranchId).subscribe({
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
          text: 'Error al cargar los precios especiales.'
        });
      }
    });
  }

  listarClientes() {
    this.clientesService.listarClientes().subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.clientes = res;
        } else if (res && res.success && Array.isArray(res.data)) {
          this.clientes = res.data;
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  listarProductos() {
    this.productosService.listarProductos().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.productos = res.data.filter((p: any) => p.se_vende === true || p.se_vende === 1);
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  listarSucursales() {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.sucursales = res.data;
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  nuevoPrecioCliente() {
    this.formPrecio.reset({
      id: null,
      idCliente: null,
      idProducto: null,
      idSucursal: this.roleId === 2 ? this.idSucursal : 0,
      tipo_ajuste: 'fijo',
      valor_ajuste: 0,
      activo: true
    });

    if (this.roleId === 2) {
      this.formPrecio.get('idSucursal')?.setValue(this.idSucursal);
      this.formPrecio.get('idSucursal')?.disable();
    } else {
      this.formPrecio.get('idSucursal')?.enable();
    }
  }

  setEditar(precio: any) {
    this.formPrecio.reset({
      id: precio.id,
      idCliente: precio.idCliente,
      idProducto: precio.idProducto,
      idSucursal: precio.idSucursal === null || precio.idSucursal === undefined ? 0 : precio.idSucursal,
      tipo_ajuste: precio.tipo_ajuste || 'fijo',
      valor_ajuste: precio.valor_ajuste !== undefined ? precio.valor_ajuste : precio.precio_especial,
      activo: precio.activo === 1 || precio.activo === true
    });

    if (this.roleId === 2) {
      this.formPrecio.get('idSucursal')?.setValue(this.idSucursal);
      this.formPrecio.get('idSucursal')?.disable();
    } else {
      this.formPrecio.get('idSucursal')?.enable();
    }
  }

  guardar(): void {
    if (this.formPrecio.invalid) {
      this.formPrecio.markAllAsTouched();
      return;
    }

    const priceData = this.formPrecio.getRawValue();
    if (priceData.idSucursal === 0 || priceData.idSucursal === '0') {
      priceData.idSucursal = null;
    }
    priceData.activo = priceData.activo ? 1 : 0;

    this.preciosClienteService.guardarPrecioCliente(priceData).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.listarPreciosCliente();
          Swal.fire({
            icon: "success",
            title: "Precio especial guardado",
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
    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea eliminar este precio especial?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.preciosClienteService.eliminarPrecioCliente(id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.listarPreciosCliente();
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El precio especial ha sido eliminado.',
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo eliminar el precio especial.'
              });
            }
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al eliminar el precio especial.'
            });
          }
        });
      }
    });
  }
}
