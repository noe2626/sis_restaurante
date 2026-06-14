import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SucursalesService } from '../../services/sucursales.service';
import Swal from 'sweetalert2';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent implements OnInit {
  sucursalNombre: string = '';
  userSucursales: any[] = [];
  roleId: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sucursalesService: SucursalesService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.sucursalNombre = localStorage.getItem('sucursal') || '';

      const encryptedIdTipo = localStorage.getItem('idTipo') || '';
      if (encryptedIdTipo) {
        try {
          this.roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
        } catch (e) {
          console.error('Error decrypting role in navbar:', e);
        }
      }

      this.cargarSucursales();
    }
  }

  cargarSucursales(): void {
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (res: any) => {
        if (res && res.success) {
          this.userSucursales = res.data || [];
        }
      },
      error: (err) => {
        console.error('Error al cargar sucursales asignadas:', err);
      }
    });
  }

  cambiarSucursal(suc: any): void {
    if (isPlatformBrowser(this.platformId)) {
      const currentBranchId = localStorage.getItem('idSucursal');
      if (currentBranchId && currentBranchId === suc.idSucursal.toString()) {
        return; // No-op si ya está en la sucursal seleccionada
      }

      Swal.fire({
        title: '¿Cambiar de sucursal?',
        text: `¿Estás seguro de que deseas cambiar a la sucursal "${suc.sucursal}"? Tu caja actual de esta sucursal permanecerá abierta para que puedas retomarla cuando regreses.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.setItem('idSucursal', suc.idSucursal.toString());
          localStorage.setItem('sucursal', suc.sucursal);
          localStorage.setItem('manejaIva', (suc.manejaIva ?? 0).toString());
          localStorage.setItem('imprimeTicket', (suc.imprimeTicket ?? 1).toString());
          localStorage.removeItem('idCaja');
          localStorage.removeItem('caja');
          this.router.navigate(['/panel/dashboard']).then(() => {
            window.location.reload();
          });
        }
      });
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.clearSessionAndRedirect();
      },
      error: (err) => {
        console.error('Error al cerrar sesión en servidor:', err);
        this.clearSessionAndRedirect();
      }
    });
  }

  private clearSessionAndRedirect(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('idUsuario');
      localStorage.removeItem('idTipo');
      localStorage.removeItem('idSucursal');
      localStorage.removeItem('sucursal');
      localStorage.removeItem('manejaIva');
      localStorage.removeItem('imprimeTicket');
      localStorage.removeItem('idCaja');
      localStorage.removeItem('caja');
    }
    this.router.navigate(['/login']);
  }
}

