import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit {

  formProd: FormGroup;
  precioProd: String = '$ 0' 

    productos = [
        { id: 1, name: 'Pollo completo' },
        { id: 2, name: 'Medio pollo' },
        { id: 3, name: 'Hamburgueza' }
    ];

  constructor(private fb: FormBuilder){
    this.formProd = this.fb.group({
      idProducto: [null, Validators.required],
      cantidad: [1, Validators.required],
      precio: [0, Validators.required],
    });
  }

  ngOnInit() {
    // Puedes suscribirte a cambios si es necesario
    this.formProd.get('idProducto')?.valueChanges.subscribe(valor => {
      console.log('Seleccionado:', valor);
    });
  }

}
