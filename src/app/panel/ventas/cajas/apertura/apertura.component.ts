import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CajasService } from '../../../../services/cajas.service';
import Swal from 'sweetalert2';
declare var bootstrap: any;
import CryptoJS from 'crypto-js'
import { environment } from '../../../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-apertura',
  templateUrl: './apertura.component.html',
  styleUrl: './apertura.component.css'
})
export class AperturaComponent implements OnInit {

  idCaja: any = null;
  cajas: any = null;
  efectivoCaja = 0;
  cargando: boolean = true;

  constructor(
    private cajaService: CajasService,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargando = true;
      const idSucursal = parseInt(localStorage.getItem('idSucursal') || '0');
      if (!idSucursal) {
        this.redirigirAlPanel('No se encontró una sucursal seleccionada.');
        return;
      }

      let caja = localStorage.getItem('idCaja');
      if (caja) {
        try {
          const decryptedIdCaja = CryptoJS.AES.decrypt(caja, environment.secretKey).toString(CryptoJS.enc.Utf8);
          this.idCaja = parseInt(decryptedIdCaja);
          if (!this.idCaja || isNaN(this.idCaja)) {
            localStorage.removeItem('idCaja');
            localStorage.removeItem('caja');
            this.idCaja = 0;
            this.recuperarOSeleccionarCaja();
            return;
          }

          this.cajaService.verificarCajas(this.idCaja).subscribe({
            next: (data: any) => {
              if (data && data.success) {
                this.cargando = false;
                Swal.fire({
                  icon: "success",
                  title: "Sesión actual " + (localStorage.getItem('caja') || ''),
                  showConfirmButton: false,
                  timer: 1500
                });
              } else {
                localStorage.removeItem('idCaja');
                localStorage.removeItem('caja');
                this.idCaja = 0;
                this.recuperarOSeleccionarCaja();
              }
            },
            error: (err: any) => {
              console.error('Error al verificar la sesión de caja:', err);
              this.redirigirAlPanel('No se pudo verificar el estado de la sesión de caja con el servidor.');
            }
          });
        } catch (e) {
          console.error('Error al desencriptar sesión de caja:', e);
          localStorage.removeItem('idCaja');
          localStorage.removeItem('caja');
          this.idCaja = 0;
          this.recuperarOSeleccionarCaja();
        }
      } else {
        this.recuperarOSeleccionarCaja();
      }
    }
  }

  redirigirAlPanel(mensaje: string = 'Ocurrió un error al leer la sesión de la caja.'): void {
    this.cargando = false;
    const modalElement = document.getElementById('aperturaModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }

    Swal.fire({
      icon: 'error',
      title: 'Error de Sesión de Caja',
      text: mensaje,
      confirmButtonText: 'Regresar al Panel de Inicio',
      confirmButtonColor: '#0d6efd',
      allowOutsideClick: false
    }).then(() => {
      this.router.navigate(['/panel/dashboard']);
    });
  }

  recuperarOSeleccionarCaja(): void {
    const idSucursal = parseInt(localStorage.getItem('idSucursal') || '0');
    if (!idSucursal) {
      this.redirigirAlPanel('No se encontró una sucursal seleccionada.');
      return;
    }

    this.cajaService.getActiveSession(idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          const encryptedIdCaja = CryptoJS.AES.encrypt(res.data.idCaja.toString(), environment.secretKey).toString();
          localStorage.setItem("idCaja", encryptedIdCaja);
          localStorage.setItem("caja", res.data.caja);
          this.cargando = false;
          Swal.fire({
            icon: "success",
            title: "Sesión recuperada: " + res.data.caja,
            showConfirmButton: false,
            timer: 1500
          });
          const modalElement = document.getElementById('aperturaModal');
          if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal?.hide();
          }
        } else {
          this.seleccionarCaja();
        }
      },
      error: (err: any) => {
        console.error('Error al recuperar sesión activa de caja:', err);
        this.redirigirAlPanel('Error al consultar la sesión activa de caja en el servidor.');
      }
    });
  }

  seleccionarCaja(){
      this.cajaService.getSucursalesByUsuario().subscribe({
        next: (data: any) => {
          if (data && data.success && Array.isArray(data.data)) {
            if (data.data.length === 0) {
              this.redirigirAlPanel('No hay cajas registradas o asignadas para esta sucursal.');
              return;
            }
            this.cajas = data.data;
            this.cargando = false;
            document.getElementById('btnModalApCajas')?.click();
          } else {
            this.redirigirAlPanel(data?.message || 'Error al obtener la lista de cajas de la sucursal.');
          }
        },
        error: (err: any) => {
          console.error('Error al consultar cajas:', err);
          this.redirigirAlPanel('Error al consultar las cajas disponibles en el servidor.');
        },
      });
  }

  cambiarCaja() {
    if (!this.idCaja || !this.cajas) {
      this.efectivoCaja = 0;
      return;
    }
    const cajaSeleccionada = this.cajas.find((caja: any) => caja.idCaja == this.idCaja);
    this.efectivoCaja = cajaSeleccionada ? cajaSeleccionada.efectivo : 0;
  }

  abrirCaja() {
    if (!this.idCaja) {
      Swal.fire('Atención', 'Por favor, selecciona una caja para abrir la sesión.', 'warning');
      return;
    }

    this.cargando = true;
    this.cajaService.abrirCaja(this.efectivoCaja, this.idCaja).subscribe({
      next: (data: any) => {
        this.cargando = false;
        if (data.success) {
          const encryptedIdCaja = CryptoJS.AES.encrypt(this.idCaja.toString(), environment.secretKey).toString();
          localStorage.setItem("idCaja", encryptedIdCaja);
          localStorage.setItem("caja", data.data.caja);
          Swal.fire({
            icon: "success",
            title: "Sesión creada",
            showConfirmButton: false,
            timer: 1500
          });
          const modalElement = document.getElementById('aperturaModal'); 
          const modal = bootstrap.Modal.getInstance(modalElement);
          modal.hide();
        }else{
          Swal.fire({
            icon: "error",
            title: data.message || "Error al crear sesión",
            showConfirmButton: true
          });
        }
      },
      error: (err: any) => {
        this.cargando = false;
        Swal.fire({
          icon: "error",
          title: err.error?.message || "Error al crear sesión",
          showConfirmButton: true
        });
      },
    });
  }
  irAlDash(): void {
    const modalElement = document.getElementById('aperturaModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
    this.router.navigate(['/panel/dashboard']);
  }
  logoutConfirm(): void {
    const modalElement = document.getElementById('aperturaModal');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }

    Swal.fire({
      title: '¿Cerrar sesión de usuario?',
      text: 'Se cerrará tu sesión actual en el sistema.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.logout();
      } else {
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      }
    });
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
      localStorage.removeItem('idCaja');
      localStorage.removeItem('caja');
    }
    this.router.navigate(['/login']);
  }

}
