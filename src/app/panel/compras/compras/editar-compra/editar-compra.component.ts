import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  displayedColumns: string[] = ['producto','codigo','cantidad','precio','iva',  'subtotal','total'];
  totalItems = 0;
  subtotal:number = 0;
  iva:number = 0;
  descuento:number = 0;
  total: number = 0;
  idSucursal:any = 0;
  idProveedor:any = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(private fb: FormBuilder,
        private productoService: ProductosService,
        private proveedorService: ProveedoresService,
        private comprasService: ComprasService){
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
        this.productos = data.data.map((producto:any) => ({ 
          ...producto, 
          disabled: this.isDisabled(producto),
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
    var producto = this.productos.find((prod)=> prod.id == this.idProducto)
    var prodObj = {...producto,cantidad:1,precio:0,subtotal:0,total:0}
    
    this.dataSource.data.push(prodObj);
    this.dataSource.paginator = this.paginator;
    this.totalItems ++;
    this.idProducto = null;
  }

  calcularTotales(producto:any){
    producto.subtotal = producto.cantidad*producto.precio;
    producto.total = producto.subtotal + (producto.subtotal*(producto.iva/100));

    this.subtotal = 0
    this.iva = 0
    this.dataSource.data.map((prod:any)=>{
      this.subtotal += prod.subtotal;
      this.iva += prod.subtotal*(prod.iva/100);
    })
    this.total = this.subtotal + this.iva;
  }

  guardarCompra(){
    let idUsuario = CryptoJS.AES.decrypt(localStorage.getItem('idUsuario'), environment.secretKey).toString(CryptoJS.enc.Utf8);
    var dataCompra = {
      idUser: idUsuario,
      subTotal: this.subtotal,
      total:this.total,
      iva: this.iva,
      idSucursal: this.idSucursal,
      idProveedor: this.idProveedor,
      productos: this.dataSource.data,
      descuentos: 0,
      extras: 0
    };
    
    this.comprasService.registrarCompra(dataCompra).subscribe({
          next: (data: any) => {
            if(data.success){
              Swal.fire({
                icon: "success",
                title: "Compra registrada conrrectamente",
                showConfirmButton: false,
                timer: 1500
              });
  
              this.dataSource = new MatTableDataSource<any>([]);
              this.subtotal = 0;
              this.iva = 0;
              this.total = 0;
            }else{
              Swal.fire({
                icon: "error",
                title: "Error al registrar la compra",
                showConfirmButton: false,
                timer: 1500
              });
            }
            
          },
          error: (err) => {
            console.log('Error al registrar la venta:', err);
          }
        });
  }

}
