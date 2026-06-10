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
  displayedColumns: string[] = ['nombre','email','telefono','rfc', 'modificar', 'eliminar']; 
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
    let proveedor=this.formPro.getRawValue();
    this.proveedoresService.guardarProveedor(proveedor).subscribe({
      next: (data:any) => {
        if (data.success) {
          this.listarProveedores();
          Swal.fire({
            icon: "success",
            title: "Proveedor guardado",
            showConfirmButton: false,
            timer: 1500
          });
        }else{
          Swal.fire({
            icon: "error",
            title: data.message || "Error al guardar",
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
            title: "Error al cargar proveedores",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err) => { 
        console.log(err);
        Swal.fire({
          icon: "error",
          title: "Error al cargar proveedores",
          showConfirmButton: false,
          timer: 1500
        });
      },
    });
  }

  nuevoProveedor(){
    this.formPro.get('nombre')?.enable();
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
    this.formPro.get('nombre')?.enable();
    let proveedor = {
      id: prov.id,
      nombre: prov.nombre,
      email: prov.email,
      telefono: prov.telefono,
      rfc: prov.rfc,
      estatus: prov.estatus,
    }
    this.formPro.setValue(proveedor);
    if (prov.id === 1) {
      this.formPro.get('nombre')?.disable();
    }
  }

  eliminar(id: number) {
    if (id === 1) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede eliminar el proveedor general.'
      });
      return;
    }

    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea eliminar este proveedor?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.proveedoresService.eliminarProveedor(id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.listarProveedores();
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El proveedor ha sido eliminado.',
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo eliminar el proveedor.'
              });
            }
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al eliminar el proveedor.'
            });
          }
        });
      }
    });
  }


}
