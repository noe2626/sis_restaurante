import { Component, OnInit } from '@angular/core';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.component.html',
  styleUrl: './sucursales.component.css'
})
export class SucursalesComponent implements OnInit{

  constructor(@Inject(PLATFORM_ID) private platformId: Object){

  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) { 
      document.getElementById('btnModalSuc')?.click();
    }
  }

}
