window.app = (function() {
    // Variables provisionales
    let insumos = [
        { id: 1, nombre: 'Carne de Azada', unidad: 'gramos', stock: 50000, costo: 0.15, stockInicial: 50000 },
        { id: 2, nombre: 'Tortillas', unidad: 'unidad', stock: 1200, costo: 0.5, stockInicial: 1200 },
        { id: 3, nombre: 'Coca Cola 600ml', unidad: 'unidad', stock: 50, costo: 12.0, stockInicial: 50 },
        { id: 4, nombre: 'Cebolla', unidad: 'gramos', stock: 10000, costo: 0.05, stockInicial: 10000 },
    ];

    let productos = [
        { id: 101, nombre: 'Taco de Azada', precio: 20.00, receta: [
            { insumoId: 1, cantidad: 20.0, unidad: 'gramos' },
            { insumoId: 2, cantidad: 2, unidad: 'unidad' }
        ]},
        { id: 102, nombre: 'Coca Cola 600ml', precio: 18.00, receta: [
            { insumoId: 3, cantidad: 1, unidad: 'unidad' }
        ]},
    ];

    let ventas = []; // registros de ventas
    let currentTicket = []; // Carrito de compra 
    let currentView = 'pos';
    let charts = {}; // Para almacenar instancias de chart.js xd

    // FUNCIONES DE UI 

    function showMessage(title, text, type = 'info') {
        const box = document.getElementById('message-box');
        const content = document.getElementById('message-content');
        const titleEl = document.getElementById('message-title');
        
        titleEl.textContent = '';
        titleEl.className = 'modal-title'; // Resetear clases

        let icon = '';

        if (type === 'success') {
            icon = '✅';
            titleEl.classList.add('success');
        } else if (type === 'error') {
            icon = '❌';
            titleEl.classList.add('error');
        } else if (type === 'warn') {
            icon = '⚠️';
            titleEl.classList.add('warn');
        } else {
            icon = 'ℹ️';
        }
        
        titleEl.innerHTML = `<span>${icon}</span>${title}`;
        document.getElementById('message-text').textContent = text;
        
        box.classList.add('active');
    }

    function hideMessage() {
        const box = document.getElementById('message-box');
        box.classList.remove('active');
    }

    function destroyCharts() {
        Object.keys(charts).forEach(key => {
            if (charts[key]) {
                charts[key].destroy();
                charts[key] = null;
            }
        });
    }

    function navigate(view) {
        destroyCharts();
        currentView = view;
        const content = document.getElementById('app-content');
        
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('tab-active');
            if (btn.getAttribute('data-view') === view) {
                btn.classList.add('tab-active');
            }
        });

        // Contenido de la vista
        switch (view) {
            case 'insumos':
                renderInsumosAdmin(content);
                break;
            case 'productos':
                renderProductosAdmin(content);
                break;
            case 'pos':
                renderPOS(content);
                break;
            case 'reporte':
                renderDailyReport(content);
                break;
            default:
                content.innerHTML = '<p class="text-center text-gray-500 mt-10">Vista no encontrada.</p>';
        }
    }
    
    // Admin e insumos
    function renderInsumosAdmin(container) {
        container.innerHTML = `
            <h2 class="view-title">Administracion de Inventario Base</h2>
            <p class="view-description">Gestiona el stock de la materia prima. La unidad de medida es crucial para las recetas.</p>
            <div class="card">
                <h3 class="card-title">📝 Agregar Nuevo Insumo</h3>
                <form id="form-add-insumo" class="input-group">
                    <input type="text" id="insumo-nombre" placeholder="Nombre (ej. Queso Oaxaca)" required class="md-col-span-1">
                    <select id="insumo-unidad" required class="md-col-span-1">
                        <option value="">Unidad de Medida</option>
                        <option value="gramos">Gramos (g)</option>
                        <option value="unidad">Unidad (pza)</option>
                        <option value="mililitros">Mililitros (ml)</option>
                        <option value="kilogramos">Kilogramos (kg)</option>
                        <option value="litros">Litros (l)</option>
                    </select>
                    <input type="number" id="insumo-stock" placeholder="Stock Inicial" required min="0" step="any" class="md-col-span-1">
                    <button type="submit" class="btn btn-primary md-col-span-1">Añadir Insumo</button>
                </form>
            </div>
            
            <h3 class="card-title">📦 Inventario Actual</h3>
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Unidad</th>
                            <th>Stock Actual</th>
                            <th>Costo Unitario</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-list">
                        <!-- Lista de insumos -->
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('form-add-insumo').addEventListener('submit', function(e) {
            e.preventDefault();
            addInsumo();
        });

        renderInsumosList();
    }

    function renderInsumosList() {
        const list = document.getElementById('insumos-list');
        if (!list) return;

        list.innerHTML = insumos.map(insumo => `
            <tr>
                <td>${insumo.nombre}</td>
                <td>${insumo.unidad}</td>
                <td class="flex items-center space-x-2">
                    <input type="number" id="stock-${insumo.id}" value="${insumo.stock.toFixed(2)}" min="0" step="any" style="width: 80px; padding: 0.3rem;" />
                    <button onclick="window.app.updateStock(${insumo.id}, document.getElementById('stock-${insumo.id}').value)" class="btn btn-secondary" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;">
                        Actualizar
                    </button>
                </td>
                <td>$${insumo.costo.toFixed(2)}</td>
                <td>
                    <button onclick="window.app.deleteInsumo(${insumo.id})" class="btn btn-danger" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function addInsumo() {
        const nombre = document.getElementById('insumo-nombre').value.trim();
        const unidad = document.getElementById('insumo-unidad').value;
        const stock = parseFloat(document.getElementById('insumo-stock').value);

        if (!nombre || !unidad || isNaN(stock) || stock < 0) {
            showMessage("Error de Validacion", "Por favor, completa todos los campos correctamente.");
            return;
        }

        const newId = insumos.length > 0 ? Math.max(...insumos.map(i => i.id)) + 1 : 1;
        // Simulacion de llamada a api/insumos.php POST
        insumos.push({ id: newId, nombre, unidad, stock, costo: 0, stockInicial: stock });
        
        showMessage("Insumo Agregado", `"${nombre}" agregado con éxito.`, 'success');

        document.getElementById('form-add-insumo').reset();
        renderInsumosList();
    }

    function updateStock(id, newStock) {
        const insumo = insumos.find(i => i.id === id);
        const stock = parseFloat(newStock);

        if (insumo && !isNaN(stock) && stock >= 0) {
            // Simulacion de llamada a api/insumos.php PUT
            insumo.stock = stock;
            insumo.stockInicial = stock; // Para el reporte
            showMessage("Stock Actualizado", `Stock de ${insumo.nombre} actualizado a ${stock.toFixed(2)} ${insumo.unidad}.`, 'success');
            renderInsumosList();
        } else {
            showMessage("Error", "El stock debe ser un número positivo.", 'error');
        }
    }
    
    function deleteInsumo(id) {
        // Simulacion de llamada a api/insumos.php DELETE
        insumos = insumos.filter(i => i.id !== id);
        productos.forEach(p => {
            p.receta = p.receta.filter(r => r.insumoId !== id);
        });
        showMessage("Insumo Eliminado", "El insumo ha sido eliminado del inventario.", 'success');
        renderInsumosList();
    }


    // Admin: Productos y recetass
    function renderProductosAdmin(container) {
        container.innerHTML = `
            <h2 class="view-title" style="border-color: #ef4444;">Configuracion de Menú y Recetas</h2>
            <p class="view-description">Define los productos de venta y la receta (consumo de insumos) para automatizar la deduccion de inventario.</p>
            <div class="card">
                <h3 class="card-title">🌮 Agregar Nuevo Producto/Receta</h3>
                <form id="form-add-producto">
                    <div class="input-group grid-3-col mb-4">
                        <input type="text" id="producto-nombre" placeholder="Nombre del Producto" required class="col-span-1">
                        <input type="number" id="producto-precio" placeholder="Precio Venta" required min="0" step="0.01" class="col-span-1">
                    </div>
                    <h4 class="card-title" style="font-size: 1rem; margin-bottom: 0.5rem; border-left: none;">Receta: Insumos Requeridos por Unidad</h4>
                    <div id="receta-inputs" class="space-y-3 p-4" style="border: 1px solid #e5e7eb; border-radius: 0.5rem; background-color: #f9fafb;">
                        <!-- Insumos para la receta se añaden aquí -->
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                        <button type="button" onclick="window.app.addRecetaInput()" class="btn btn-secondary" style="color: #ef4444; border: none; background: none;">
                            + Añadir Insumo a Receta
                        </button>
                        <button type="submit" class="btn btn-primary">Guardar Producto</button>
                    </div>
                </form>
            </div>
            
            <h3 class="card-title">📋 Menú y Recetas Actuales</h3>
            <div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Receta (Insumos/Cant.)</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="productos-list">
                        <!-- Lista de productos -->
                    </tbody>
                </table>
            </div>
        `;

        document.getElementById('form-add-producto').addEventListener('submit', addProducto);
        addRecetaInput(); // Add fila inicial
        renderProductosList();
    }

    function getInsumoUnit(id) {
        const insumo = insumos.find(i => i.id === parseInt(id));
        return insumo ? insumo.unidad : '';
    }
    
    function addRecetaInput() {
        const container = document.getElementById('receta-inputs');
        if (insumos.length === 0) {
             container.innerHTML = '<p style="color: var(--color-error); font-style: italic;">No hay insumos disponibles. Agrega insumos primero.</p>';
             return;
        }
        
        const newRow = document.createElement('div');
        newRow.className = 'receta-row';
        newRow.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        newRow.innerHTML = `
            <select class="insumo-select" style="flex-grow: 1; min-width: 120px;">
                ${insumos.map(i => `<option value="${i.id}">${i.nombre} (${i.unidad})</option>`).join('')}
            </select>
            <input type="number" placeholder="Cant." min="0.01" step="any" class="insumo-cantidad" style="width: 80px;">
            <button type="button" onclick="window.app.removeRecetaInput(this)" class="btn-danger" style="padding: 0.3rem 0.5rem;">
                X
            </button>
        `;
        container.appendChild(newRow);
    }

    function removeRecetaInput(button) {
        const row = button.closest('.receta-row');
        row.remove();
    }

    function addProducto(e) {
        e.preventDefault();
        const nombre = document.getElementById('producto-nombre').value.trim();
        const precio = parseFloat(document.getElementById('producto-precio').value);

        if (!nombre || isNaN(precio) || precio <= 0) {
            showMessage("Error", "El nombre y el precio del producto son obligatorios.", 'error');
            return;
        }

        const receta = [];
        let validReceta = true;
        const insumoRows = document.querySelectorAll('#receta-inputs .receta-row');
        
        insumoRows.forEach(row => {
            const selectEl = row.querySelector('.insumo-select');
            const cantidadEl = row.querySelector('.insumo-cantidad');

            if (!selectEl || !cantidadEl) return; 

            const insumoId = parseInt(selectEl.value);
            const cantidad = parseFloat(cantidadEl.value);
            const unidad = getInsumoUnit(insumoId);
            
            if (isNaN(cantidad) || cantidad <= 0) {
                validReceta = false;
            }

            if (insumoId && cantidad > 0) {
                receta.push({ insumoId, cantidad, unidad });
            }
        });

        if (!validReceta) {
            showMessage("Error", "La cantidad de insumo en la receta debe ser un número positivo.", 'error');
            return;
        }
        
        if (receta.length === 0) {
            showMessage("Advertencia", "El producto no tiene insumos asignados. No se deducirá inventario al venderlo.", 'warn');
        }

        const newId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 101;
        // Simulacion de llamada a api/productos.php POST
        productos.push({ id: newId, nombre: nombre, precio: precio, receta: receta });
        
        showMessage("Producto Guardado", `"${nombre}" (Receta: ${receta.length} insumos) ha sido guardado.`, 'success');

        document.getElementById('form-add-producto').reset();
        document.getElementById('receta-inputs').innerHTML = ''; // Limpiar receta
        addRecetaInput(); // Poner uno nuevo
        renderProductosList();
    }

    function renderProductosList() {
        const list = document.getElementById('productos-list');
        if (!list) return;

        list.innerHTML = productos.map(p => {
            const recetaHtml = p.receta.map(r => {
                const insumo = insumos.find(i => i.id === r.insumoId);
                return `<span style="display: block; font-size: 0.75rem; color: #4b5563;">${r.cantidad} ${r.unidad} de ${insumo ? insumo.nombre : 'Insumo Eliminado'}</span>`;
            }).join('');

            return `
                <tr>
                    <td style="font-weight: 600;">${p.nombre}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${recetaHtml || '<span style="color: #9ca3af; font-style: italic;">Sin receta</span>'}</td>
                    <td>
                        <button onclick="window.app.deleteProducto(${p.id})" class="btn btn-danger" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    function deleteProducto(id) {
        // Simulacion de llamada a api/productos.php DELETE
        productos = productos.filter(p => p.id !== id);
        showMessage("Producto Eliminado", "El producto ha sido eliminado del menú.", 'success');
        renderProductosList();
    }

    // PUNTO DE VENTA 
    function renderPOS(container) {
        container.innerHTML = `
            <h2 class="view-title" style="border-color: #10b981;">Punto de Venta</h2>
            <p class="view-description">Registra las ventas aquí. Al confirmar, el inventario de insumos se deducirá automáticamente según la receta de cada producto.</p>
            
            <div class="pos-layout">
                <!-- Columna 1: Productos -->
                <div class="card" style="padding: 1rem;">
                    <h3 class="card-title">Seleccion de Productos</h3>
                    <div id="pos-product-list" class="pos-product-list">
                        <!-- Botones de productos -->
                    </div>
                </div>

                <!-- Columna 2: Ticket/Caja -->
                <div class="pos-ticket">
                    <h3 class="card-title" style="margin-bottom: 0.5rem;">Ticket Actual 🧾</h3>
                    <div id="ticket-items" style="min-height: 200px;">
                        <!-- Ítems del ticket -->
                    </div>
                    
                    <div class="ticket-total">
                        <span>TOTAL:</span>
                        <span id="ticket-total-display">$0.00</span>
                    </div>

                    <div style="margin-top: 1rem;">
                        <button onclick="window.app.processSale()" class="btn btn-primary" style="width: 100%; margin-bottom: 0.5rem;">
                            Cerrar Venta
                        </button>
                        <button onclick="window.app.clearTicket()" class="btn btn-secondary" style="width: 100%;">
                            Limpiar Ticket
                        </button>
                    </div>
                </div>
            </div>
        `;

        renderProductButtons();
        renderTicket();
    }

    function renderProductButtons() {
        const list = document.getElementById('pos-product-list');
        if (!list) return;

        list.innerHTML = productos.map(p => `
            <button onclick="window.app.addItemToTicket(${p.id})" class="pos-product-btn">
                ${p.nombre} <br>
                <span style="font-size: 1rem; color: var(--color-taco); font-weight: 700;">$${p.precio.toFixed(2)}</span>
            </button>
        `).join('');
    }

    function addItemToTicket(productId) {
        const existingItem = currentTicket.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            const product = productos.find(p => p.id === productId);
            currentTicket.push({
                id: productId,
                name: product.nombre,
                price: product.precio,
                quantity: 1
            });
        }
        renderTicket();
    }

    function updateTicketItemQuantity(itemId, quantity) {
        const item = currentTicket.find(i => i.id === itemId);
        if (item) {
            const newQty = parseInt(quantity);
            if (newQty > 0) {
                item.quantity = newQty;
            } else {
                currentTicket = currentTicket.filter(i => i.id !== itemId);
            }
        }
        renderTicket();
    }

    function removeItemFromTicket(itemId) {
        currentTicket = currentTicket.filter(i => i.id !== itemId);
        renderTicket();
    }

    function calculateTicketTotal() {
        return currentTicket.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    function renderTicket() {
        const itemsContainer = document.getElementById('ticket-items');
        const totalDisplay = document.getElementById('ticket-total-display');
        
        if (!itemsContainer || !totalDisplay) return;

        if (currentTicket.length === 0) {
            itemsContainer.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 2rem 0;">Ticket vacío. Añade productos.</p>';
            totalDisplay.textContent = '$0.00';
            return;
        }

        itemsContainer.innerHTML = currentTicket.map(item => `
            <div class="ticket-item">
                <div style="flex-grow: 1;">
                    <p style="font-weight: 600;">${item.name}</p>
                    <span style="font-size: 0.75rem; color: var(--color-gray);">$${item.price.toFixed(2)} c/u</span>
                </div>
                <input type="number" value="${item.quantity}" min="1" onchange="window.app.updateTicketItemQuantity(${item.id}, this.value)" style="width: 50px; text-align: center; margin-right: 0.5rem; padding: 0.2rem;" />
                <span style="font-weight: 700;">$${(item.price * item.quantity).toFixed(2)}</span>
                <button onclick="window.app.removeItemFromTicket(${item.id})" class="btn-danger" style="margin-left: 0.5rem; padding: 0.2rem 0.4rem; font-size: 0.75rem;">X</button>
            </div>
        `).join('');

        totalDisplay.textContent = `$${calculateTicketTotal().toFixed(2)}`;
    }

    function clearTicket() {
        currentTicket = [];
        renderTicket();
    }

    function processSale() {
        if (currentTicket.length === 0) {
            showMessage("Venta Vacía", "No puedes cerrar una venta sin productos.", 'warn');
            return;
        }

        const total = calculateTicketTotal();
        const saleDetails = [];
        let stockSufficient = true;
        const requiredChanges = [];

        // Verificar stock
        for (const ticketItem of currentTicket) {
            const product = productos.find(p => p.id === ticketItem.id);
            if (!product) continue;

            saleDetails.push({
                id_producto: product.id,
                cantidad: ticketItem.quantity,
                subtotal: product.price * ticketItem.quantity
            });

            for (const itemReceta of product.receta) {
                const insumo = insumos.find(i => i.id === itemReceta.insumoId);
                if (!insumo) continue; 

                const consumption = itemReceta.cantidad * ticketItem.quantity;
                
                if (insumo.stock < consumption) {
                    stockSufficient = false;
                    showMessage("Fallo de Inventario", `Stock insuficiente de ${insumo.nombre}. Necesitas ${consumption.toFixed(2)} ${insumo.unidad}, solo hay ${insumo.stock.toFixed(2)}.`, 'error');
                    break;
                }
                
                // Acumular deduccion
                let change = requiredChanges.find(c => c.id === insumo.id);
                if (!change) {
                    change = { id: insumo.id, name: insumo.nombre, deduction: 0 };
                    requiredChanges.push(change);
                }
                change.deduction += consumption;
            }
            if (!stockSufficient) break;
        }

        if (!stockSufficient) return;

        // Ejecutar la centa y deduccion
        // Simulacion de llamada a api/ventas.php POST

        try {
            // Aplicar deducciones al inventario
            for (const change of requiredChanges) {
                const insumo = insumos.find(i => i.id === change.id);
                insumo.stock -= change.deduction;
            }

            // Registrar la venta
            ventas.push({
                id: ventas.length + 1,
                date: new Date().toLocaleTimeString('es-MX'),
                total: total,
                details: saleDetails
            });

            showMessage("Venta Exitosa", `Venta de $${total.toFixed(2)} registrada. El inventario ha sido deducido.`, 'success');
            clearTicket(); // Limpiar el POS

        } catch (e) {
            // Simulacion de Rollback
            showMessage("Error Crítico", "Fallo al registrar la venta. No se pudo deducir el inventario. Se deshace la operacion.", 'error');
        }
    }


    // REPORTE DIARIO 
    function renderDailyReport(container) {
        container.innerHTML = `
            <h2 class="view-title" style="border-color: #f59e0b;">Reporte Diario de Operaciones</h2>
            <p class="view-description">Resumen de ventas y análisis de consumo de inventario para el día actual (simulado).</p>
            
            <div id="report-summary-grid" class="report-grid">
                <!-- Resumen -->
            </div>
            
            <div class="report-grid">
                <!-- Gráfico de Productos Vendidos -->
                <div class="card">
                    <h3 class="card-title">📊 Top Productos Vendidos</h3>
                    <div class="chart-container"><canvas id="productos-chart"></canvas></div>
                </div>
                <!-- Gráfico de Insumos Consumidos -->
                <div class="card">
                    <h3 class="card-title">📉 Insumos Más Consumidos</h3>
                    <div class="chart-container"><canvas id="insumos-chart"></canvas></div>
                </div>
            </div>
        `;
        
        generateReportData();
        renderReportSummary();
        renderProductChart();
        renderInsumosChart();
    }

    function generateReportData() {
        // Simulacion de llamada a api/reporte_diario.php GET
        const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
        const numVentas = ventas.length;
        
        const productsSold = {};
        const insumoConsumption = {};
        
        ventas.forEach(v => {
            v.details.forEach(d => {
                const product = productos.find(p => p.id === d.id_producto);
                if (!product) return;

                // 1. Productos vendidos
                productsSold[product.nombre] = (productsSold[product.nombre] || 0) + d.cantidad;

                // 2. Consumo de insumos
                product.receta.forEach(r => {
                    const insumo = insumos.find(i => i.id === r.insumoId);
                    if (!insumo) return;

                    const consumption = r.cantidad * d.cantidad;
                    const key = `${insumo.nombre} (${insumo.unidad})`;
                    insumoConsumption[key] = (insumoConsumption[key] || 0) + consumption;
                });
            });
        });

        // Calcular costo de insumos restantes (merma/diferencia)
        const initialValue = insumos.reduce((sum, i) => sum + (i.stockInicial * i.costo), 0);
        const currentValue = insumos.reduce((sum, i) => sum + (i.stock * i.costo), 0);
        const costOfGoodsSold = initialValue - currentValue;

        return {
            totalVentas,
            numVentas,
            productsSold: Object.entries(productsSold).sort((a, b) => b[1] - a[1]),
            insumoConsumption: Object.entries(insumoConsumption).sort((a, b) => b[1] - a[1]),
            costOfGoodsSold,
            initialValue,
            currentValue
        };
    }

    function renderReportSummary() {
        const data = generateReportData();
        const grid = document.getElementById('report-summary-grid');
        if (!grid) return;

        const summaryHtml = `
            <div class="report-summary-card" style="border-left-color: var(--color-taco);">
                <h4>Total de Ventas Brutas</h4>
                <p>$${data.totalVentas.toFixed(2)}</p>
            </div>
            <div class="report-summary-card" style="border-left-color: #2563eb;">
                <h4>Costo de Mercancía Vendida (CMV)</h4>
                <p>$${data.costOfGoodsSold.toFixed(2)}</p>
            </div>
            <div class="report-summary-card" style="border-left-color: #10b981;">
                <h4>Ganancia Bruta Estimada</h4>
                <p>$${(data.totalVentas - data.costOfGoodsSold).toFixed(2)}</p>
            </div>
            <div class="report-summary-card" style="border-left-color: #f59e0b;">
                <h4>Número de Transacciones</h4>
                <p>${data.numVentas}</p>
            </div>
        `;
        grid.innerHTML = summaryHtml;
    }

    function renderProductChart() {
        const data = generateReportData().productsSold;
        const ctx = document.getElementById('productos-chart').getContext('2d');
        
        charts.productos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.slice(0, 5).map(item => item[0]),
                datasets: [{
                    label: 'Cantidad Vendida',
                    data: data.slice(0, 5).map(item => item[1]),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 205, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(54, 162, 235, 0.6)'
                    ],
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Top 5 Productos por Unidades'
                    }
                }
            }
        });
    }

    function renderInsumosChart() {
        const data = generateReportData().insumoConsumption;
        const ctx = document.getElementById('insumos-chart').getContext('2d');
        
        charts.insumos = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.slice(0, 5).map(item => item[0]),
                datasets: [{
                    label: 'Consumo Total',
                    data: data.slice(0, 5).map(item => item[1]),
                    backgroundColor: [
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(75, 192, 192, 0.7)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Consumo de Insumos (Por Unidades)'
                    }
                }
            }
        });
    }

    // INICIALIZACION
    function initialize() {
        // Enlazar botones de navegacion
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                navigate(e.target.getAttribute('data-view'));
            });
        });

        // Iniciar en la vista 
        navigate(currentView);
    }
    
    // Ejecutar la inicializacion cuando el DOM esta cargado
    document.addEventListener('DOMContentLoaded', initialize);

    // Funciones públicas expuestas a window.app 
    return {
        initialize,
        showMessage,
        hideMessage,
        navigate,
        updateStock,
        deleteInsumo,
        deleteProducto,
        addRecetaInput,
        removeRecetaInput,
        addItemToTicket,
        updateTicketItemQuantity,
        removeItemFromTicket,
        processSale,
        clearTicket
    };

})(); 