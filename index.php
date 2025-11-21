<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taquería Admin - Control de Merma</title>
    <link rel="stylesheet" href="assets/css/index.css">
    <script src="assets/js/index.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div id="app" class="app-container">
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <h1 class="app-title">
                        <span>&#x1F32E;</span>
                        Gestor Taquería
                    </h1>
                </div>
                <nav class="nav-tabs">
                    <button class="tab-button" data-view="insumos">Insumos</button>
                    <button class="tab-button" data-view="productos">Menú/Recetas</button>
                    <button class="tab-button" data-view="pos">Punto de Venta</button>
                    <button class="tab-button" data-view="reporte">Reporte Diario</button>
                </nav>
            </div>
        </header>
        <main class="container main-content">
            <div id="app-content">
                <p class="text-center text-gray-500 mt-10">Cargando aplicación...</p>
            </div>
        </main>
        <div id="message-box" class="modal-overlay">
            <div class="modal-content" id="message-content">
                <h3 id="message-title" class="modal-title"></h3>
                <p id="message-text" class="modal-body"></p>
                <button onclick="window.app.hideMessage()" class="btn btn-primary modal-btn">Aceptar</button>
            </div>
        </div>
    </div>
    <script src="assets/js/main.js"></script>
</body>
</html>