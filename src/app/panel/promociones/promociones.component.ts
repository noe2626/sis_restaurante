import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PromocionesService } from '../../services/promociones.service';
import { ProductosService } from '../../services/productos.service';
import { SucursalesService } from '../../services/sucursales.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-promociones',
  templateUrl: './promociones.component.html',
  styleUrl: './promociones.component.css'
})
export class PromocionesComponent implements OnInit {
  data: Array<any> = [];
  displayedColumns: string[] = ['producto', 'sucursal', 'descripcion', 'tipo', 'valor', 'regla', 'fechas', 'activo', 'modificar', 'eliminar'];
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  formPromo: FormGroup;

  productos: Array<any> = [];
  sucursales: Array<any> = [];
  filteredData = [...this.data];

  constructor(
    private promocionesService: PromocionesService,
    private productosService: ProductosService,
    private sucursalesService: SucursalesService,
    private fb: FormBuilder
  ) {
    this.formPromo = this.fb.group({
      id: [null],
      idProducto: [null, Validators.required],
      idSucursal: [null],
      descripcion: [null, Validators.required],
      tipo: ['fijo', Validators.required],
      valor: [0, [Validators.required, Validators.min(0)]],
      cantidad_compra: [null],
      cantidad_gratis: [null],
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null, Validators.required],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.listarPromociones();
    this.listarProductos();
    this.listarSucursales();
    this.onTipoChange(); // initialize validators
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item =>
      (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm)) || 
      (item.producto && item.producto.nombre && item.producto.nombre.toLowerCase().includes(searchTerm))
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }

  onTipoChange(): void {
    const tipo = this.formPromo.get('tipo')?.value;
    if (tipo === 'oferta_dinamica') {
      this.formPromo.get('valor')?.setValue(0);
      this.formPromo.get('valor')?.disable();
      this.formPromo.get('cantidad_compra')?.enable();
      this.formPromo.get('cantidad_compra')?.setValidators([Validators.required, Validators.min(1)]);
      this.formPromo.get('cantidad_gratis')?.enable();
      this.formPromo.get('cantidad_gratis')?.setValidators([Validators.required, Validators.min(1)]);
    } else if (tipo === 'mayoreo') {
      this.formPromo.get('valor')?.enable();
      this.formPromo.get('valor')?.setValidators([Validators.required, Validators.min(0.01)]);
      this.formPromo.get('cantidad_compra')?.enable();
      this.formPromo.get('cantidad_compra')?.setValidators([Validators.required, Validators.min(1)]);
      this.formPromo.get('cantidad_gratis')?.setValue(null);
      this.formPromo.get('cantidad_gratis')?.disable();
    } else { // fijo, porcentaje
      this.formPromo.get('valor')?.enable();
      this.formPromo.get('valor')?.setValidators([Validators.required, Validators.min(0.01)]);
      this.formPromo.get('cantidad_compra')?.setValue(null);
      this.formPromo.get('cantidad_compra')?.disable();
      this.formPromo.get('cantidad_gratis')?.setValue(null);
      this.formPromo.get('cantidad_gratis')?.disable();
    }
    this.formPromo.get('valor')?.updateValueAndValidity();
    this.formPromo.get('cantidad_compra')?.updateValueAndValidity();
    this.formPromo.get('cantidad_gratis')?.updateValueAndValidity();
  }

  listarPromociones() {
    this.promocionesService.listarPromociones().subscribe({
      next: (data: any) => {
        if (Array.isArray(data)) {
          this.data = data;
        } else if (data && data.success && Array.isArray(data.data)) {
          this.data = data.data;
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
          text: 'Error al cargar promociones.'
        });
      }
    });
  }

  listarProductos() {
    this.productosService.listarProductos().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          // Filtrar solo productos vendibles (se_vende === true/1)
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

  nuevaPromocion() {
    this.formPromo.reset({
      id: null,
      idProducto: null,
      idSucursal: null,
      descripcion: null,
      tipo: 'fijo',
      valor: 0,
      cantidad_compra: null,
      cantidad_gratis: null,
      fecha_inicio: null,
      fecha_fin: null,
      activo: true
    });
    this.onTipoChange();
  }

  setEditar(promo: any) {
    this.formPromo.reset({
      id: promo.id,
      idProducto: promo.idProducto,
      idSucursal: promo.idSucursal,
      descripcion: promo.descripcion,
      tipo: promo.tipo,
      valor: promo.valor,
      cantidad_compra: promo.cantidad_compra,
      cantidad_gratis: promo.cantidad_gratis,
      fecha_inicio: promo.fecha_inicio,
      fecha_fin: promo.fecha_fin,
      activo: promo.activo === 1 || promo.activo === true
    });
    this.onTipoChange();
  }

  guardar(): void {
    if (this.formPromo.invalid) {
      this.formPromo.markAllAsTouched();
      return;
    }

    // Usar getRawValue para obtener también campos deshabilitados
    const promocion = this.formPromo.getRawValue();
    
    // Convertir activo a booleano/número
    promocion.activo = promocion.activo ? 1 : 0;

    this.promocionesService.guardarPromocion(promocion).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.listarPromociones();
          Swal.fire({
            icon: "success",
            title: "Promoción guardada",
            showConfirmButton: false,
            timer: 1500
          });
          // Cerrar modal usando bootstrap API o simulando clic
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
      text: '¿Desea eliminar esta promoción?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.promocionesService.eliminarPromocion(id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.listarPromociones();
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'La promoción ha sido eliminada.',
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo eliminar la promoción.'
              });
            }
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al eliminar la promoción.'
            });
          }
        });
      }
    });
  }
}
