<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taquería Admin - Control de Merma</title>
    <link rel="stylesheet" href="assets/css/index.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <div id="app" class="app-container">
        <header class="header">
            <div class="container header-inner">
                <div class="brand">
                    <div class="logo-icon">🌮</div>
                    <h1 class="app-title">Gestor Taquería</h1>
                </div>
                <nav class="nav-tabs">
                    <button class="tab-button" data-view="insumos">
                        <i class="fa-solid fa-boxes-stacked"></i> Insumos
                    </button>
                    <button class="tab-button" data-view="productos">
                        <i class="fa-solid fa-utensils"></i> Menú/Recetas
                    </button>
                    <button class="tab-button" data-view="pos">
                        <i class="fa-solid fa-cash-register"></i> Punto de Venta
                    </button>
                    <button class="tab-button" data-view="reporte">
                        <i class="fa-solid fa-chart-line"></i> Reporte Diario
                    </button>
                </nav>
            </div>
        </header>

        <main class="container main-content">
            <div id="app-content" class="fade-in">
                <div class="loading-state">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <p>Cargando aplicación...</p>
                </div>
            </div>
        </main>
    </div>
    <script src="assets/js/index.js"></script>
</body>
</html>