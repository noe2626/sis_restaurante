import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { InicioComponent } from './panel/inicio/inicio.component';
import { VentasComponent } from './panel/ventas/ventas.component';
import { ProductosComponent } from './panel/inventarios/productos/productos.component';
import { SucursalesComponent } from './auth/sucursales/sucursales.component';
import { PreciosComponent } from './panel/precios/precios.component';
import { InventariosComponent } from './panel/inventarios/inventarios/inventarios.component';

const routes: Routes = [
  {path: '',component: LoginComponent},
  {path: 'login',component: LoginComponent},
  {path: 'panel',component: InicioComponent,
    children: [
      { path: 'ventas', component: VentasComponent },
      { path: 'productos', component: ProductosComponent},
      { path: 'inventarios', component: InventariosComponent},
    ]
  },
  {path: 'sucursales',component: SucursalesComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
