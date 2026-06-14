import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  roles: any[] = [];
  sucursales: any[] = [];
  loading: boolean = true;
  searchText: string = '';

  get usuariosFiltrados(): any[] {
    if (!this.searchText.trim()) {
      return this.usuarios;
    }
    const text = this.searchText.toLowerCase().trim();
    return this.usuarios.filter(u => 
      u.name.toLowerCase().includes(text) || 
      u.user.toLowerCase().includes(text) || 
      (u.role && u.role.nombre.toLowerCase().includes(text))
    );
  }

  userForm: FormGroup;
  isEditMode: boolean = false;
  selectedUserId: number | null = null;
  selectedSucursales: number[] = [];

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      user: ['', [Validators.required, Validators.maxLength(255)]],
      password: [''],
      idTipo: [null, Validators.required],
      estatus: [1, Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.usersService.getUsers().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.usuarios = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
        this.loading = false;
      }
    });

    this.usersService.getRoles().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.roles = res.data;
        }
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
      }
    });

    this.usersService.getAllSucursales().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.sucursales = res.data;
        }
      },
      error: (err) => {
        console.error('Error al cargar sucursales:', err);
      }
    });
  }

  getRoleName(idTipo: number): string {
    const role = this.roles.find(r => r.id === idTipo);
    return role ? role.nombre : 'N/A';
  }

  abrirModalNuevo(): void {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.selectedSucursales = [];
    this.userForm.reset({
      name: '',
      user: '',
      password: '',
      idTipo: null,
      estatus: 1
    });
    
    // Contraseña requerida al crear
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(4)]);
    this.userForm.get('password')?.updateValueAndValidity();

    const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    modal.show();
  }

  abrirModalEditar(usuario: any): void {
    this.isEditMode = true;
    this.selectedUserId = usuario.id;
    this.selectedSucursales = usuario.sucursales.map((s: any) => s.id);
    
    this.userForm.patchValue({
      name: usuario.name,
      user: usuario.user,
      idTipo: usuario.idTipo,
      password: '', // Vacío por defecto al editar
      estatus: usuario.estatus
    });

    // Contraseña opcional al editar
    this.userForm.get('password')?.setValidators([Validators.minLength(4)]);
    this.userForm.get('password')?.updateValueAndValidity();

    const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    modal.show();
  }

  onSucursalChange(idSucursal: number, event: any): void {
    if (event.target.checked) {
      if (!this.selectedSucursales.includes(idSucursal)) {
        this.selectedSucursales.push(idSucursal);
      }
    } else {
      this.selectedSucursales = this.selectedSucursales.filter(id => id !== idSucursal);
    }
  }

  isSucursalChecked(idSucursal: number): boolean {
    return this.selectedSucursales.includes(idSucursal);
  }

  guardarUsuario(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.userForm.value,
      sucursales: this.selectedSucursales
    };

    if (this.isEditMode && this.selectedUserId) {
      this.usersService.updateUser(this.selectedUserId, payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire('Éxito', 'Usuario actualizado correctamente.', 'success');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            Swal.fire('Error', res.message || 'No se pudo actualizar el usuario.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al actualizar usuario:', err);
          Swal.fire('Error', err.error?.message || 'Error del servidor al actualizar.', 'error');
        }
      });
    } else {
      this.usersService.createUser(payload).subscribe({
        next: (res: any) => {
          if (res && res.success) {
            Swal.fire('Éxito', 'Usuario creado correctamente.', 'success');
            this.cerrarModal();
            this.cargarDatos();
          } else {
            Swal.fire('Error', res.message || 'No se pudo crear el usuario.', 'error');
          }
        },
        error: (err) => {
          console.error('Error al crear usuario:', err);
          Swal.fire('Error', err.error?.message || 'Error del servidor al crear.', 'error');
        }
      });
    }
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('usuarioModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }

  toggleEstatusUsuario(usuario: any): void {
    if (usuario.user === 'admin') {
      Swal.fire('Acción Prohibida', 'El usuario administrador principal (admin) no puede ser desactivado.', 'warning');
      return;
    }

    const nuevoEstado = usuario.estatus === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar/dar de alta' : 'dar de baja';

    Swal.fire({
      title: `¿Quieres ${accion} al usuario?`,
      text: `El usuario "${usuario.name}" cambiará a estado ${nuevoEstado === 1 ? 'activo' : 'inactivo'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado === 1 ? '#28a745' : '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (nuevoEstado === 0) {
          // Inactivación lógica usando deleteUser (que hace estatus = 0)
          this.usersService.deleteUser(usuario.id).subscribe({
            next: (res: any) => {
              if (res && res.success) {
                Swal.fire('Éxito', 'El usuario ha sido dado de baja.', 'success');
                this.cargarDatos();
              } else {
                Swal.fire('Error', res.message || 'No se pudo dar de baja al usuario.', 'error');
              }
            },
            error: (err) => {
              console.error('Error al dar de baja:', err);
              Swal.fire('Error', 'Error al dar de baja al usuario.', 'error');
            }
          });
        } else {
          // Reactivación usando updateUser
          const payload = {
            name: usuario.name,
            user: usuario.user,
            idTipo: usuario.idTipo,
            estatus: 1,
            sucursales: usuario.sucursales.map((s: any) => s.id)
          };
          this.usersService.updateUser(usuario.id, payload).subscribe({
            next: (res: any) => {
              if (res && res.success) {
                Swal.fire('Éxito', 'El usuario ha sido reactivado correctamente.', 'success');
                this.cargarDatos();
              } else {
                Swal.fire('Error', res.message || 'No se pudo reactivar el usuario.', 'error');
              }
            },
            error: (err) => {
              console.error('Error al reactivar:', err);
              Swal.fire('Error', 'Error al reactivar el usuario.', 'error');
            }
          });
        }
      }
    });
  }
}
