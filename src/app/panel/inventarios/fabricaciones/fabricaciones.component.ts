import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FabricacionesService } from '../../../services/fabricaciones.service';
import { ProductosService } from '../../../services/productos.service';
import { MermasService } from '../../../services/mermas.service';
import Swal from 'sweetalert2';
declare var bootstrap: any;

@Component({
  selector: 'app-fabricaciones',
  templateUrl: './fabricaciones.component.html',
  styleUrl: './fabricaciones.component.css'
})
export class FabricacionesComponent implements OnInit {
  fabricaciones: any[] = [];
  productos: any[] = [];
  mermas: any[] = [];
  idSucursal: number = 0;
  loading: boolean = false;

  nuevaFabricacion: any = {
    idProducto: null,
    cantidad: null,
    fecha: '',
    insumos: []
  };

  constructor(
    private fabricacionesService: FabricacionesService,
    private productosService: ProductosService,
    private mermasService: MermasService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const idSuc = localStorage.getItem('idSucursal');
      if (idSuc) {
        this.idSucursal = parseInt(idSuc);
        this.cargarFabricaciones();
        this.cargarProductos();
        this.cargarMermas();
      }
    }
  }

  cargarFabricaciones(): void {
    this.loading = true;
    this.fabricacionesService.listarFabricaciones(this.idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.fabricaciones = res.data || [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar fabricaciones:', err);
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

  cargarMermas(): void {
    this.mermasService.listarMermas(this.idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.mermas = res.data || [];
        }
      },
      error: (err) => {
        console.error('Error al cargar mermas para fabricacion:', err);
      }
    });
  }

  getMermasFiltradas(idProducto: number): any[] {
    return this.mermas.filter(m => m.idProducto === idProducto);
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase();
    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    return nombreMatch || codigoMatch;
  }

  onProductoChange(): void {
    if (!this.nuevaFabricacion.idProducto) {
      this.nuevaFabricacion.insumos = [];
      return;
    }
    const idProd = Number(this.nuevaFabricacion.idProducto);
    this.nuevaFabricacion.insumos = [];
    if (!idProd || idProd === 0) {
      return;
    }

    this.productosService.getRecetaProducto(idProd).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          const batchQty = this.nuevaFabricacion.cantidad || 1;
          this.nuevaFabricacion.insumos = res.data.map((comp: any) => ({
            idProducto: comp.idProducto,
            producto: comp.producto,
            unidad_medida: comp.unidad_medida,
            cantidadReceta: comp.cantidad,
            cantidadRequerida: comp.cantidad * batchQty,
            cantidadEstandar: comp.cantidad * batchQty,
            cantidadMerma: 0,
            idMerma: 0
          }));
        }
      },
      error: (err) => {
        console.error('Error al cargar receta del producto:', err);
      }
    });
  }

  recalcularInsumos(): void {
    const batchQty = this.nuevaFabricacion.cantidad || 0;
    if (this.nuevaFabricacion.insumos && this.nuevaFabricacion.insumos.length > 0) {
      this.nuevaFabricacion.insumos.forEach((item: any) => {
        item.cantidadRequerida = item.cantidadReceta * batchQty;
        item.cantidadEstandar = item.cantidadReceta * batchQty;
        item.cantidadMerma = 0;
        item.idMerma = 0;
      });
    }
  }

  abrirModal(): void {
    this.nuevaFabricacion = {
      idProducto: null,
      cantidad: null,
      fecha: new Date().toISOString().substring(0, 16),
      insumos: []
    };
    this.cargarMermas();

    const modalEl = document.getElementById('fabricacionModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  guardar(): void {
    if (!this.nuevaFabricacion.idProducto || this.nuevaFabricacion.idProducto == 0) {
      Swal.fire('Advertencia', 'Debes seleccionar el producto a fabricar.', 'warning');
      return;
    }
    if (!this.nuevaFabricacion.cantidad || this.nuevaFabricacion.cantidad <= 0) {
      Swal.fire('Advertencia', 'La cantidad debe ser mayor a 0.', 'warning');
      return;
    }

    // Validar insumos
    if (this.nuevaFabricacion.insumos && this.nuevaFabricacion.insumos.length > 0) {
      for (const insumo of this.nuevaFabricacion.insumos) {
        if (insumo.cantidadEstandar < 0 || insumo.cantidadMerma < 0) {
          Swal.fire('Advertencia', `Las cantidades para ${insumo.producto} no pueden ser negativas.`, 'warning');
          return;
        }
        if (insumo.cantidadMerma > 0 && (!insumo.idMerma || insumo.idMerma == 0)) {
          Swal.fire('Advertencia', `Debes seleccionar la merma de origen para el insumo ${insumo.producto}.`, 'warning');
          return;
        }
      }
    }

    const payload = {
      idProducto: this.nuevaFabricacion.idProducto,
      cantidad: this.nuevaFabricacion.cantidad,
      fecha: this.nuevaFabricacion.fecha,
      idSucursal: this.idSucursal,
      insumos: this.nuevaFabricacion.insumos.map((item: any) => ({
        idProducto: item.idProducto,
        cantidadEstandar: item.cantidadEstandar,
        cantidadMerma: item.cantidadMerma,
        idMerma: item.cantidadMerma > 0 ? item.idMerma : null
      }))
    };

    Swal.fire({
      title: 'Registrando fabricación...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.fabricacionesService.registrarFabricacion(payload).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res && res.success) {
          Swal.fire('Éxito', 'Fabricación registrada e inventarios actualizados correctamente.', 'success');
          this.cargarFabricaciones();
          
          const modalEl = document.getElementById('fabricacionModal');
          if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal?.hide();
          }
        } else {
          Swal.fire('Error', res.message || 'Error al registrar la fabricación.', 'error');
        }
      },
      error: (err) => {
        Swal.close();
        console.error('Error al registrar fabricación:', err);
        const errMsg = err.error?.message || 'Error de comunicación con el servidor.';
        Swal.fire('Error', errMsg, 'error');
      }
    });
  }

  eliminar(id: number): void {
    Swal.fire({
      title: '¿Anular esta fabricación?',
      text: 'Se descontará la cantidad del producto fabricado y se devolverá el stock a los ingredientes correspondientes.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Anulando fabricación...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.fabricacionesService.eliminarFabricacion(id).subscribe({
          next: (res: any) => {
            Swal.close();
            if (res && res.success) {
              Swal.fire('Anulado', 'La fabricación ha sido anulada e inventarios revertidos.', 'success');
              this.cargarFabricaciones();
            } else {
              Swal.fire('Error', res.message || 'Error al anular la fabricación.', 'error');
            }
          },
          error: (err) => {
            Swal.close();
            console.error('Error al anular fabricación:', err);
            const errMsg = err.error?.message || 'Error al intentar comunicarse con el servidor.';
            Swal.fire('Error', errMsg, 'error');
          }
        });
      }
    });
  }

  getUnidadMedidaSeleccionada(): string {
    const prod = this.productos.find(p => p.id == this.nuevaFabricacion.idProducto);
    return prod ? prod.unidad_medida : 'Pza';
  }
}
