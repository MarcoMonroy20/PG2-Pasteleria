import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { initDB, obtenerPedidos, Pedido } from '../../services/db';
import Colors from '../../constants/Colors';

interface PedidoPorFecha {
  fecha: string;
  pedidos: Pedido[];
}

export default function CalendarioScreen() {
  const navigation = useNavigation();
  const [pedidosPorFecha, setPedidosPorFecha] = useState<PedidoPorFecha[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      await initDB();
      const pedidosData = await obtenerPedidos();
      const pedidosAgrupados = agruparPedidosPorFecha(pedidosData);
      setPedidosPorFecha(pedidosAgrupados);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarPedidos();
    setRefreshing(false);
  };

  const agruparPedidosPorFecha = (pedidos: Pedido[]): PedidoPorFecha[] => {
    const agrupados = pedidos.reduce((acc, pedido) => {
      const fecha = pedido.fecha_entrega;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(pedido);
      return acc;
    }, {} as Record<string, Pedido[]>);

    return Object.keys(agrupados)
      .sort()
      .map(fecha => ({
        fecha,
        pedidos: agrupados[fecha].sort((a, b) => a.nombre.localeCompare(b.nombre))
      }));
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);
    
    const esHoy = date.toDateString() === hoy.toDateString();
    const esMañana = date.toDateString() === mañana.toDateString();
    
    if (esHoy) {
      return 'HOY';
    } else if (esMañana) {
      return 'MAÑANA';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  const formatearPrecio = (precio: number) => {
    return `$${precio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  };

  const getFechaStyle = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(hoy.getDate() + 1);
    
    const esHoy = date.toDateString() === hoy.toDateString();
    const esMañana = date.toDateString() === mañana.toDateString();
    const esPasado = date < hoy;
    
    if (esPasado) {
      return styles.fechaPasada;
    } else if (esHoy) {
      return styles.fechaHoy;
    } else if (esMañana) {
      return styles.fechaMañana;
    } else {
      return styles.fechaNormal;
    }
  };

  const renderPedido = ({ item }: { item: Pedido }) => (
    <TouchableOpacity
      style={styles.pedidoCard}
      onPress={() => navigation.navigate('proximos-pedidos' as never)}
    >
      <View style={styles.pedidoHeader}>
        <Text style={styles.pedidoNombre}>{item.nombre}</Text>
        <Text style={styles.pedidoPrecio}>{formatearPrecio(item.precio_final)}</Text>
      </View>
      
      <View style={styles.pedidoDetalles}>
        <Text style={styles.pedidoAbonado}>
          Abonado: {formatearPrecio(item.monto_abonado)}
        </Text>
        <Text style={styles.pedidoPendiente}>
          Pendiente: {formatearPrecio(item.precio_final - item.monto_abonado)}
        </Text>
      </View>

      <View style={styles.productosResumen}>
        <Text style={styles.productosText}>
          {item.productos.length} producto{item.productos.length !== 1 ? 's' : ''}
        </Text>
        {item.productos.slice(0, 2).map((producto, index) => (
          <Text key={index} style={styles.productoResumen}>
            • {producto.tipo.toUpperCase()}
            {producto.sabor && ` - ${producto.sabor}`}
            {producto.cantidad && ` (${producto.cantidad})`}
          </Text>
        ))}
        {item.productos.length > 2 && (
          <Text style={styles.masProductos}>
            +{item.productos.length - 2} más...
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFecha = ({ item }: { item: PedidoPorFecha }) => (
    <View style={styles.fechaContainer}>
      <View style={[styles.fechaHeader, getFechaStyle(item.fecha)]}>
        <Text style={styles.fechaTexto}>{formatearFecha(item.fecha)}</Text>
        <Text style={styles.fechaCantidad}>
          {item.pedidos.length} pedido{item.pedidos.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={item.pedidos}
        renderItem={renderPedido}
        keyExtractor={(pedido) => pedido.id!.toString()}
        scrollEnabled={false}
        contentContainerStyle={styles.pedidosContainer}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando calendario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendario de Pedidos</Text>
        <TouchableOpacity
          style={styles.nuevoPedidoBtn}
          onPress={() => navigation.navigate('nuevo-pedido' as never)}
        >
          <Text style={styles.nuevoPedidoBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {pedidosPorFecha.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay pedidos programados</Text>
          <TouchableOpacity
            style={styles.crearPedidoBtn}
            onPress={() => navigation.navigate('nuevo-pedido' as never)}
          >
            <Text style={styles.crearPedidoBtnText}>Crear Primer Pedido</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pedidosPorFecha}
          renderItem={renderFecha}
          keyExtractor={(item) => item.fecha}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.light.cardBackground,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
  },
  nuevoPedidoBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nuevoPedidoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: Colors.light.inputText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.light.inputText,
    marginBottom: 20,
    textAlign: 'center',
  },
  crearPedidoBtn: {
    backgroundColor: Colors.light.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  crearPedidoBtnText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  fechaContainer: {
    marginBottom: 24,
  },
  fechaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  fechaNormal: {
    backgroundColor: Colors.light.cardBackground,
  },
  fechaHoy: {
    backgroundColor: Colors.light.buttonPrimary,
  },
  fechaMañana: {
    backgroundColor: Colors.light.buttonSecondary,
  },
  fechaPasada: {
    backgroundColor: '#E0E0E0',
  },
  fechaTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  fechaCantidad: {
    fontSize: 14,
    fontWeight: '600',
  },
  pedidosContainer: {
    paddingLeft: 8,
  },
  pedidoCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.buttonPrimary,
    shadowColor: Colors.light.buttonSecondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pedidoNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    flex: 1,
  },
  pedidoPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.buttonPrimary,
  },
  pedidoDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pedidoAbonado: {
    fontSize: 12,
    color: Colors.light.inputText,
  },
  pedidoPendiente: {
    fontSize: 12,
    color: Colors.light.buttonPrimary,
    fontWeight: 'bold',
  },
  productosResumen: {
    marginTop: 4,
  },
  productosText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.light.titleColor,
    marginBottom: 4,
  },
  productoResumen: {
    fontSize: 11,
    color: Colors.light.inputText,
    marginBottom: 2,
  },
  masProductos: {
    fontSize: 11,
    color: Colors.light.buttonPrimary,
    fontStyle: 'italic',
  },
}); 