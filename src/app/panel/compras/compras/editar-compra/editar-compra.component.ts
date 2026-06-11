import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductosService } from '../../../../services/productos.service';
import { ProveedoresService } from '../../../../services/proveedores.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import CryptoJS from 'crypto-js';
import { environment } from '../../../../../environments/environment';
import { ComprasService } from '../../../../services/compras.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-compra',
  templateUrl: './editar-compra.component.html',
  styleUrl: './editar-compra.component.css'
})
export class EditarCompraComponent implements OnInit{

  formCom: FormGroup;
  idProducto:any = null;
  productos: any[] = [];
  proveedores: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['producto','codigo','cantidad','precio','iva',  'subtotal','total','eliminar'];
  totalItems = 0;
  subtotal:number = 0;
  iva:number = 0;
  descuento:number = 0;
  total: number = 0;
  idSucursal:any = 0;
  idProveedor:any = 0;
  folio_proveedor: string = '';
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(private fb: FormBuilder,
        private productoService: ProductosService,
        private proveedorService: ProveedoresService,
        private comprasService: ComprasService,
        private router: Router){
    this.formCom = this.fb.group({
      idProveedor: [null, Validators.required]
    });
    this.idSucursal=localStorage.getItem('idSucursal');
  }

  ngOnInit(): void {
    this.listarProductos();
    this.listarProveedores();
  }

  listarProductos(): void {
    this.productoService.listarProductos().subscribe({
      next: (data: any) => {
        const rawProducts = data.data || [];
        this.productos = rawProducts
          .filter((producto: any) => producto.se_compra === true || producto.se_compra === 1)
          .map((producto:any) => ({ 
            ...producto, 
            //disabled: this.isDisabled(producto),
            iva: 16
          }));
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  listarProveedores(): void {
    this.proveedorService.listarProveedores().subscribe({
      next: (data: any) => {
        this.proveedores = data.data;
        const defaultProv = this.proveedores.find(p => p.nombre.toLowerCase().includes('proveedor general') || p.nombre.toLowerCase().includes('general'));
        if (defaultProv) {
          this.idProveedor = defaultProv.id;
        }
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  isDisabled(item: any): boolean { 
    return item.inventariar && item.cantidad < 1; 
  }

  

  customSearch(term: string, item: any) {
    term = term.toLowerCase(); // Convertir el término a minúsculas para una búsqueda insensible a mayúsculas.
    
    // Verificamos si el código existe y si contiene el término, de lo contrario, solo buscamos en el nombre.
    const codigoMatch = item.codigo && item.codigo.toLowerCase().includes(term);
    const nombreMatch = item.nombre.toLowerCase().includes(term);
    
    // Si coincide con el nombre o con el código, devolver true
    return nombreMatch || codigoMatch;
  }

  agregarProducto(){
    if (!this.idProducto) return;
    var producto = this.productos.find((prod)=> prod.id == this.idProducto);
    if (producto) {
      const exist = this.dataSource.data.find((prod)=> prod.id == this.idProducto);
      if (exist) {
        exist.cantidad++;
        this.calcularTotales(exist);
        this.idProducto = null;
        return;
      }
      var prodObj = {...producto,cantidad:1,precio:0,subtotal:0,total:0};
      
      this.dataSource.data.push(prodObj);
      this.dataSource.data = [...this.dataSource.data];
      this.dataSource.paginator = this.paginator;
      this.totalItems = this.dataSource.data.length;
      this.idProducto = null;
      this.recalcularTodo();
    }
  }

  eliminarProducto(index: number){
    this.dataSource.data.splice(index, 1);
    this.dataSource.data = [...this.dataSource.data];
    this.totalItems = this.dataSource.data.length;
    this.recalcularTodo();
  }

  recalcularTodo(){
    this.subtotal = 0;
    this.iva = 0;
    this.dataSource.data.forEach((prod:any)=>{
      this.subtotal += prod.subtotal || 0;
      this.iva += (prod.subtotal || 0)*((prod.iva || 0)/100);
    });
    this.total = this.subtotal + this.iva;
  }

  calcularTotales(producto:any){
    producto.subtotal = (producto.cantidad || 0) * (producto.precio || 0);
    producto.total = producto.subtotal + (producto.subtotal*((producto.iva || 0)/100));
    this.recalcularTodo();
  }

  guardarCompra(){
    if (!this.idProveedor) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione un proveedor',
        text: 'Debe seleccionar un proveedor antes de guardar la compra.'
      });
      return;
    }
    if (this.dataSource.data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Compra vacía',
        text: 'Debe agregar al menos un producto a la compra.'
      });
      return;
    }

    let idUsuario = '1';
    try {
      const encryptedUser = localStorage.getItem('idUsuario');
      if (encryptedUser) {
        idUsuario = CryptoJS.AES.decrypt(encryptedUser, environment.secretKey).toString(CryptoJS.enc.Utf8);
      }
    } catch (e) {
      console.error('Error decrypting user id', e);
    }

    var dataCompra = {
      idUser: parseInt(idUsuario) || 1,
      subTotal: this.subtotal,
      total:this.total,
      iva: this.iva,
      idSucursal: parseInt(this.idSucursal) || 1,
      idProveedor: this.idProveedor,
      productos: this.dataSource.data,
      descuentos: 0,
      extras: 0,
      folio_proveedor: this.folio_proveedor
    };
    
    this.comprasService.registrarCompra(dataCompra).subscribe({
      next: (data: any) => {
        if(data.success){
          Swal.fire({
            icon: "success",
            title: "Compra registrada correctamente",
            showConfirmButton: false,
            timer: 1500
          });

          this.dataSource = new MatTableDataSource<any>([]);
          this.subtotal = 0;
          this.iva = 0;
          this.total = 0;
          this.router.navigate(['/panel/compras']);
        }else{
          Swal.fire({
            icon: "error",
            title: data.message || "Error al registrar la compra",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => {
        console.log('Error al registrar la compra:', err);
        Swal.fire({
          icon: "error",
          title: "Error de conexión",
          text: "No se pudo registrar la compra."
        });
      }
    });
  }

}
