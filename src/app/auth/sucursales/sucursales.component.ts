import { Component, OnInit } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SucursalesService } from '../../services/sucursales.service';
import { Router } from '@angular/router';
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
    if (isPlatformBrowser(this.platformId)) { 
      localStorage.setItem('idSucursal',this.idSucursal.toString());
      let sucursalObj = this.sucursales.find((item:any) => item.idSucursal == this.idSucursal);
      localStorage.setItem('sucursal',sucursalObj.sucursal);
    }
    const modalElement = document.getElementById('sucursalModal'); 
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
    this.router.navigate(['panel'])
  }

}
