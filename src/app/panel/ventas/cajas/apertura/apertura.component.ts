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

  constructor(
    private cajaService: CajasService,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      let caja = localStorage.getItem('idCaja');
      if (caja) {
        try {
          const decryptedIdCaja = CryptoJS.AES.decrypt(caja, environment.secretKey).toString(CryptoJS.enc.Utf8);
          this.idCaja = parseInt(decryptedIdCaja);
          this.cajaService.verificarCajas(this.idCaja).subscribe({
            next: (data: any) => {
              if(data.success){
                Swal.fire({
                  icon: "success",
                  title: "Sesión actual "+localStorage.getItem('caja'),
                  showConfirmButton: false,
                  timer: 1500
                });
              }else{
                this.idCaja = 0;
                this.recuperarOSeleccionarCaja();
              }
            },
            error: () => {
              this.idCaja = 0;
              this.recuperarOSeleccionarCaja();
            },
          });
        } catch (e) {
          this.idCaja = 0;
          this.recuperarOSeleccionarCaja();
        }
      } else {
        this.recuperarOSeleccionarCaja();
      }
    }
  }

  recuperarOSeleccionarCaja(): void {
    const idSucursal = parseInt(localStorage.getItem('idSucursal') || '0');
    this.cajaService.getActiveSession(idSucursal).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          const encryptedIdCaja = CryptoJS.AES.encrypt(res.data.idCaja.toString(), environment.secretKey).toString();
          localStorage.setItem("idCaja", encryptedIdCaja);
          localStorage.setItem("caja", res.data.caja);
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
      error: () => {
        this.seleccionarCaja();
      }
    });
  }

  seleccionarCaja(){
      this.cajaService.getSucursalesByUsuario().subscribe({
        next: (data: any) => {
          if (data.success) {
            this.cajas = data.data
            document.getElementById('btnModalApCajas')?.click();
          }
        },
        error: () => {
          Swal.fire({
            icon: "error",
            title: "Error al consutar cajas",
            showConfirmButton: false,
            timer: 1500
          });
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
    this.cajaService.abrirCaja(this.efectivoCaja, this.idCaja).subscribe({
      next: (data: any) => {
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
            title: "Error al crear sesión",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      error: () => {
        Swal.fire({
          icon: "error",
          title: "Error al crear sesión",
          showConfirmButton: false,
          timer: 1500
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
