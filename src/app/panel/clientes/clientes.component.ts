import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ClientesService } from '../../services/clientes.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  data: Array<any> = [];
  displayedColumns: string[] = ['nombre', 'email', 'telefono', 'limite_credito', 'modificar', 'eliminar'];
  displayedColumnsFilters: string[] = ['filter-nombre', 'filter-email', 'filter-telefono', 'filter-limite_credito', 'filter-space-mod', 'filter-space-el'];
  filterValues: any = { nombre: '', email: '', telefono: '', limite_credito: '' };
  dataSource = new MatTableDataSource<any>([]);
  totalItems = 0;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  @ViewChild(MatSort) sort: MatSort | null = null;
  formCli: FormGroup;

  originalData = [JSON.parse(JSON.stringify(this.data))];
  filteredData = [...this.data];

  constructor(
    private clientesService: ClientesService,
    private fb: FormBuilder
  ) {
    this.formCli = this.fb.group({
      id: [null],
      nombre: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      telefono: [null, Validators.required],
      limite_credito: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.listarClientes();
    this.setupFilterPredicate();
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      
      const nombreMatch = !searchTerms.nombre || (data.nombre || '').toLowerCase().includes(searchTerms.nombre.toLowerCase());
      const emailMatch = !searchTerms.email || (data.email || '').toLowerCase().includes(searchTerms.email.toLowerCase());
      const telefonoMatch = !searchTerms.telefono || (data.telefono || '').toLowerCase().includes(searchTerms.telefono.toLowerCase());
      const limiteCreditoMatch = !searchTerms.limite_credito || (data.limite_credito || '').toString().includes(searchTerms.limite_credito);

      return nombreMatch && emailMatch && telefonoMatch && limiteCreditoMatch;
    };
  }

  applyColumnFilter(column: string, value: string): void {
    this.filterValues[column] = value.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onSearch(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredData = this.data.filter(item =>
      (item.nombre && item.nombre.toLowerCase().includes(searchTerm)) || 
      (item.email && item.email.toLowerCase().includes(searchTerm))
    );
    this.dataSource.data = this.filteredData;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.totalItems = this.filteredData.length;
  }

  guardar(): void {
    if (this.formCli.invalid) {
      this.formCli.markAllAsTouched();
      return;
    }

    let cliente = this.formCli.getRawValue();
    this.clientesService.guardarCliente(cliente).subscribe({
      next: (data: any) => {
        if (data.success) {
          this.listarClientes();
          Swal.fire({
            icon: "success",
            title: "Cliente guardado",
            showConfirmButton: false,
            timer: 1500
          });
        } else {
          Swal.fire({
            icon: "error",
            title: data.message || "Error al guardar",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error al guardar",
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  listarClientes() {
    this.clientesService.listarClientes().subscribe({
      next: (data: any) => {
        // API returns the list directly or inside data.data or success envelope
        if (data && data.success && Array.isArray(data.data)) {
          this.data = data.data;
        } else if (Array.isArray(data)) {
          this.data = data;
        } else {
          this.data = [];
        }
        this.originalData = JSON.parse(JSON.stringify(this.data));
        this.filteredData = [...this.data];
        this.dataSource.data = this.filteredData;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.totalItems = this.filteredData.length;
      },
      error: (err: any) => {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error al cargar clientes",
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  nuevoCliente() {
    this.formCli.get('nombre')?.enable();
    let cliente = {
      id: null,
      nombre: null,
      email: null,
      telefono: null,
      limite_credito: 0
    };
    this.formCli.setValue(cliente);
  }

  setEditar(cli: any) {
    this.formCli.get('nombre')?.enable();
    let cliente = {
      id: cli.id,
      nombre: cli.nombre,
      email: cli.email,
      telefono: cli.telefono,
      limite_credito: cli.limite_credito || 0
    };
    this.formCli.setValue(cliente);
    if (cli.id === 1) {
      this.formCli.get('nombre')?.disable();
    }
  }

  eliminar(id: number) {
    if (id === 1) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede eliminar el cliente general.'
      });
      return;
    }

    Swal.fire({
      title: '¿Está seguro?',
      text: '¿Desea eliminar este cliente?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.clientesService.eliminarCliente(id).subscribe({
          next: (data: any) => {
            if (data.success) {
              this.listarClientes();
              Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El cliente ha sido eliminado.',
                showConfirmButton: false,
                timer: 1500
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo eliminar el cliente.'
              });
            }
          },
          error: (err: any) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Hubo un error al eliminar el cliente.'
            });
          }
        });
      }
    });
  }
}
