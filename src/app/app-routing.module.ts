import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { InicioComponent } from './panel/inicio/inicio.component';
import { VentasComponent } from './panel/ventas/ventas.component';
import { ProductosComponent } from './panel/inventarios/productos/productos.component';
import { SucursalesComponent } from './auth/sucursales/sucursales.component';
import { InventariosComponent } from './panel/inventarios/inventarios/inventarios.component';
import { ProveedoresComponent } from './panel/compras/proveedores/proveedores.component';
import { ComprasComponent } from './panel/compras/compras/compras.component';
import { EditarCompraComponent } from './panel/compras/compras/editar-compra/editar-compra.component';
import { VentasListaComponent } from './panel/ventas/ventas-lista/ventas-lista.component';
import { NuevaVentaComponent } from './panel/ventas/nueva-venta/nueva-venta.component';
import { ClientesComponent } from './panel/clientes/clientes.component';
import { PromocionesComponent } from './panel/promociones/promociones.component';
import { DashboardComponent } from './panel/dashboard/dashboard.component';

const routes: Routes = [
  {path: '',component: LoginComponent},
  {path: 'login',component: LoginComponent},
  {path: 'panel',component: InicioComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'productos', component: ProductosComponent},
      { path: 'inventarios', component: InventariosComponent},
      { path: 'proveedores', component: ProveedoresComponent},
      { path: 'compras', component: ComprasComponent},
      { path: 'compras/editar', component: EditarCompraComponent},
      { path: 'ventas', component: VentasListaComponent},
      { path: 'ventas/nueva', component: NuevaVentaComponent},
      { path: 'clientes', component: ClientesComponent },
      { path: 'promociones', component: PromocionesComponent }
    ]
  },
  {path: 'sucursales',component: SucursalesComponent},
  {path: 'ventas', component: VentasComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
