// Script para corregir la distribución de tabs en web
// Se ejecuta después de que se monta el componente

let fixApplied = false; // Flag para evitar aplicar el fix múltiples veces

export const applyWebTabBarFix = () => {
  if (typeof window === 'undefined') return;
  
  // Si ya se aplicó el fix, no hacerlo de nuevo
  if (fixApplied) {
    console.log('TabBar fix already applied, skipping...');
    return;
  }
  
  // Esperar a que el DOM esté listo
  const applyFix = () => {
    // Buscar el contenedor de tabs
    const tabBarContainer = document.querySelector('[role="tablist"]') || 
                           document.querySelector('.expo-router-tab-bar') ||
                           document.querySelector('[data-testid="tab-bar"]');
    
    if (!tabBarContainer) {
      console.log('TabBar container not found, retrying...');
      setTimeout(applyFix, 100);
      return;
    }
    
    console.log('Applying TabBar fix for web...');
    
    // Aplicar estilos al contenedor
    tabBarContainer.style.display = 'flex';
    tabBarContainer.style.flexDirection = 'row';
    tabBarContainer.style.justifyContent = 'space-evenly';
    tabBarContainer.style.alignItems = 'center';
    tabBarContainer.style.width = '100%';
    tabBarContainer.style.flex = '1';
    tabBarContainer.style.padding = '0';
    tabBarContainer.style.margin = '0';
    
    // Buscar todos los tabs
    const tabItems = tabBarContainer.querySelectorAll('[role="tab"]') ||
                    tabBarContainer.querySelectorAll('button') ||
                    tabBarContainer.children;
    
    if (tabItems.length === 0) {
      console.log('No tab items found, retrying...');
      setTimeout(applyFix, 100);
      return;
    }
    
    console.log(`Found ${tabItems.length} tab items`);
    
    // Calcular ancho por tab
    const tabWidth = `${100 / tabItems.length}%`;
    
    // Aplicar estilos a cada tab
    tabItems.forEach((tab, index) => {
      tab.style.flex = '1';
      tab.style.flexBasis = tabWidth;
      tab.style.flexGrow = '1';
      tab.style.flexShrink = '1';
      tab.style.minWidth = tabWidth;
      tab.style.maxWidth = tabWidth;
      tab.style.width = tabWidth;
      tab.style.display = 'flex';
      tab.style.justifyContent = 'center';
      tab.style.alignItems = 'center';
      tab.style.boxSizing = 'border-box';
      tab.style.padding = '0';
      tab.style.margin = '0';
      
      console.log(`Tab ${index + 1}: ${tabWidth} width`);
    });
    
    // Marcar que el fix se aplicó
    fixApplied = true;
    console.log('TabBar fix applied successfully!');
  };
  
  // Aplicar inmediatamente si el DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFix);
  } else {
    applyFix();
  }
  
  // También aplicar después de un delay para asegurar que React Navigation esté listo
  setTimeout(applyFix, 500);
  setTimeout(applyFix, 1000);
  setTimeout(applyFix, 2000);
};

// Función para observar cambios en el DOM (DESHABILITADA para evitar bucle infinito)
export const observeTabBarChanges = () => {
  if (typeof window === 'undefined') return;
  
  // NO crear observer para evitar bucle infinito
  console.log('TabBar observer disabled to prevent infinite loop');
  return null;
};
