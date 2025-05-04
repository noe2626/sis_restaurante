import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SucursalesService } from '../../../services/sucursales.service';
import { ProveedoresService } from '../../../services/proveedores.service';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent {
  data: Array<any> = [];
  idSucursal:any;
  sucursales: any = null;
  displayedColumns: string[] = ['nombre','email','telefono','rfc', 'modificar']; 
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  formPro: FormGroup;

  originalData = [JSON.parse(JSON.stringify(this.data))]; // Copia profunda de los datos originales 

  filteredData = [...this.data];

  constructor(private sucursalesService: SucursalesService,
    private proveedoresService: ProveedoresService,
    private fb: FormBuilder){
      this.formPro = this.fb.group({
        id: [null, Validators.required],
        nombre: [null, Validators.required],
        email: [null, [Validators.required, Validators.email]],
        telefono: [null, Validators.required],
        rfc: [null, Validators.required],
        estatus: [null, Validators.required],
      });
  }

  ngOnInit(): void { 
    this.idSucursal = localStorage.getItem('idSucursal');
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.sucursales=data.data
        }
      },
      error: () => { alert("Error al actualizar") },
    });
    this.listarProveedores();
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item => 
      item.nombre.toLowerCase().includes(searchTerm) || item.email.toLowerCase().includes(searchTerm)
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.totalItems = this.filteredData.length;
  }

  guardar(): void {
    let proveedor=this.formPro.value;
    this.proveedoresService.guardarProveedor(proveedor).subscribe({
      next: (data:any) => {
        if (data.success) {
          this.listarProveedores();
          Swal.fire({
            icon: "success",
            title: "Provedor guardado",
            showConfirmButton: false,
            timer: 1500
          });
        }else{
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

  listarProveedores(){
    this.proveedoresService.listarProveedores().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.data=data.data;
          this.originalData = JSON.parse(JSON.stringify(this.data));
          this.filteredData = [...this.data];
          this.dataSource.data = this.filteredData;
          this.dataSource.paginator = this.paginator;
          this.totalItems = this.filteredData.length;
        }else{
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

  nuevoProveedor(){
    let proveedor = {
      id: null,
      nombre: null,
      email: null,
      telefono: null,
      rfc: null,
      estatus: null,
    }
    this.formPro.setValue(proveedor);
  }

  setEditar(prov: any){
    let proveedor = {
      id: prov.id,
      nombre: prov.nombre,
      email: prov.email,
      telefono: prov.telefono,
      rfc: prov.rfc,
      estatus: prov.estatus,
    }
    this.formPro.setValue(proveedor);
  }


}
