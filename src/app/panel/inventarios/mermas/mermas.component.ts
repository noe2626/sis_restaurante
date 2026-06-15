import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MermasService } from '../../../services/mermas.service';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-mermas',
  templateUrl: './mermas.component.html',
  styleUrl: './mermas.component.css'
})
export class MermasComponent implements OnInit {
  mermas: any[] = [];
  productos: any[] = [];
  idSucursal: number = 0;
  loading: boolean = false;
  
  nuevaMerma: any = {
    idProducto: null,
    cantidad: null,
    motivo: null,
    notas: '',
    fecha: ''
  };

  motivosSugeridos: string[] = [
    'Caducado / Expirado',
    'Dañado / Roto / Caída',
    'Mala preparación / Error de cocina',
    'Insumo en mal estado',
    'Otro'
  ];

  constructor(
    private mermasService: MermasService,
    private productosService: ProductosService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const idSuc = localStorage.getItem('idSucursal');
      if (idSuc) {
        this.idSucursal = parseInt(idSuc);
        this.cargarMermas();
        this.cargarProductos();
      }
    }
  }

  cargarMermas(): void {
    this.loading = true;
    this.mermasService.listarMermas(this.idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.mermas = res.data || [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar mermas:', err);
        this.loading = false;
      }
    });
  }

  cargarProductos(): void {
    this.productosService.listarProductos().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.productos = res.data || [];
        } else if (Array.isArray(res)) {
          this.productos = res;
        }
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
      }
    });
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase();
    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    return nombreMatch || codigoMatch;
  }

  abrirModal(): void {
    this.nuevaMerma = {
      idProducto: null,
      cantidad: null,
      motivo: null,
      notas: '',
      fecha: new Date().toISOString().substring(0, 16)
    };
    
    const modalEl = document.getElementById('mermaModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  guardar(): void {
    if (!this.nuevaMerma.idProducto || this.nuevaMerma.idProducto == 0) {
      Swal.fire('Advertencia', 'Debes seleccionar un producto.', 'warning');
      return;
    }
    if (!this.nuevaMerma.cantidad || this.nuevaMerma.cantidad <= 0) {
      Swal.fire('Advertencia', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }
    if (!this.nuevaMerma.motivo) {
      Swal.fire('Advertencia', 'Debes seleccionar o ingresar un motivo.', 'warning');
      return;
    }

    const payload = {
      ...this.nuevaMerma,
      idSucursal: this.idSucursal
    };

    Swal.fire({
      title: 'Registrando merma...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.mermasService.registrarMerma(payload).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res && res.success) {
          Swal.fire('Éxito', 'Merma registrada e inventario descontado correctamente.', 'success');
          this.cargarMermas();
          
          const modalEl = document.getElementById('mermaModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();
          }
        } else {
          Swal.fire('Error', res.message || 'Error al registrar la merma.', 'error');
        }
      },
      error: (err) => {
        Swal.close();
        console.error('Error al registrar merma:', err);
        const errMsg = err.error?.message || 'Error de comunicación con el servidor.';
        Swal.fire('Error', errMsg, 'error');
      }
    });
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Anular esta merma?',
      text: 'Se restablecerá la cantidad de inventario correspondiente y esta pérdida será anulada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Anulando merma...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.mermasService.eliminarMerma(id).subscribe({
          next: (res: any) => {
            Swal.close();
            if (res && res.success) {
              Swal.fire('Anulado', 'La merma ha sido anulada e inventarios restablecidos.', 'success');
              this.cargarMermas();
            } else {
              Swal.fire('Error', res.message || 'Error al anular la merma.', 'error');
            }
          },
          error: (err) => {
            Swal.close();
            console.error('Error al anular merma:', err);
            const errMsg = err.error?.message || 'Error al intentar comunicarse con el servidor.';
            Swal.fire('Error', errMsg, 'error');
          }
        });
      }
    });
  }

  getUnidadMedidaSeleccionada(): string {
    const prod = this.productos.find(p => p.id == this.nuevaMerma.idProducto);
    return prod ? prod.unidad_medida : 'Pza';
  }
}
