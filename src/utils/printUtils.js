import React, { useState, useEffect } from 'react';
import { formatLongDate, formatCurrency } from '../utils/formatters';

export const generatePrintReceipt = (data, title = "Hardware Acknowledgement Receipt") => {
  // console.log('generatePrintReceipt', data);

  const printWindow = window.open('', '_blank');
  // if (!printWindow) {
    // alert("Please allow pop-ups to print.");
    // return;
  // }

  const receiptHtml = `
    <html>
      <head>
        <title>Badong's Hardware Sales Acknowledgement Receipt</title>
        <style>
          body { font-family:arial;font-size:9pt }
          .header_company { text-align: center;  }
          .header_title { text-align: center; padding-bottom: 10px; }
=         table { font-family:arial;font-size:9pt; }
          @media print {
            .noprint { display: none; }
          }
          @media print {
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
          @media screen {
            thead { display: block; }
            tfoot { display: block; }
          }
        </style>
      </head>
      <body>
        <input class='noprint' type='button' value='Print' onclick='window.print()' />
        <div class="content">
          <div class="header_company">Badong's Hardware</div>
          <div class="header_title">SALES INVOICE</div>
          <table>
            <tr>
              <td><strong>Sold to:</strong></td><td>${data.customer_name}</td>
              <td><strong>Sold to:</strong></td><td>${data.date_sold}</td>
            </tr>
            <tr><td><strong>Invoice No:</strong></td><td>${data.invoice_no}</td></tr>
            <tr><td><strong>Date Sold:</strong></td><td>${data.date_sold}</td></tr>
            <tr><td><strong>Payment Status:</strong></td><td>${data.payment_status}</td></tr>
            <tr><td><strong>Payment Method:</strong></td><td>${data.payment_method || 'N/A'}</td></tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.sku}</td>
                  <td>${item.product_name}</td>
                  <td>${item.qty_sold}</td>
                  <td>${item.price_per_unit}</td>
                  <td>${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            Grand Total: ₱${data.amount}
          </div>
        </div>
        <script>
          // window.onload = () => { window.print(); };
        </script>
      </body>
    </html>
  `;

  const newReceiptHtml = `
    <html>
      <head>
          <style>
              body { font-family:arial; font-size:8pt; margin:0px; }
              table {
                  font-family:arial; font-size:9pt;
              }
              table.sp tr td{
                  padding: 5px 0px;
              }

              div {font-family:arial;font-size:9pt}
              p {line-height: 13pt;}
              @media print {
                    .noprint { display: none;}
                  }
              @media print {
                  thead { display: table-header-group; }
                  tfoot { display: table-footer-group; }
              }
              @media screen {
                  thead { display: block; }
                  tfoot { display: block; }
              }

              .branch{font-size:6pt;text-align: center;line-height:6pt;}
              .underl{text-decoration: underline;font-family:arial;font-size:8pt}
              .title{color:#FF0000}
              td { padding:3px 0px 0px 0px; line-height:0.7em; font-size:12px!important; }

              #charge_tbl .header { padding:7px 5px 5px 5px; text-align:center; }
              #charge_tbl .amount { text-align:right; line-height:15px; padding: 5px 5px 2px 5px; vertical-align:top; }
              #charge_tbl .product { text-align:left; line-height:15px; padding: 5px 5px 2px 5px; vertical-align:top; }

              #item_amount, #item_svc { font-size:11px!important; }
              #shrink-element { width:230px;height:12px;position:relative; }
              #shrink-element span { position:absolute;bottom:2px;font-weight:700;" }
              .shrink-element-2 { width:230px!important;height:12px;position:relative; }
              .shrink-element-2 span { position:absolute;bottom:2px;" }

              .cell { display:flex; gap:8px } 
              .span_f { flex:0 }
              .span_s { flex:1 }
          </style>
      </head>
      <body>
          <input class='noprint' type='button' value='Print' onclick='window.print()' style='margin:10px;position:absolute;'/>
          <table width="100%" class="sp">
            <tr><td align="center">
              <div style="width:390;text-align:left;background:#fff;margin:0px;padding:0px;">

                <table style="width:100%">

                  <tr>
                    <td colspan="10" style="text-align:center; padding:15px 0px 7px 0px; font-weight:700;">
                      <span style="font-size:12pt;">Badong's Hardware<span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="10" style="padding:0px 0px 15px 0px; text-align:center;">- address here -</td>
                  </tr>
                  <tr>
                    <td colspan="10" style="padding:0px 0px 20px 0px; text-align:center; font-weight:900">
                      <span style="font-size:14pt;">SALES INVOICE</span>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="5">                      
                      <div style="display:flex"><span style="color:green;">Sold to:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1;">${data.customer_name}</span></div>
                    </td>
                    <td colspan="5">                      
                      <div style="display:flex"><span style="color:green;">Date:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1">${formatLongDate(data.date_sold)}</span></div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="5">                      
                      <div style="display:flex"><span style="color:green;">TIN/SC-TIN:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1"></span></div>
                    </td>
                    <td colspan="5">                      
                      <div style="display:flex"><span style="color:green;">Terms:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1"></span></div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="10">                      
                      <div style="display:flex"><span style="color:green;">Business Style:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1"></span></div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="10">                      
                      <div style="display:flex"><span style="color:green;">Address:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1"></span></div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="10" style="">
                      <table cellspacing="0" cellspacing="0" border="1" width="100%" id="charge_tbl">
                        <tr>
                          <td class="header"><b>#</b></td>
                          <td class="header"><b>ARTICLES</b></td>
                          <td class="header"><b>QTY</b></td>
                          <td class="header"><b>PRICE</b></td>
                          <td class="header"><b>AMOUNT</b></td>
                        </tr>
                        ${data.items.map((item, key) => `
                          <tr>
                            <td class="product">${key + 1}</td>
                            <td class="product">${item.product_name}</td>
                            <td class="product">${item.qty_sold}</td>
                            <td class="amount">${formatCurrency(item.price_per_unit)}</td>
                            <td class="amount">${formatCurrency(item.total)}</td>
                          </tr>
                        `).join('')}
                        <tr>
                          <td class="product" colspan="4" style="text-align:right;"><b>TOTAL AMOUNT</b></td>
                          <td class="amount">${formatCurrency(data.amount)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td colspan="5">                      
                    </td>
                    <td colspan="5">                      
                      <div style="display:flex"><span style="color:green;">Prepard by:</span><span style="margin:0 5px; border-bottom:1px solid black; flex:1; text-align:center;">${data.employee}</span></div>
                    </td>
                  </tr>

                </table>

              </div>
            </td></tr>
          </table>
              <script>
              /*window.onload = function(){
                  $('#shrink-element_[elementid]').textfill({
                      maxFontPixels: 12
                  });
              }*/
          </script>
      </body>
    </html>
  `;

  printWindow.document.write(newReceiptHtml);
  printWindow.document.close();
};
