import { Component, OnInit } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SucursalesService } from '../../services/sucursales.service';
import { Router } from '@angular/router';
import CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
declare var bootstrap: any;

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent implements OnInit{
  idSucursal:number = 0;
  sucursales: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router, 
    private sucursalesService: SucursalesService){}

  ngOnInit(): void {
    document.getElementById('btnModalSuc')?.click();
    this.sucursalesService.getSucursalesByUsuario().subscribe({
      next: (data:any) => {
        if (data.success) {
          this.sucursales=data.data
          this.idSucursal=this.sucursales[0].idSucursal;
        }
      },
      error: () => { alert("Error al cargar sucursales") },
    });
  }

  entrar(){
    let roleId = 0;
    if (isPlatformBrowser(this.platformId)) { 
      localStorage.setItem('idSucursal',this.idSucursal.toString());
      let sucursalObj = this.sucursales.find((item:any) => item.idSucursal == this.idSucursal);
      localStorage.setItem('sucursal',sucursalObj.sucursal);
      localStorage.setItem('manejaIva', (sucursalObj.manejaIva ?? 0).toString());
      localStorage.setItem('imprimeTicket', (sucursalObj.imprimeTicket ?? 1).toString());
      localStorage.setItem('bloqueoStock', sucursalObj.bloqueoStock || 'estricto');

      const encryptedIdTipo = localStorage.getItem('idTipo') || '';
      if (encryptedIdTipo) {
        try {
          roleId = parseInt(CryptoJS.AES.decrypt(encryptedIdTipo, environment.secretKey).toString(CryptoJS.enc.Utf8));
        } catch (e) {
          console.error('Error decrypting role in sucursales component:', e);
        }
      }
    }
    const modalElement = document.getElementById('sucursalModal'); 
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();

    if (roleId === 3) {
      this.router.navigate(['ventas']);
    } else {
      this.router.navigate(['panel']);
    }
  }

}
