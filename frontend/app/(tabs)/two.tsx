import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Colors from '../../constants/Colors';
import { initDB, obtenerPedidos, Pedido } from '../../services/db';

type PeriodoFiltro = '6meses' | '1ano' | 'todo';

export default function EstadisticasScreen() {
  const { width } = useWindowDimensions();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('6meses');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('');
  const [verTodosMeses, setVerTodosMeses] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    try {
      await initDB();
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const total = pedidos.length;
    const totalPrecio = pedidos.reduce((acc, p) => acc + (Number(p.precio_final) || 0), 0);
    const totalAbonado = pedidos.reduce((acc, p) => acc + (Number(p.monto_abonado) || 0), 0);
    const totalDebe = totalPrecio - totalAbonado;

    // Por mes (YYYY-MM)
    const porMesMap: Record<string, { count: number; total: number; abonado: number; debe: number }> = {};
    pedidos.forEach(p => {
      const key = (p.fecha_entrega || '').slice(0, 7);
      if (!porMesMap[key]) porMesMap[key] = { count: 0, total: 0, abonado: 0, debe: 0 };
      porMesMap[key].count += 1;
      porMesMap[key].total += Number(p.precio_final) || 0;
      porMesMap[key].abonado += Number(p.monto_abonado) || 0;
    });

    // Calcular debe por mes
    Object.keys(porMesMap).forEach(key => {
      porMesMap[key].debe = porMesMap[key].total - porMesMap[key].abonado;
    });

    let porMes = Object.entries(porMesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({
        mes,
        cantidad: v.count,
        total: v.total,
        abonado: v.abonado,
        debe: v.debe
      }));

    // Aplicar filtro de período
    const now = new Date();
    if (periodoFiltro === '6meses') {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      porMes = porMes.filter(item => {
        const itemDate = new Date(item.mes + '-01');
        return itemDate >= sixMonthsAgo;
      });
    } else if (periodoFiltro === '1ano') {
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
      porMes = porMes.filter(item => {
        const itemDate = new Date(item.mes + '-01');
        return itemDate >= oneYearAgo;
      });
    }

    return { total, totalPrecio, totalAbonado, totalDebe, porMes };
  }, [pedidos, periodoFiltro]);

  const f = (n: number) => `Q${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

  // Lista de meses disponibles para selección
  const mesesDisponibles = stats.porMes.map(item => ({
    key: item.mes,
    label: new Date(item.mes + '-01').toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    }),
    value: item
  }));

  // Filtrar meses para mostrar según la selección
  const mesesParaMostrar = useMemo(() => {
    if (verTodosMeses || !mesSeleccionado) {
      return stats.porMes;
    }
    return stats.porMes.filter(item => item.mes === mesSeleccionado);
  }, [stats.porMes, verTodosMeses, mesSeleccionado]);

  // Auto-seleccionar el mes más reciente cuando se carga
  useEffect(() => {
    if (stats.porMes.length > 0 && !mesSeleccionado) {
      setMesSeleccionado(stats.porMes[stats.porMes.length - 1].mes);
    }
  }, [stats.porMes]);

  // Configuración optimizada de gráficas
  const chartConfig = {
    backgroundGradientFrom: Colors.light.cardBackground,
    backgroundGradientTo: Colors.light.cardBackground,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(231, 84, 128, ${opacity})`, // Rosa fuerte #E75480
    labelColor: (opacity = 1) => Colors.light.titleColor,
    strokeWidth: 2,
    barPercentage: 0.6, // Barras más delgadas para mejor proporción
    barRadius: 4, // Bordes redondeados en barras
    useShadowColorFromDataset: false,
    propsForLabels: {
      fontSize: 11, // Tamaño de fuente más pequeño
      fontWeight: '500',
    },
    propsForVerticalLabels: {
      fontSize: 10,
      fontWeight: '400',
      rotation: 0, // Sin rotación para mejor legibilidad
    },
    decimalPlaces: 0, // Sin decimales para cantidades
  };

  // Dimensiones optimizadas para gráficas
  const chartWidth = width - 64; // Más margen lateral
  const chartHeight = 200; // Altura más compacta

  // Datos para gráfica de cantidad de pedidos
  const cantidadPedidosData = {
    labels: stats.porMes.map(item =>
      new Date(item.mes + '-01').toLocaleDateString('es-ES', { month: 'short' })
    ),
    datasets: [{
      data: stats.porMes.map(item => item.cantidad),
      color: (opacity = 1) => Colors.light.buttonPrimary,
      strokeWidth: 2,
    }],
  };

  // Datos para gráfica de ingresos
  const ingresosData = {
    labels: stats.porMes.map(item =>
      new Date(item.mes + '-01').toLocaleDateString('es-ES', { month: 'short' })
    ),
    datasets: [{
      data: stats.porMes.map(item => item.total),
      color: (opacity = 1) => Colors.light.buttonSecondary,
      strokeWidth: 3,
    }],
  };

  const filtroLabels = {
    '6meses': 'Últimos 6 meses',
    '1ano': 'Último año',
    'todo': 'Todo el tiempo'
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Estadísticas</Text>

      {/* Filtros de período */}
      <View style={styles.filtrosContainer}>
        <Text style={styles.filtrosLabel}>Período:</Text>
        <View style={styles.filtrosButtons}>
          {Object.entries(filtroLabels).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filtroButton,
                periodoFiltro === key && styles.filtroButtonActive
              ]}
              onPress={() => setPeriodoFiltro(key as PeriodoFiltro)}
            >
              <Text style={[
                styles.filtroButtonText,
                periodoFiltro === key && styles.filtroButtonTextActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Cards de estadísticas generales */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Pedidos Totales</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Text style={styles.statValue}>{f(stats.totalPrecio)}</Text>
            <Text style={styles.statLabel}>Ingresos Totales</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardSuccess]}>
            <Text style={styles.statValue}>{f(stats.totalAbonado)}</Text>
            <Text style={styles.statLabel}>Total Abonado</Text>
          </View>
          <View style={[styles.statCard, styles.statCardWarning]}>
            <Text style={styles.statValue}>{f(stats.totalDebe)}</Text>
            <Text style={styles.statLabel}>Total Pendiente</Text>
          </View>
        </View>
      </View>

      {/* Gráficas */}
      <View style={styles.chartsContainer}>
        <Text style={styles.chartTitle}>📊 Cantidad de Pedidos por Mes</Text>
        <View style={styles.chartWrapper}>
          <BarChart
            data={cantidadPedidosData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => Colors.light.buttonPrimary,
            }}
            style={styles.chart}
            showValuesOnTopOfBars={false} // Sin valores encima para mejor apariencia
            fromZero
            withInnerLines={false}
          />
        </View>

        <Text style={styles.chartTitle}>💰 Ingresos por Mes</Text>
        <View style={styles.chartWrapper}>
          <LineChart
            data={ingresosData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => Colors.light.buttonSecondary,
            }}
            style={styles.chart}
            bezier
            withInnerLines={false}
            withDots={true}
            withShadow={false}
          />
        </View>
      </View>

      {/* Tabla detallada por mes */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>📅 Detalle por Mes</Text>

        {/* Controles de selección */}
        <View style={styles.tableControls}>
          <TouchableOpacity
            style={[styles.controlButton, verTodosMeses && styles.controlButtonActive]}
            onPress={() => setVerTodosMeses(true)}
          >
            <Text style={[styles.controlButtonText, verTodosMeses && styles.controlButtonTextActive]}>
              Ver Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !verTodosMeses && styles.controlButtonActive]}
            onPress={() => setVerTodosMeses(false)}
          >
            <Text style={[styles.controlButtonText, !verTodosMeses && styles.controlButtonTextActive]}>
              Mes Específico
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selector de mes cuando no se ven todos */}
        {!verTodosMeses && mesesDisponibles.length > 0 && (
          <View style={styles.monthSelector}>
            <Text style={styles.monthSelectorLabel}>Seleccionar mes:</Text>
            <View style={styles.monthButtons}>
              {mesesDisponibles.map((mes) => (
                <TouchableOpacity
                  key={mes.key}
                  style={[
                    styles.monthButton,
                    mesSeleccionado === mes.key && styles.monthButtonActive
                  ]}
                  onPress={() => setMesSeleccionado(mes.key)}
                >
                  <Text style={[
                    styles.monthButtonText,
                    mesSeleccionado === mes.key && styles.monthButtonTextActive
                  ]}>
                    {new Date(mes.key + '-01').toLocaleDateString('es-ES', {
                      month: 'short',
                      year: '2-digit'
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tabla de datos */}
        {mesesParaMostrar.length > 0 ? (
          mesesParaMostrar.map((item, index) => (
            <View key={item.mes} style={styles.tableRow}>
              <View style={styles.tableCellMonth}>
                <Text style={styles.tableMonthText}>
                  {new Date(item.mes + '-01').toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.tableCellData}>
                <Text style={styles.tableDataLabel}>Pedidos:</Text>
                <Text style={styles.tableDataValue}>{item.cantidad}</Text>
              </View>
              <View style={styles.tableCellData}>
                <Text style={styles.tableDataLabel}>Total:</Text>
                <Text style={styles.tableDataValue}>{f(item.total)}</Text>
              </View>
              <View style={styles.tableCellData}>
                <Text style={styles.tableDataLabel}>Abonado:</Text>
                <Text style={styles.tableDataValue}>{f(item.abonado)}</Text>
              </View>
              <View style={styles.tableCellData}>
                <Text style={styles.tableDataLabel}>Pendiente:</Text>
                <Text style={styles.tableDataValue}>{f(item.debe)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {verTodosMeses ? 'No hay datos para el período seleccionado' : 'Selecciona un mes para ver los detalles'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20
  },

  // Título principal
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Filtros
  filtrosContainer: {
    marginBottom: 20,
  },
  filtrosLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.titleColor,
    marginBottom: 8,
  },
  filtrosButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filtroButton: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
  },
  filtroButtonActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  filtroButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.inputText,
    textAlign: 'center',
  },
  filtroButtonTextActive: {
    color: Colors.light.buttonText,
    fontWeight: '600',
  },

  // Estadísticas principales
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardPrimary: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  statCardSecondary: {
    backgroundColor: Colors.light.buttonSecondary,
    borderColor: Colors.light.buttonSecondary,
  },
  statCardSuccess: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  statCardWarning: {
    backgroundColor: Colors.light.warning,
    borderColor: Colors.light.warning,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Blanco para alto contraste sobre fondos de colores
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF', // Blanco para legibilidad sobre fondos de colores
    textAlign: 'center',
  },

  // Gráficas
  chartsContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 12,
    textAlign: 'center',
  },
  chartWrapper: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 12, // Padding reducido para más espacio útil
    marginHorizontal: 8, // Margen adicional para centrado
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center', // Centrar contenido
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8, // Espacio vertical para mejor proporción
  },

  // Tabla detallada
  tableContainer: {
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 12,
    textAlign: 'center',
  },

  // Controles de tabla
  tableControls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  controlButton: {
    flex: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: Colors.light.buttonPrimary,
    borderColor: Colors.light.buttonPrimary,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.inputText,
  },
  controlButtonTextActive: {
    color: Colors.light.buttonText,
    fontWeight: '600',
  },

  // Selector de mes
  monthSelector: {
    marginBottom: 16,
  },
  monthSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.titleColor,
    marginBottom: 8,
    textAlign: 'center',
  },
  monthButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  monthButton: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    minWidth: 60,
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: Colors.light.buttonSecondary,
    borderColor: Colors.light.buttonSecondary,
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.inputText,
    textAlign: 'center',
  },
  monthButtonTextActive: {
    color: Colors.light.buttonSecondaryText,
    fontWeight: '600',
  },
  tableRow: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tableCellMonth: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.inputBorder,
  },
  tableMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    textTransform: 'capitalize',
  },
  tableCellData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tableDataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.inputText,
  },
  tableDataValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },

  // Texto vacío
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.light.inputText,
    fontStyle: 'italic',
    marginTop: 20,
  },
});
