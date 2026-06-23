import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductosService } from '../../../services/productos.service';
import Swal from 'sweetalert2';
import { SucursalesService } from '../../../services/sucursales.service';
import { PreciosService } from '../../../services/precios.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent implements OnInit {
  formProd: FormGroup;
  formPrecio: FormGroup;
  formInventario: FormGroup;

  productos: any[] = [];
  productosFiltrados: any[] = [];
  sucursales: any[] = [];
  componentes: any[] = [];
  productosComponentes: any[] = [];
  receta: any[] = [];
  productosReceta: any[] = [];

  idSucursal: number = 0;
  idComponente: any = null;
  productoSeleccionado: any = null;
  cantidadComponente: number = 1;
  idIngrediente: any = null;
  cantidadIngrediente: number = 1;

  displayedColumns: string[] = ['nombre', 'codigo', 'inventariar', 'se_vende', 'se_compra', 'acciones'];
  filterValues: any = { nombre: '', codigo: '', inventariar: '', se_vende: '', se_compra: '' };
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort | null = null;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductosService,
    private precioService: PreciosService,
    private sucursalesService: SucursalesService
  ) {
    this.formProd = this.fb.group({
      id: [null, Validators.required],
      nombre: [null, Validators.required],
      codigo: [null, Validators.required],
      unidad_medida: ['Pza', Validators.required],
      inventariar: [false, Validators.required],
      se_vende: [true, Validators.required],
      se_compra: [true, Validators.required]
    });

    const defaultSucursalId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('idSucursal') || '0') : 0;

    this.formPrecio = this.fb.group({
      idSucursal: [defaultSucursalId, Validators.required],
      idProducto: [0, Validators.required],
      nombre: [null, Validators.required],
      precio: [0.0, Validators.required],
    });

    this.formInventario = this.fb.group({
      idSucursal: [defaultSucursalId, Validators.required],
      idProducto: [0, Validators.required],
      nombre: [null, Validators.required],
      cantidad: [0, Validators.required],
      stock_minimo: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.listarProductos();
    this.setupFilterPredicate();
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const nombreMatch = !searchTerms.nombre || (data.nombre || '').toLowerCase().includes(searchTerms.nombre.toLowerCase());
      const codigoMatch = !searchTerms.codigo || (data.codigo || '').toLowerCase().includes(searchTerms.codigo.toLowerCase());
      
      let inventariarMatch = true;
      if (searchTerms.inventariar) {
        const val = searchTerms.inventariar.toLowerCase();
        const statusText = data.inventariar ? 'sí' : 'no';
        inventariarMatch = statusText.includes(val);
      }

      let seVendeMatch = true;
      if (searchTerms.se_vende) {
        const val = searchTerms.se_vende.toLowerCase();
        const statusText = data.se_vende ? 'sí' : 'no';
        seVendeMatch = statusText.includes(val);
      }

      let seCompraMatch = true;
      if (searchTerms.se_compra) {
        const val = searchTerms.se_compra.toLowerCase();
        const statusText = data.se_compra ? 'sí' : 'no';
        seCompraMatch = statusText.includes(val);
      }

      return nombreMatch && codigoMatch && inventariarMatch && seVendeMatch && seCompraMatch;
    };
  }

  applyColumnFilter(column: string, value: string): void {
    this.filterValues[column] = value.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  listarProductos() {
    this.productoService.listarProductos().subscribe({
      next: (data: any) => {
        if (data.success) {
          this.productos = data.data;
          this.productosFiltrados = [...this.productos];
          this.dataSource.data = this.productosFiltrados;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.totalItems = this.productosFiltrados.length;
        } else {
          console.log(data);
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.productosFiltrados = this.productos.filter(prod =>
      (prod.nombre && prod.nombre.toLowerCase().includes(searchTerm)) ||
      (prod.codigo && prod.codigo.toString().toLowerCase().includes(searchTerm))
    );
    this.dataSource.data = this.productosFiltrados;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.totalItems = this.productosFiltrados.length;
  }

  getSucursales() {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data: any) => {
        if (data.success) {
          this.sucursales = data.data;
        }
      },
      error: () => {
        alert("Error al cargar sucursales");
      },
    });
  }

  nuevoProducto() {
    const producto = {
      id: null,
      nombre: null,
      codigo: null,
      unidad_medida: 'Pza',
      inventariar: false,
      se_vende: true,
      se_compra: true
    };
    this.formProd.setValue(producto);
  }

  setEditar(prod: any) {
    const producto = {
      id: prod.id,
      nombre: prod.nombre,
      codigo: prod.codigo,
      unidad_medida: prod.unidad_medida || 'Pza',
      inventariar: prod.inventariar,
      se_vende: prod.se_vende,
      se_compra: prod.se_compra
    };
    this.formProd.setValue(producto);
  }

  cargarPreciosData(idProducto: any, producto: string) {
    const defaultSucursalId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('idSucursal') || '0') : 0;
    this.formPrecio.patchValue({ idSucursal: defaultSucursalId, idProducto: idProducto, nombre: producto });
    this.getSucursales();
    this.getPrecioProducto();
  }

  cargarInventariosData(idProducto: any, producto: string) {
    const defaultSucursalId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('idSucursal') || '0') : 0;
    this.getSucursales();
    this.formInventario.patchValue({ 
      idSucursal: defaultSucursalId, 
      idProducto: idProducto, 
      nombre: producto,
      cantidad: 0,
      stock_minimo: 0
    });
    this.getInventarioProducto();
  }

  changeSucursalPrecio() {
    this.getPrecioProducto();
  }

  changeSucursalInventario() {
    this.getInventarioProducto();
  }

  getPrecioProducto() {
    const precioData = this.formPrecio.value;
    this.precioService.getPrecioProducto(precioData.idSucursal, precioData.idProducto).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.formPrecio.patchValue({ precio: data.data.precio });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al listar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  modificarPrecio() {
    const precioData = this.formPrecio.value;
    this.precioService.setPreciosSucursal(precioData).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  getInventarioProducto() {
    const inventarioData = this.formInventario.value;
    this.productoService.getInventarioProducto(inventarioData.idProducto, inventarioData.idSucursal).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.formInventario.patchValue({ 
            cantidad: data.data.cantidad,
            stock_minimo: data.data.stock_minimo ?? 0
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al listar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  modificarInventario() {
    const inventarioData = this.formInventario.value;
    this.productoService.setInventarioProducto(inventarioData).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  onSubmit() {
    let dataProd = this.formProd.value;
    if (dataProd.codigo == null) {
      dataProd.codigo = '';
    }

    this.productoService.guardarProducto(dataProd).subscribe({
      next: (data: any) => {
        if (data.success) {
          Swal.fire({
            icon: "success",
            title: "Guardado",
            showConfirmButton: false,
            timer: 1500
          });
          this.listarProductos();
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }


  cargarComponentes(producto: any) {
    this.productoSeleccionado = producto;
    this.productoService.getComponentesProducto(producto.id).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.componentes = data.data;
          let idComponentesActuales = this.componentes.map(c => c.idProducto);
          this.productosComponentes = this.productos.filter(componente =>
          componente.inventariar == 1 
          && componente.id != producto.id 
          && !idComponentesActuales.includes(componente.id));
          console.log(this.productosComponentes);
          
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "Error al listar",
          showConfirmButton: false,
          timer: 1500
        });
        console.log(err);
      },
    });
  }

  customSearch(term: string, item: any) {
    term = term.toLowerCase();

    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    
    return nombreMatch || codigoMatch;
  }

  agregarComponente(){
    let componente = {
      producto_id: this.productoSeleccionado.id,
      componente_id: this.idComponente,
      cantidad: this.cantidadComponente
    }
    this.productoService.guardarComponentesProducto(componente).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.idComponente = null;
          this.cantidadComponente = 1;
          this.cargarComponentes(this.productoSeleccionado);
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        console.log(err);
        Swal.fire({
            icon: "error",
            title: "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
      },
    });
  }

  eliminarComponente(componente: any){

    Swal.fire({
      title: "Eliminar componente " + componente.producto,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#90a1b1ff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.deleteComponentesProducto(componente.id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.cargarComponentes(this.productoSeleccionado);
            } else {
              Swal.fire({
                icon: "error",
                title: "Error al eliminar",
                showConfirmButton: false,
                timer: 1500
              });
            }
          },
          error: (err) => {
            console.log(err);
            Swal.fire({
                icon: "error",
                title: "Error al eliminar",
                showConfirmButton: false,
                timer: 1500
              });
          },
        });
      }
    });
  }

  abrirModalConfig(producto: any) {
    this.cargarComponentes(producto);
    this.cargarReceta(producto);
  }

  cargarReceta(producto: any) {
    this.productoSeleccionado = producto;
    this.productoService.getRecetaProducto(producto.id).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.receta = data.data;
          let idIngredientesActuales = this.receta.map(r => r.idProducto);
          this.productosReceta = this.productos.filter(ingrediente =>
            ingrediente.inventariar == 1 
            && ingrediente.id != producto.id 
            && !idIngredientesActuales.includes(ingrediente.id)
          );
        } else {
          Swal.fire({
            icon: "error",
            title: "Error al listar receta",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error al listar receta",
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  agregarIngrediente() {
    let ingrediente = {
      producto_id: this.productoSeleccionado.id,
      ingrediente_id: this.idIngrediente,
      cantidad: this.cantidadIngrediente
    };
    this.productoService.guardarRecetaProducto(ingrediente).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.idIngrediente = null;
          this.cantidadIngrediente = 1;
          this.cargarReceta(this.productoSeleccionado);
        } else {
          Swal.fire({
            icon: "error",
            title: data.message || "Error al guardar ingrediente",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error al guardar ingrediente",
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  eliminarIngrediente(ingrediente: any) {
    Swal.fire({
      title: "Eliminar ingrediente " + ingrediente.producto,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#90a1b1ff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.deleteRecetaProducto(ingrediente.id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.cargarReceta(this.productoSeleccionado);
            } else {
              Swal.fire({
                icon: "error",
                title: "Error al eliminar ingrediente",
                showConfirmButton: false,
                timer: 1500
              });
            }
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: "error",
              title: "Error al eliminar ingrediente",
              showConfirmButton: false,
              timer: 1500
            });
          }
        });
      }
    });
  }

  getUnidadMedidaComponente(): string {
    const prod = this.productos.find(p => p.id == this.idComponente);
    return prod ? prod.unidad_medida : '';
  }

  getUnidadMedidaIngrediente(): string {
    const prod = this.productos.find(p => p.id == this.idIngrediente);
    return prod ? prod.unidad_medida : '';
  }
}
