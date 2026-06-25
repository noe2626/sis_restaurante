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
import { UsuariosComponent } from './panel/usuarios/usuarios.component';
import { SucursalesAdminComponent } from './panel/sucursales/sucursales.component';
import { CajasAdminComponent } from './panel/cajas/cajas.component';
import { SesionesCajaComponent } from './panel/sesiones-caja/sesiones-caja.component';
import { PreciosClienteComponent } from './panel/precios-cliente/precios-cliente.component';
import { CanalesVentaComponent } from './panel/canales-venta/canales-venta.component';
import { ReportesComponent } from './panel/reportes/reportes.component';
import { MermasComponent } from './panel/inventarios/mermas/mermas.component';
import { FabricacionesComponent } from './panel/inventarios/fabricaciones/fabricaciones.component';

// Guards
import { authGuard } from './guards/auth.guard';
import { loginGuard } from './guards/login.guard';
import { branchGuard } from './guards/branch.guard';
import { roleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: 'panel',
    component: InicioComponent,
    canActivate: [authGuard, branchGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [roleGuard], data: { roles: [1, 2, 3] } },
      { path: 'productos', component: ProductosComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'inventarios', component: InventariosComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'mermas', component: MermasComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'fabricaciones', component: FabricacionesComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'proveedores', component: ProveedoresComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'compras', component: ComprasComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'compras/editar', component: EditarCompraComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'ventas', component: VentasListaComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'ventas/nueva', component: NuevaVentaComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'clientes', component: ClientesComponent, canActivate: [roleGuard], data: { roles: [1, 2, 3] } },
      { path: 'promociones', component: PromocionesComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'precios-cliente', component: PreciosClienteComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'canales-venta', component: CanalesVentaComponent, canActivate: [roleGuard], data: { roles: [1] } },
      { path: 'reportes', component: ReportesComponent, canActivate: [roleGuard], data: { roles: [1, 2] } },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [roleGuard], data: { roles: [1] } },
      { path: 'sucursales', component: SucursalesAdminComponent, canActivate: [roleGuard], data: { roles: [1] } },
      { path: 'cajas', component: CajasAdminComponent, canActivate: [roleGuard], data: { roles: [1] } },
      { path: 'sesiones-caja', component: SesionesCajaComponent, canActivate: [roleGuard], data: { roles: [1, 2] } }
    ]
  },
  { path: 'sucursales', component: SucursalesComponent, canActivate: [authGuard] },
  { path: 'ventas', component: VentasComponent, canActivate: [authGuard, branchGuard], canActivateChild: [roleGuard], data: { roles: [1, 2, 3] } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
