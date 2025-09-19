// Paleta UI/UX optimizada - Rosa como acento, neutros mejorados
const rosaClaro = '#FAD1E1'; // Rosa suave equilibrado para fondo global (menos fatiga)
const rosaMedio = '#F2B8D1'; // Fondo de tarjetas más intenso para contraste
const rosaFuerte = '#E75480'; // Botones principales (mantener)
const rosaAcento = '#EE7BA3'; // Acentos y elementos interactivos más intensos
const grisClaro = '#F8F9FA'; // Fondo alternativo para contraste
const grisMedio = '#E9ECEF'; // Bordes y separadores sutiles
const moradoOscuro = '#5E336F'; // Texto principal (mantener)
const negroSuave = '#2C2C2C'; // Texto en fondos claros
const textoSecundario = '#6C757D'; // Texto secundario menos prominente
const blanco = '#FFFFFF'; // Blanco para texto en botones y fondos

export default {
  light: {
    // Texto y contenido
    text: moradoOscuro, // Texto principal - alto contraste
    textSecondary: textoSecundario, // Texto secundario - menos prominente
    titleColor: moradoOscuro, // Títulos - mismo que texto principal

    // Fondos
    background: rosaClaro, // Fondo principal - muy sutil
    cardBackground: rosaMedio, // Tarjetas - ligeramente más saturado
    surface: grisClaro, // Superficies alternativas - neutro

    // Elementos interactivos
    tint: rosaFuerte, // Color principal de la app
    tabIconDefault: grisMedio, // Iconos inactivos - sutiles
    tabIconSelected: rosaAcento, // Iconos activos - rosa pero no fuerte

    // Botones
    buttonPrimary: rosaFuerte, // Botones principales - rosa fuerte para acción
    buttonSecondary: rosaAcento, // Botones secundarios - rosa medio
    buttonText: blanco, // Texto en botones principales
    buttonSecondaryText: moradoOscuro, // Texto en botones secundarios

    // Estados semánticos
    success: '#4CAF50', // Verde estándar - universalmente reconocido
    warning: '#FF9800', // Naranja - atención pero no rosa
    error: '#F44336', // Rojo - problemas

    // Formularios
    inputBorder: grisMedio, // Bordes sutiles - no rosa para no confundir
    inputBackground: blanco, // Fondo blanco - máximo contraste
    inputText: negroSuave, // Texto oscuro - legibilidad
  },
  dark: {
    // Mantener consistencia pero adaptar para modo oscuro
    text: blanco,
    textSecondary: '#ADB5BD', // Gris claro para texto secundario
    titleColor: blanco,
    background: '#1A1A1A', // Fondo oscuro neutro
    cardBackground: '#2D2D2D', // Tarjetas oscuras
    surface: '#404040', // Superficies alternativas
    tint: rosaFuerte,
    tabIconDefault: '#666',
    tabIconSelected: rosaAcento,
    buttonPrimary: rosaFuerte,
    buttonSecondary: rosaAcento,
    buttonText: blanco,
    buttonSecondaryText: blanco,
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    inputBorder: '#555',
    inputBackground: '#333',
    inputText: blanco,
  },
};
