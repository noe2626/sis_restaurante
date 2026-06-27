import { Injectable } from '@angular/core';

export interface TicketItem {
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  promocion?: string;
}

export interface TicketData {
  folio: string;
  fecha: string;
  cliente: string;
  cajero: string;
  canal: string;
  metodo_pago: string;
  subtotal: number;
  descuentos: number;
  extras: number;
  iva: number;
  total: number;
  pago?: number | null;
  cambio?: number | null;
  canal_costo_tercero?: number | null;
  canal_cargo_cliente?: number | null;
  descuenta_caja?: boolean | null;
  notas?: string;
  productos: TicketItem[];
}

@Injectable({
  providedIn: 'root'
})
export class PrintService {

  constructor() { }

  imprimirTicket(ticketData: TicketData): void {
    // 1. Create or get the hidden iframe
    let iframe = document.getElementById('print-ticket-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-ticket-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.error('No se pudo obtener el documento del iframe de impresión.');
      return;
    }

    // 2. Build the HTML content
    const sucursalNombre = localStorage.getItem('sucursal') || 'ROJO VIVO';
    const sucursalDireccion = localStorage.getItem('direccionSucursal') || '';

    // Format items rows
    let itemsHtml = '';
    ticketData.productos.forEach(p => {
      itemsHtml += `
        <div style="margin-bottom: 4px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <div style="flex: 1; padding-right: 6px; text-transform: uppercase;">
              ${p.cantidad} x ${p.nombre}
            </div>
            <div style="text-align: right; white-space: nowrap;">
              $${Number(p.total).toFixed(2)}
            </div>
          </div>
        </div>
      `;
    });

    const subtotal = Number(ticketData.subtotal).toFixed(2);
    const descuentos = Number(ticketData.descuentos).toFixed(2);
    const extras = Number(ticketData.extras).toFixed(2);
    const iva = Number(ticketData.iva).toFixed(2);
    const total = Number(ticketData.total).toFixed(2);
    const pago = ticketData.pago != null ? Number(ticketData.pago).toFixed(2) : null;
    const cambio = ticketData.cambio != null ? Number(ticketData.cambio).toFixed(2) : null;

    const fechaFormateada = this.formatDate(ticketData.fecha);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket ${ticketData.folio}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            width: 170px; /* Ancho de 170px sin padding izquierdo para compensar el margen físico del rodillo de la impresora */
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 2px 2px 2px 0px;
            color: #000;
            background-color: #fff;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: none;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .header {
            margin-bottom: 6px;
          }
          .header .brand {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header .sucursal {
            font-size: 11px;
            font-weight: bold;
            margin-top: 2px;
          }
          .header .direccion {
            font-size: 9px;
            margin-top: 2px;
          }
          .info-section {
            font-size: 10px;
            line-height: 1.3;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 2px;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 12px;
          }
          .footer {
            font-size: 9px;
            margin-top: 12px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="logo-container" style="margin-bottom: 4px;">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAB6pSURBVHhe7dXbkqS4si3Q/v+f3sdq9cnqqFkIJG4BrjHM5kOCS0QKIf/n/wCA1/snLwAA76OhA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoAFKChA0ABGjoU888///wVoD5fOhSTzXxvQ885WgGewdcIxWTDHW28Oa43wHf5CuEi2fAyV8nnjDwvx+wJ8B2+PjhRNreenC3n731O1h8JcD9fHpwkm9pozpLz9syftWcEuJevDg7KRnYkZ8g5e+bO2sySrMkA9/LVwQHZxM7IUTnf1rxZ1zPmU44ZHb/l7PmgKl8IHJANLLMkazJH5Xxb82bdVv2SHLtnjpac86x5oRpfBuyUTWa04eSY0fEtOdfanFmzVd+SY/fOsyTnO2teqMZXwfT2NodsMKONJsftmWNJzrU2Z9as1W7JOY7M9SnnO2teqMZXwXSyMWR65JjR8T9y7N55PuU8a/NlzVrtlpzjyFyfcr6z5oVqfBVMIZvBVrZkfe+4JTnHkbl+yXnW5suatdotOceRuT7lfGfNC9X4Kigtm8BI1mRtz5iWnOPIXL/kPK358v5abY+c48hcn3K+s+aFanwVlJSH/960ZN1W/Zqc46r5Ut5fq+2RcxyZ61POt2feI2PhLexsyshD+4y0ZN1W/Zqc46r5Ut5v1fXKeY7O9yPnG503x+2ZA97Ajub18pDuSe/4lqzbqt+S8xyZL+dozZX312p75BxH5vqU843Mm2MyUIkdzevlIb2WlqzbGpM1a7U9cp4j8+Ucrbny/lrtlhx/ZK6U843Mm2NGx8Ob2NWUkIf1noM7x62Nz5q12h45T86X1/P+p6w5q3ZNjt87z5Kcs3furO8Zu3YPns7upYQ8sHsO75Tj1sZmXc+YNTlHzpXX8/6nrDmrdk2O3zvPkpyzZ+6s7RnXWwdPZddSRh7IIwdzjukZm7U9Y5bk+KW58nre/5Q1e2pb9Uty3J451uScW3NnXaYl67bq4WnsVsrIg7j3QM763rFZ2zsu5dilOfLe0bpPWdcz5kfWj4ztlfOuzZ81mZas6xkDT2O3UkYexFuHctZktmT9yNgfOW5tjrw/kjVZu5SU95dylpy3NX/ez6zJ2rUxrevwbXYmpeSBnAdzXm+lV44bmSPrMynvj2RL1h/NmXLu1jPy/lrtp6xdG7d2D77NrqSUPJD3pleOW8qSrMm0ZF1PeuW4vTlbzr/0nLzXqktZuzUua1p18A12I+XkgXskPXLM0WzJ+rWMyvGjuUI+I5+V15dqWrJ+a2zWrNXC3exEysnD9oxsyfoj6ZFjMkflfD25Sj7n83l5Le+vyfqesVm3VQ93shMpJw/bs7Il60fzRPkbl3K1fF5vtmT91tis2aqHu9mJlJQH7tbhmzVrWZO1vaEt16onW7K+Z2zWbdXD3exGSspDt+cAzrq1bMn6pdAn120rPXJMz/is26qHu9mNlJUHb+8BnPVr4Xq55mvpkWN6x2dtzxi4k91IWXnwjhzCWb8WrpXr3UqvHNczPmt7xsDd7EjKysN3z0Gc4zJcL9d8Kb1yXO8cWdszBu5mR3KJpxx4eQDv+V1HxnJcrn9mRI7tnSPre8d92jsOetlZnCoPvG8fXvlbnvK76JfvLdMrx/XOkbW94z7luJGx0Muu4jR5YD3l8Mrf8oTfxJh8d3veYY7tnSPre8f9kmOWAmexmzhNHlRPObTytzzld7HPnneX731kD2T90XEZOIvdxKnysHrKwZW/5Qm/ifvkex95/zmmZ2zWLgXOZldxqjy0Mt+Sv+Pbv4f75Dsfef9ZvzU2a1qBK9hZnC4PryccZPk7vvlbuFe+95H3n2PWxmZNK3AVu4tL5CH2hAPtm8/mO3Lvje7DHNMam/eXAlezy7hMHmgON+6W+250/+W4HJ/XW4E72GlcJg+1DNxlz97LMTk2r7cCd7HbuFQebmccdEfHM6+RfZP79XPf5bWl7HFkLNg5XC4Pur2HXo4dHQ8jcq+NpFeOawV62ClcLg+nTI8cMzoeRuU+60mvHNcbWGOHcIs8mHoPqaxdCpwt91hPeuW40UCL3cFf8gA56xDJObfmz5qlwBVyn22lV47bG1hiZ/CHPDgyR+V8rbnzXgaulPutlRE59mgg2RX8lgfGWvbKefYErpZ7bikjcmwrKe9n4JMdwW95WPRmVI4fCdwp99+ePZjjl7Ima3vHMR87gt/ysBjNiBy7FfiWI/sw9/FSeuW40fHUZzfwWx4Ue9Mjx6wF3ir3cmZEjt0zB7XZDfwhD4ujWZO1GXiz3M+ZPXKOI3NRj53AH/Kg+Dww8tpIWrJuqx7eIvf0Gfs75zk6H7XYCfwlD4ulQyPv9Sbl/aUaeKPc12fs75zrjDmpw07gL3lYrB0aWTOSnAMqyf1+xj7Puc6YkzrsBP6Sh0XPwZF1I4GKcp+fsd9zrjPmpA47gUV5YKwdHFkzEqgq9/rR/Z5znTUvddgJLMoDo3V45L2RwFNcsR9zvx99Rs51xpzUYjfQlAdHHiB5fammVQdPcsWezD1/ZO/nHEfnoya7gaY8OHrTsnUfvuGqfZnfxd7n5PgM/LAbWJWHx1bgba7cu/l9jD4rx2Xgkx3BqjxA1kJ9Fd/1lf9TfiMj30vWLwU+2RFsykNkKdSV77rS+77jf8q123pm1rQCya5gUx4kGWrK91zxfd/xf+X6nRFYYmewKQ8TB0t9+Z4rvu87/7d81pFAi91BlzxUHC615Xuu+L7v/t/yeXsCa+wQuuTB4pCpK99vxXed/9ed/1s+tzewxS6hWx4wDpqa8v1We8/5f33j/8tnrwV62S10y4PGoVNTvttq7zj/r2//b/lbvv17eC87hyF58DiAasn3Wu0d5/9U6X8DO5kheRA6EOvJd1vlHef/U+l/g1/sZIbkQegwrCffb4X3nP9LBiqwkxnmIKwtm93b33X+H0uBCuxkhjkEa8tm9+b3nf9DK1CBnQz8IZvdW5te/v5WoAq7Gfgtm91bG1/+9rVAFXYz8Fs2uzc2vvzdW4Eq7Gbgt2x2b2t8+Zu3ApXY0cBv2fDe1Pzy9/YEKrGjgf/JZpd5svytPYFq7Grgf7LhvaX55W/tDVRjVwN/Nbs3Nb78vT2Biuxs4K+G95bml7+1J1CV3Q2Ty4Z3V+M7+qz8vT2ByuxwmFg2vKsbXz7nyLNynrXADOx0mNRdTS+fk9kr52kFZmG3A5fIxrqUvXKepcBs7HrgVNlYWzki58rAjOx84DTZWNdyRM511rzwZnY/cFg21a0clfOdNS+8mS8AOCSb6lbOkHOeNS+8ma8A2C2bak/OcMWc8Ha+BGCXbKo9OcsVc8Lb+RqAIdmkR3KmK+aEN/M1AEOySffmbFfMCW/miwC6ZZPuDXA9XxoUcmXzzCY9EuB6vjQo5KoGmg16JMA9fG1QxFVNNBv0aIB7+NqgiKuaaDbokQD38cVBEVc00mzQowHu44uDArKRntFMc749Ae7ji4MCspGe0UxzvtEA9/LVwctlIz2joeZcewLcy1cHL5eN9IyGmnONBrifLw8ucldjy2Z6tLHmHHvydG/4jTDKroYL3NXYspFm9sg59uSp3vAbYS+7Gi5wR+PIJrqUUTl+b57m6b8PzmBnwwXuaB7ZpJYyKsfvydM8/ffBWexuOFk2kCuaSM7fyqgcvydP8uTfBmezw+Fk2USuaCQ5fyujcvyePEH+pif9NriKHQ4nyyZydiPJudcyIsfuzbfl73nK74Kr2eVwomwiVzSUnHctI3Ls3nxT/pan/C64g10OJ8omcnZDyTm3MiLH7s235O94wm+CO9npcKJsJGc3lZxzKyNy7N58Q/6GDMzAToeTZBPJHJXz9aRXjjuSb8jf8O3fA99gt8NJspFkjsi5etMrxx3J3fL5GZiF3Q4nyCbSyh45x0h65bijuUs+dykwC7sdTpBNpJU9co6R9MpxR3OHfOZSYCZ2PJwgG0kro3L8SHrluDNyh3zmUmAmdjwclE1kLSNy7Gh65bizcqV8ViswEzseDsomspYROXY0PXLMmblSPqsVmIkdDwdkA9lKrxy3Jz1yzJm5Uj5rKTAbux4OyCaylR45Zk965bgzc5V8TiswG7sedsoG0pMtWb83PXLM2blKPqcVmI1dDztlA+nJmqzdm1457opcIZ/RCszGroedsoFsZU3WHkmPHHNVrpDPaAVmY9fDDtk8etKSdUfSK8ddlSvkM1qB2dj1sEM2j54syZqj6ZFjrswV8hmtwGzsehiUjaM3Ke8fTY8cc3WukM9YC8zEjodB2TR6c8Yca9mS9XfkCvmMtcBM7HgYkA1jJGfM0UqPHHNHrpDPWAvMxI6HAdkwenN0/Fp65Ji7coV8xlpgJnY8dMpm8ZSsydq7c4V8xlpgJnY8dMhG8ZS0ZN23coV8RiswG7seOmSzkO1cJZ/TCszGrocN2SikL1fJ57QCs7HrYUM2CunLVfI5rcBs7HpYkU1C+nKVfE4rMCM7HxqySUh/rpLPaQVmZOdDQzYJ6cuV8llLgVnZ/bAgm4T05yr5nKXAzHwBELJJSH+ulM9aCszMFwAfskFIf66Wz8vA7HwF8CGbhPTlavm8O58Nb+FrgP8vG4Vs5y753LufD2/gi4CVhiHt3CWfe/fz4S18FUwvG4Ws527ffj68ha+DqWWzkHa+4dvPhzfxlTCtbFjyd4D38MUypWxc0g7wDr5WppMNS/oDPJcvlKlkg5J9AZ7Hl8k0sinJOQGewdfINLIRybkBvstXyBSy+ch1Ab7D10d52XDkngD38tVRWjYZuT/APXxtlJbN5c15+/8DXMtXRmnZVN6WlPffGOAavi7KykbyprRk3ZsDnMtXRVnZQJ6eHjmmQoBz+JooKxvHU9Mrx1ULcIyviLKyYTwpe+QcFQPs5wuitGwY385eOU/1AON8OZSWjeIbOSrnmyXAGF8N5WWjuCtnyXlnC9DH18IUsklclbPl/LMG2OZLYSrZKM7KFfIZcs06QxW+EKaUjWJPrpLPkT8DLPN1MKVsEntyhXyGtAP8yVfBVLIpXJleOU76A/zHF0F52QSkVoB/+RooKw9+qR2Yna+AcvKgl3kCM/MFUEoe8DJfYFZ2PyXkoS5zB2Zk5/N6eZiL/ArMxq7ntfIAF8nATOx4XikPbpFWYBZ2O6+TB7bIVmAGdjqvkge1SG+gOruc18gDWmQ0UJkdzivkwSyyN1CV3c3j5YEscjRQkZ3N4+VhLHJGoBq7mkfLQ1jkzEAldjSPlYevyBWBKuxmHisPXpGrAhXYyTxSHrgiVwYqsJN5pDxwRa4OvJ1dzCPlYStyR+DN7GAeJw9ZkTsDb2X38jh5wF6RNVkrcwXeyu7lcfKAPZojci6ZI/BGdi6Pkgfr3pwp5/5mnvZ7Kgfexq7lUfJQ7c3V8nnfytN+T+XA29i1PEoeqlu5Uz77G3nSb5kh8CZ2LI+SB2or35C/4e486bfMFHgLu5VHycM08035W+7Ok37LTIG3sFt5jDxIn3So5u/5RlLel+sCb2Cn8hh5iD7pIM3f9Y2kvC/XBd7ATuUxnnyI5m+7O0uyRq4NPJ1dymM8+eDMw/3uLMkauTbwdHYpbMiD/RtZkjVyfeDJ7FDYkIf6N7Ika+T6wJPZobAiD/RvpCXr5J7AU9mdsCIP82+kJevknsBT2Z2wIg/zb6Ql6+S+wBPZmdCQh/g3siZr5b7AE9mZ0JCH+DeyJmvl3sDT2JXQkAf4N7Ima+XewNPYlbAgD+9vZEvWy/2BJ7EjYUEe3N/IlqyX+wNPYkfCgjy4706PHCP3B57EjoQFeXDfnR45Ru4PPIkdCSEP7bvTK8fJdwJPYTdCyAP77vTIMfK9wFPYjRDywL4zvXKcfC/wFHYjhDyw70yvHCffDTyBnQghD+u7MiLHSl9G5Ni1wBPYiRDysL4rvXKcLOdsOf+Vz4I97EQIeVjfkRE5VpZzpTufBb3sRAh5WF+dUTlelnOHu58Ha+xCWJDN4cqMyLHSzl3ufh602IWwIJvDVRmV46UdmI1dDwuyOVyRPXIOaQdmY9dDQzaIM7NHziHrgdnY9bAim8QZ2SvnkfXAbOx66JDNYm/2ynlkOzAbux46ZcMYyVE5n2wHZmPXww7ZPNZyVM4nfYHZ2PXwcNmoZDswIzsfHiwblfQFZmTnT8SB9y7ZpKQ//Ld/mIe3PYE87Hzk75DvTPrC8t6hPm+5sPygMzxXvivpD+v7h7q83aLyI14Kz5TvScbCv3JdrFF93mwx+eHmR7x0jefI9yNj4W+5RtarLm+0iPxQM61aniXfm4yFtlwr61aPN/ly+WEuJW3d5zvyvch42JZrZu3q8BZfLD/IVpZs3ede+c5kPPTLtbOONXh7L5Yf4ufH2Lree5/75LuQfZlZrsWR8F7e3sutfYitD7V1nfvlu5B9mV2ux5HwXt7ey619gPmhtsL35LuQ8cwu1+NIeDdvsLj8YJfC9+S7kPGwvo+Yh7c9gfzAfezPke9DxsJ/cm2s03y86Un4wJ8p34uMhb/lGlmveXjDk8oP3Uf/Hbn20h/W5XpZu/q82Qnlx90K18s1PzNXz//tzCzXYm1d8n6rjvfzVieTH/VWuFau91m54xnfzMxyLVrpHUMd3uYk8iNe+qDzuo/9erneZ2RJ1rw5M8u12Eraus+7eaOTyA957WPureO4XOszsiRr3pxZ5Tp8rkVeX6r5tHaP9/JGJ5AfeM+HPFLLfvlejmZN1r4xs+pdh6zbqqcWb3oCez7uPWMYl+t8JD1yzJsys9G1GK2nBm96Ans+bAfC9XKN92ZEjn1LZje6Frl+veN4N295Ans+aofB9XKN92SPnOMNmdnetdg7jvfyliew56N2GFwr13dP9sp5nh58w/Txlicw+lE7CK6Xazyao3K+p4Z/7VmXPWN4N295AiMfdtZm/dI1xuT6juYMOecTw3/2rM1oPe/nTU9i60DI+0t1a/fol+vYmzPl3E8Mf8r1WVuj3jpq8aYnkh/5VnrGMibXrzdXyGc8KTNrrUOu0VJNq445eNMTyY98LT3jGJPr15ur5HOeklnlOiytR97rCfPwtieUH3xmq5Z9ch23crV83hMyq1yHzEhtaxz1eeMT2/rw83Bo1bEt13Erd8nnfjOzynVYypKsyTAfb51FeTg4IPbLdVzL3fL538qsch0+12Lp+tJaZQ3zsgP4Qx4iDopjch1b+Zb8Hd/IzLbWIu+v1YJdwW95YDg4jsl1bOXb8vfcnVltrUPeXwp8siP4nzwojhwYR8ZWkeu4lKfI33VnZrW1Dnm/FfhkR/DXIXHksDhjjrfLNcg8Tf6+uzKzXItcj9a9vJ7jmJvdwP+ccUjkHHvneav83zNPlb/zjtC/7mnrPvOyG/jtyEGRY0fHv13+729ah/y9V4f/5NpklvTUMCe7gT/sOSxyTO+4KvJ/f9sa5O++MrNaW4e8t1Tzo6eGedkR/GX00BitryT/9zf+//n7r8qMcg1a65H38n5vDXOzI1jUe3Bk3VptJZX+5/xfrsiMcg2W0lPfug/JrmBRHh5LB0jeX6qppuL/m//T2ZlRrkErKe+3AkvsDJrWDpG8l/crqvy/5rs8KzPKNch1WLu3dD8DLXYHq5YOkTxg8n5F1f/HfJ9nZEa5BkvrsHX/l6xZq4UfdghD8oBxyNSQ7/RIZpXr0FqLrfs/euaCT3YJ3fKA2XvI5BxH5+O4fA9HMqNcg9Y69NSk3jqwU+iWh9HoQZNjW+F++Q72Zma5Frkeea8V2MvuYUgePr0HUI7ZCvfK9R8N/8p1+VmbvNYbGGHHMCwPnZ6DJ+tzTN7L+1wr134k/CnX50hghB3DLnnwrB0+WTdSy/VyzUcym97/O9dpbVzWtOpgi53DbnkILR1EeX+p5tNILefINe/NTPJ/7/n/s753DOxl93BIHlh5IK3daxmt55h8Rz2ZTf7/PWuRdWu1cAY7jMPWDq21ey2j9RyT72grM8o1yLRk3VotHGV3cZo8rPYeZHvGsF++p7XMKtehlSVZ06qDo+wsLrPnEFsbk/fyPvvkmrYys6W1yGtr65Q1rTo4wq7iMnsOsNaYvJ5hv1zLDP9aWpNcq6WaVi2cza7iUiOHWKs2r7fCPrmO1nTZ2trkva06uIKdxaXWDrdPWfdZ23t9bX7acg1nWcv8f7f+97WavJeBO9hpXC4Pt56sje+9x7Zcv1nWMf/fpaSl+3ltLXA1u4xb5OG2lnT0Pm25dtXXL//XVlqyLtOqgzvYadwmD7mlLMmarFu7x7rZ1m1rryxd+5Tj1+b6pXUdrmC3cbs8CPPQy79/rmVa9+g305qdsU9yjr3zwBXsRh6ndVjmQbp0n35La1jZ2t7pdcYccBU7ksdZOzTzXt6HlrP2zRlzwBXsSB5n68A862D+5cy5eLa97zpr984DV7MbeZyeA7OnZkvOcWQunm/0PbfqW9fh2+xGHqfnwOypWZPjj8zFO4y+51b90jV4AjuSR8rDtHWg7jlUc3yGZznzvYy867Xa/BuewK7ksfJAbWVEjl3Klp4azjH6brbkfGtz9tbBU9ilPFoeqpkROfZn/NK1JVnXM4ZjrljnnHNp3q378ER2Kq+QB+zoIZtjP8e3rn/KmlYY07NuZ69xztcTeAM7lSmsHdBr935kzVrYlmu2tm69dSNyzlbgTexYystDOg/qtXtn3OdvuWZr69Zbt0fOfdVz4A52LaXlIZ1Zqklb93/Zuv+jZ64Z5DpsrUdvHczMl0FZ2QR6k/L+Vk1LzrFV/yT5m4/87pwns6SnBmbny6CkbAA/TSCvLWVJ1izVLl37lGP31veMXbJnbI5Zyqgcv5QlPTUwM18F5eTB3zr8s2at9pes26r/lGN6xmfdWtZkbaYl69YyYmns0rXUUwMz81VQWs/BP9IosvbKcVm3lZT3t7I1tudej9bY1vXe+z96aqAiO57ptRrF0rWle62aH0t1+XdaGrN2v7fmpy6v5Ryt65+27re05s7rS/O27uf1vA8zsOOZXqsJLF37lOOW6lr3W9d77/9o1bWup1Zd6/oZ1ubOez331wIzseOZXqsJtK5/2qpp3W9d773/o1XXur5kqTavZY7IubayZyzMyM5neq1m0Lr+aa1m772e+z+W6paurWnV5/W1jMixPekdDzPzBUBDNouebI1t3U9b938s1S1dW7NWn/fW0ivHZVo1rfHAv3wNsCKbx1r2jsuxS+NbluqWrq3pqc+apfTIMWtjs6ZVB/zLFwIdsrFkRmpbWZujZalu6dqa0fofOa5n7JF6YJ2vBAZkQ1pqNK37eT3TM0daqlu6tma0/tPo2NF6oJ8vCk400rDWatfufVqqW7q2plW/dC21xraM1gP9fFFwopGGtVbbuv6pd3ze+5R1n7Wt6637SzVptB7o54uCL1lrbnmvJ1vjl6zV5L2t9OitA8b5uuCLlhpiNsqeLMmanqS8vxbgu3yF8GXZFLNRbqUl67bSknUZ4Bl8jfAC2URHGmmOWwrwfr5kmIgGDnX5sgGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAArQ0AGgAA0dAAr4f0AVMydosp7iAAAAAElFTkSuQmCC" alt="Logo" style="max-width: 168px; height: auto; display: inline-block;" />
          </div>
          <div class="sucursal">${sucursalNombre}</div>
          ${sucursalDireccion ? `<div class="direccion">${sucursalDireccion}</div>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div><strong>Folio:</strong> ${ticketData.folio}</div>
          <div><strong>Fecha:</strong> ${fechaFormateada}</div>
          <div><strong>Cliente:</strong> ${ticketData.cliente}</div>
          <div><strong>Cajero:</strong> ${ticketData.cajero}</div>
          <div><strong>Canal:</strong> ${ticketData.canal}</div>
          <div><strong>Método Pago:</strong> ${ticketData.metodo_pago.toUpperCase()}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="items-section">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin-bottom: 6px;">
            <div>CANT. DESCRIPCIÓN</div>
            <div>TOTAL</div>
          </div>
          ${itemsHtml}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals-section">
          <div class="total-row">
            <div>Subtotal:</div>
            <div>$${subtotal}</div>
          </div>
          ${Number(descuentos) > 0 ? `
          <div class="total-row">
            <div>Descuento:</div>
            <div>-$${descuentos}</div>
          </div>
          ` : ''}
          ${Number(extras) > 0 ? `
          <div class="total-row">
            <div>Cargos/Envío:</div>
            <div>$${extras}</div>
          </div>
          ` : ''}
          ${Number(iva) > 0 ? `
          <div class="total-row">
            <div>IVA (16%):</div>
            <div>$${iva}</div>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="total-row grand-total">
            <div>TOTAL:</div>
            <div>$${total}</div>
          </div>
          ${pago != null && Number(pago) > 0 ? `
          <div class="divider" style="border-top: none; margin: 4px 0;"></div>
          <div class="total-row">
            <div>Recibido:</div>
            <div>$${pago}</div>
          </div>
          <div class="total-row">
            <div>Cambio:</div>
            <div>$${cambio}</div>
          </div>
          ` : ''}
        </div>
        
        ${ticketData.notas ? `
          <div class="divider"></div>
          <div style="font-size: 10px; margin-top: 4px; padding: 4px; border: 1px dashed #000; font-family: Arial, Helvetica, sans-serif; font-weight: bold; text-transform: uppercase;">
            NOTAS: ${ticketData.notas}
          </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="footer text-center">
          <div>¡Gracias por su preferencia!</div>
          <div>Vuelve pronto</div>
        </div>
      </body>
      </html>
    `;

    // 3. Check if running in Electron for silent printing
    const win = window as any;
    if (win.electronAPI && win.electronAPI.printSilent) {
      win.electronAPI.printSilent(htmlContent);
      return;
    }

    // Write HTML to iframe and trigger browser print (fallback)
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give a short delay for resources to render, then trigger browser print
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 250);
  }

  imprimirTicketCanal(ticketData: TicketData): void {
    // 1. Create or get the hidden iframe
    let iframe = document.getElementById('print-ticket-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-ticket-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.error('No se pudo obtener el documento del iframe de impresión.');
      return;
    }

    const sucursalNombre = localStorage.getItem('sucursal') || 'ROJO VIVO';

    // Format items rows
    let itemsHtml = '';
    ticketData.productos.forEach(p => {
      itemsHtml += `
        <div style="margin-bottom: 4px; font-size: 10px; font-family: Arial, Helvetica, sans-serif;">
          <div style="display: flex; justify-content: space-between;">
            <div style="flex: 1; padding-right: 6px; text-transform: uppercase;">
              ${p.cantidad} x ${p.nombre}
            </div>
            <div style="text-align: right; white-space: nowrap;">
              $${Number(p.total).toFixed(2)}
            </div>
          </div>
        </div>
      `;
    });

    const subtotal = Number(ticketData.subtotal).toFixed(2);
    const descuentos = Number(ticketData.descuentos).toFixed(2);
    const extras = Number(ticketData.extras).toFixed(2);
    const iva = Number(ticketData.iva).toFixed(2);
    const total = Number(ticketData.total).toFixed(2);
    const costoTercero = Number(ticketData.canal_costo_tercero || 0).toFixed(2);
    const netoRestaurante = Number(ticketData.total - (ticketData.canal_costo_tercero || 0)).toFixed(2);
    const descuentaCajaText = ticketData.descuenta_caja ? 'SÍ' : 'NO';

    const fechaFormateada = this.formatDate(ticketData.fecha);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Canal ${ticketData.folio}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            width: 170px;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 2px 2px 2px 0px;
            color: #000;
            background-color: #fff;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: none;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .divider {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .header {
            margin-bottom: 6px;
          }
          .header .title {
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #000;
            padding: 2px;
            margin-bottom: 4px;
          }
          .header .sucursal {
            font-size: 10px;
            font-weight: bold;
          }
          .info-section {
            font-size: 10px;
            line-height: 1.3;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 2px;
          }
          .total-row.highlight {
            font-weight: bold;
            font-size: 11px;
          }
          .total-row.grand-total {
            font-weight: bold;
            font-size: 12px;
          }
          .footer {
            font-size: 9px;
            margin-top: 10px;
            text-transform: uppercase;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="title">CONTROL DE CANAL</div>
          <div class="sucursal">${sucursalNombre}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
          <div><strong>Folio:</strong> ${ticketData.folio}</div>
          <div><strong>Fecha:</strong> ${fechaFormateada}</div>
          <div><strong>Canal:</strong> ${ticketData.canal.toUpperCase()}</div>
          <div><strong>Cajero:</strong> ${ticketData.cajero}</div>
          <div><strong>Cliente:</strong> ${ticketData.cliente}</div>
          <div><strong>Método Pago:</strong> ${ticketData.metodo_pago.toUpperCase()}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="items-section">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin-bottom: 6px;">
            <div>CANT. DESCRIPCIÓN</div>
            <div>TOTAL</div>
          </div>
          ${itemsHtml}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals-section">
          <div class="total-row">
            <div>Subtotal Venta:</div>
            <div>$${subtotal}</div>
          </div>
          ${Number(descuentos) > 0 ? `
          <div class="total-row">
            <div>Descuento:</div>
            <div>-$${descuentos}</div>
          </div>
          ` : ''}
          ${Number(extras) > 0 ? `
          <div class="total-row">
            <div>Envío/Cargo:</div>
            <div>$${extras}</div>
          </div>
          ` : ''}
          ${Number(iva) > 0 ? `
          <div class="total-row">
            <div>IVA (16%):</div>
            <div>$${iva}</div>
          </div>
          ` : ''}
          <div class="total-row highlight">
            <div>TOTAL COBRADO:</div>
            <div>$${total}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="total-row">
            <div>Comisión Canal:</div>
            <div>-$${costoTercero}</div>
          </div>
          <div class="total-row grand-total">
            <div>NETO RESTAURANTE:</div>
            <div>$${netoRestaurante}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="total-row">
            <div>Descuenta Caja:</div>
            <div>${descuentaCajaText}</div>
          </div>
        </div>
        
        ${ticketData.notas ? `
          <div class="divider"></div>
          <div style="font-size: 10px; margin-top: 4px; padding: 4px; border: 1px dashed #000; font-family: Arial, Helvetica, sans-serif; font-weight: bold; text-transform: uppercase;">
            NOTAS: ${ticketData.notas}
          </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="footer text-center">
          * TICKET DE RECONCILIACIÓN *
        </div>
      </body>
      </html>
    `;

    // 3. Check if running in Electron for silent printing
    const win = window as any;
    if (win.electronAPI && win.electronAPI.printSilent) {
      win.electronAPI.printSilent(htmlContent);
      return;
    }

    // Write HTML to iframe and trigger browser print (fallback)
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give a short delay for resources to render, then trigger browser print
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 250);
  }

  imprimirComanda(ticketData: TicketData): void {
    // 1. Create or get the hidden iframe
    let iframe = document.getElementById('print-ticket-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-ticket-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      console.error('No se pudo obtener el documento del iframe de impresión.');
      return;
    }

    // Format items rows
    let itemsHtml = '';
    ticketData.productos.forEach(p => {
      itemsHtml += `
        <div style="margin-bottom: 6px; font-size: 14px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
          <span style="font-size: 18px; padding-right: 8px;">${p.cantidad}</span> x <span style="text-transform: uppercase;">${p.nombre}</span>
          ${p.promocion ? `<div style="font-size: 10px; font-weight: normal; margin-left: 28px; color: #555;">Promo: ${p.promocion}</div>` : ''}
        </div>
      `;
    });

    const fechaFormateada = this.formatDate(ticketData.fecha);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comanda ${ticketData.folio}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            width: 170px;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 2px 2px 2px 0px;
            color: #000;
            background-color: #fff;
            -webkit-font-smoothing: none;
            -moz-osx-font-smoothing: none;
          }
          .text-center { text-align: center; }
          .divider {
            border-top: 2px solid #000;
            margin: 6px 0;
          }
          .header {
            margin-bottom: 6px;
          }
          .header .title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 2px solid #000;
            padding: 4px;
            margin-bottom: 4px;
          }
          .info-section {
            font-size: 10px;
            line-height: 1.3;
          }
          .items-section {
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header text-center">
          <div class="title">COMANDA</div>
        </div>
        
        <div class="info-section">
          <div><strong>Folio:</strong> ${ticketData.folio}</div>
          <div><strong>Fecha:</strong> ${fechaFormateada}</div>
          <div><strong>Cliente:</strong> ${ticketData.cliente}</div>
          <div><strong>Cajero:</strong> ${ticketData.cajero}</div>
          <div><strong>Canal:</strong> ${ticketData.canal}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="items-section">
          ${itemsHtml}
        </div>
        
        <div class="divider"></div>
        
        ${ticketData.notas ? `
          <div style="font-size: 12px; margin-top: 6px; border: 2px solid #000; padding: 6px; background-color: #fff; font-family: Arial, Helvetica, sans-serif; font-weight: bold; text-transform: uppercase;">
            NOTAS: ${ticketData.notas}
          </div>
          <div class="divider"></div>
        ` : ''}
        
        <div style="font-size: 10px; text-align: center; font-weight: bold; margin-top: 6px;">
          *** FINAL DE COMANDA ***
        </div>
      </body>
      </html>
    `;

    // 3. Check if running in Electron for silent printing
    const win = window as any;
    if (win.electronAPI && win.electronAPI.printSilent) {
      win.electronAPI.printSilent(htmlContent);
      return;
    }

    // Write HTML to iframe and trigger browser print (fallback)
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give a short delay for resources to render, then trigger browser print
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    }, 250);
  }

  private formatDate(dateStr: string): string {

    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
      return dateStr;
    }
  }
}
