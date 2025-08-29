// Nueva paleta de colores recomendada
const rosaClaro = '#FDC8E3'; // Fondo principal
const rosaMedio = '#F28DB2'; // Acentos, botones secundarios
const rosaFuerte = '#E75480'; // Botones principales, hover
const lilaSuave = '#D6A8E9'; // Fondos de tarjetas o menús
const moradoOscuro = '#5E336F'; // Texto acentos, títulos
const blanco = '#FFFFFF'; // Para dar descanso visual
const negroSuave = '#2C2C2C'; // Para texto legible en contraste

export default {
  light: {
    text: moradoOscuro, // Títulos y texto principal
    background: rosaClaro, // Fondo general rosa claro
    tint: rosaFuerte, // Color principal de la app
    tabIconDefault: '#999', // Iconos inactivos
    tabIconSelected: moradoOscuro, // Iconos activos
    buttonPrimary: rosaFuerte, // Botones principales (fucsia)
    buttonSecondary: rosaMedio, // Botones secundarios (rosa medio)
    buttonText: blanco, // Texto de botones principales
    buttonSecondaryText: moradoOscuro, // Texto de botones secundarios
    cardBackground: lilaSuave, // Fondos de tarjetas
    titleColor: moradoOscuro, // Color de títulos
    inputBorder: rosaMedio, // Bordes de inputs
    inputBackground: blanco, // Fondo de inputs
    inputText: negroSuave, // Texto de inputs
  },
  dark: {
    text: blanco,
    background: moradoOscuro, // Fondo oscuro en modo dark
    tint: rosaFuerte,
    tabIconDefault: '#999',
    tabIconSelected: rosaFuerte,
    buttonPrimary: rosaFuerte,
    buttonSecondary: blanco,
    buttonText: blanco,
    buttonSecondaryText: moradoOscuro,
    cardBackground: lilaSuave,
    titleColor: blanco,
    inputBorder: rosaMedio,
    inputBackground: blanco,
    inputText: negroSuave,
  },
};
